import datetime


from fastapi import HTTPException, status
from sqlmodel import desc, asc, func, text, select, or_, and_, literal_column, null
from sqlalchemy.orm import aliased
from sqlalchemy.sql.operators import is_

from sqlmodel import Session # Keep this for SessionDep typing if needed
from werkzeug.exceptions import NotFound

from app.api.dependencies import SessionDep
from app.model import Book, Author, Category, Review, Discount
from app.schema.book import BookListRequest, BookListResponse, BookInfo
from app.util.currency_change import get_currency_info


def _build_discount_price_subquery(today):
    """Build subquery for active discounts."""
    ActiveDiscount = aliased(Discount)
    return (
        select(ActiveDiscount.discount_price)
        .where(
            (ActiveDiscount.book_id == Book.id) &
            (ActiveDiscount.discount_start_date <= today) &
            or_(
                ActiveDiscount.discount_end_date >= today,
                ActiveDiscount.discount_end_date.is_(None)
            )
        )
        .order_by(asc(ActiveDiscount.discount_price))
        .limit(1)
        .scalar_subquery()
        .label("discount_price")
    )


def _build_base_query(discount_price_sq, today):
    """Build the base query with all necessary fields."""
    # Price calculations
    final_price = func.coalesce(discount_price_sq, Book.book_price).label("final_price")
    discount_amount = (Book.book_price - final_price).label("discount_amount")

    # Review count subquery
    review_count_sq = (
        select(
            Review.book_id,
            func.count(Review.id).label("review_count")
        )
        .group_by(Review.book_id)
        .alias("review_counts")
    )

    # Base query with all fields
    return (
        select(
            Book,
            final_price,
            discount_price_sq.label("discount_price"),
            discount_amount,
            func.coalesce(review_count_sq.c.review_count, 0).label("review_count"),
            func.coalesce(
                select(func.avg(Review.rating_start))
                .where(Review.book_id == Book.id)
                .scalar_subquery(),
                0
            ).label("avg_rating")
        )
        .select_from(Book)
        .outerjoin(review_count_sq, Book.id == review_count_sq.c.book_id)
    )


def _apply_filters(query, req):
    """Apply filters to the query."""
    # Rating filter
    if req.min_rating is not None or req.sort_by == "recommend":
        min_rating = 1 if req.min_rating is None else req.min_rating
        query = query.where(func.coalesce(query.selected_columns.avg_rating, 0) >= min_rating)
    # Category filter
    if req.category_name:
        query = query.join(Category).where(Category.category_name == req.category_name)

    # Author filter
    if req.author_name:
        query = query.join(Author).where(Author.author_name == req.author_name)
    
    return query


def _apply_sorting(query, req, final_price, discount_amount):
    """Apply sorting to the query."""
    sort_by = req.sort_by or "on_sale"
    
    if sort_by == "on_sale":
        query = query.where(discount_amount > 0)
        query = query.order_by(desc(discount_amount), asc(final_price))
    
    elif sort_by == "popularity":
        query = query.order_by(desc("review_count"), asc(final_price))
    
    elif sort_by == "price_asc":
        query = query.order_by(asc(final_price))
    
    elif sort_by == "price_desc":
        query = query.order_by(desc(final_price))
    
    elif sort_by == "recommend":
        query = query.order_by(desc("avg_rating"), asc(final_price))
    
    return query


def _apply_pagination(query, req, session):
    """Apply pagination to the query and get count."""
    # Get total count for pagination
    count_query = select(func.count()).select_from(query.subquery())
    total = session.exec(count_query).one()

    # Apply pagination
    offset = (req.page - 1) * req.items_per_page
    limit = req.limit if req.limit else req.items_per_page
    query = query.offset(offset).limit(limit)
    
    return query, total, offset


def _process_results(rows):
    """Process query results into BookInfo objects."""
    books_with_prices = []
    for row in rows:
        book_info = BookInfo(
            book=row.Book,
            final_price=row.final_price,
            discount_price=row.discount_price,
            discount_amount=row.discount_amount,
            review_count=row.review_count,
            avg_rating=float(row.avg_rating) if row.avg_rating is not None else None,
            author_name=row.Book.author.author_name if row.Book.author else None,
            category_name=row.Book.category.category_name if row.Book.category else None
        )
        books_with_prices.append(book_info)
    
    return books_with_prices


def get_books(*, session : SessionDep, req: BookListRequest) -> BookListResponse:
    """
    Fetches a paginated list of books with filtering, sorting, and pagination.
    """
    today = datetime.date.today()
    
    # 1. Build discount subquery
    discount_price_sq = _build_discount_price_subquery(today)
    
    # 2. Build base query with all necessary fields
    query = _build_base_query(discount_price_sq, today)
    
    # 3. Apply filters
    query = _apply_filters(query, req)
    
    # 4. Apply sorting
    final_price = func.coalesce(discount_price_sq, Book.book_price)
    discount_amount = (Book.book_price - final_price)
    query = _apply_sorting(query, req, final_price, discount_amount)
    
    # 5. Apply pagination and get count
    query, total, offset = _apply_pagination(query, req, session)
    
    # 6. Execute query
    rows = session.exec(query).all()
    
    # 7. Process results
    books_with_prices = _process_results(rows)

    # 8. Prepare pagination info
    total_pages = (total + req.items_per_page - 1) // req.items_per_page if total else 0
    start_item = offset + 1 if total else 0
    end_item = min(offset + req.items_per_page, total)

    return BookListResponse(
        books=books_with_prices,
        count=total,
        current_page=req.page,
        items_per_page=req.items_per_page,
        total_pages=total_pages,
        start_item=start_item,
        end_item=end_item,
    )

def get_book(*, session: SessionDep, book_id: int,) -> BookInfo:
    today = datetime.date.today()
    
    # First, get the book
    book_stmt = select(Book).where(Book.id == book_id)
    book = session.exec(book_stmt).first()
    
    if book is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found"
        )

    # Get the active discount price if any
    ActiveDiscount = aliased(Discount)
    discount_stmt = (
        select(ActiveDiscount.discount_price)
        .where(
            (ActiveDiscount.book_id == book_id) &
            (ActiveDiscount.discount_start_date <= today) &
            or_(
                ActiveDiscount.discount_end_date >= today,
                ActiveDiscount.discount_end_date.is_(None)
            )
        )
        .order_by(asc(ActiveDiscount.discount_price))
        .limit(1)
    )
    
    discount_price = session.exec(discount_stmt).first()
    
    # Get average rating
    avg_rating_stmt = (
        select(func.avg(Review.rating_start))
        .where(Review.book_id == book_id)
    )
    avg_rating = session.exec(avg_rating_stmt).first()
    
    # Get review count
    review_count_stmt = (
        select(func.count(Review.id))
        .where(Review.book_id == book_id)
    )
    review_count = session.exec(review_count_stmt).first() or 0
    
    # Calculate final_price and discount_amount correctly
    final_price = discount_price if discount_price is not None else book.book_price
    discount_amount = book.book_price - final_price if discount_price is not None else 0
    
    return BookInfo(
        book=book,
        final_price=final_price,
        discount_price=discount_price,
        discount_amount=discount_amount,
        avg_rating=float(avg_rating) if avg_rating is not None else None,
        review_count=review_count,
        author_name=book.author.author_name if book.author else None,
        category_name=book.category.category_name if book.category else None
    )


