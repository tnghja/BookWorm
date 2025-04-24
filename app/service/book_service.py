import datetime


from fastapi import HTTPException, status

# Assuming these imports are correct for your project structure
# from dns.e164 import query # This import seems unused?
from sqlmodel import desc, asc, func, text, select, or_, and_, literal_column, null
from sqlalchemy.orm import aliased
from sqlalchemy.sql.operators import is_
# from sqlmodel import select, Session # Use sqlalchemy.select for core constructs
from sqlmodel import Session # Keep this for SessionDep typing if needed
from werkzeug.exceptions import NotFound

from app.api.dependencies import SessionDep
from app.model import Book, Author, Category, Review, Discount
from app.schema.book import BookListRequest, BookListResponse, BookInfo


def get_books(*, session : SessionDep, req: BookListRequest) -> BookListResponse:
    """
    Fetches a paginated list of books with filtering, sorting, and pagination.
    Steps:
    1. Build base query with all necessary fields
    2. Apply filters
    3. Apply sorting
    4. Apply pagination
    """
    today = datetime.date.today()

    # --- 1. Build base query components ---
    
    # Discount price subquery
    ActiveDiscount = aliased(Discount)

    discount_price_sq = (
        select(ActiveDiscount.discount_price)
        .where(
            (ActiveDiscount.book_id == Book.id) &
            (ActiveDiscount.discount_start_date <= today) &
            or_(
                ActiveDiscount.discount_end_date >= today,
                ActiveDiscount.discount_end_date.is_(None)
            )
        )
        .order_by(desc(ActiveDiscount.discount_start_date))
        .limit(1)
        .scalar_subquery()
        .label("discount_price") # Label the subquery itself for easier reference
    )

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
    query = (
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

    # --- 2. Apply filters ---

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

    # --- 3. Apply sorting ---
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

    # --- 4. Get total count for pagination ---
    count_query = select(func.count()).select_from(query.subquery())
    total = session.exec(count_query).one()

    # --- 5. Apply pagination ---
    offset = (req.page - 1) * req.items_per_page
    limit = req.limit if req.limit else req.items_per_page
    query = query.offset(offset).limit(limit)

    # Execute query
    rows = session.exec(query).all()
    
    # Process results
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

    # Prepare pagination info
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

def get_book(*, session: SessionDep, book_id: int) -> BookInfo:
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
        .order_by(desc(ActiveDiscount.discount_start_date))
        .limit(1)
    )
    
    discount_price = session.exec(discount_stmt).first()
    return BookInfo(
        book=book,
        author_name=book.author.author_name ,
        category_name=book.category.category_name,
        discount_price=discount_price if discount_price is not None else 0,
        final_price = book.book_price - ( discount_price if discount_price is not None else 0)  
    )


