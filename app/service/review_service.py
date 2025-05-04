from datetime import datetime
from typing import List, Dict, Tuple

from fastapi import HTTPException
from app.model import Order, OrderItem
from app.model import User
from sqlalchemy import func, desc, asc
from sqlmodel import select

from app.api.dependencies import SessionDep
from app.model.review import Review, BaseReview
from app.schema.review import ReviewResponse, ReviewRequest, ReviewCreateRequest


def get_star_distribution(session: SessionDep, book_id: int) -> Dict[int, int]:
    """Get the distribution of star ratings for a book"""
    query = (
        select(Review.rating_start, func.count(Review.id))
        .where(Review.book_id == book_id)
        .group_by(Review.rating_start)
    )
    
    results = session.exec(query).all()
    
    # Initialize counts for all star ratings (1-5)
    star_counts = { i : 0 for i in range(1,6)}
    
    # Update with actual counts
    for rating, count in results:
        star_counts[rating] = count
    
    return star_counts


def get_review_stats(session: SessionDep, book_id: int) -> Tuple[float, int]:
    """Get average rating and total review count for a book"""
    query = (
        select(
            func.avg(Review.rating_start).label("avg_rating"),
            func.count(Review.id).label("total_reviews")
        )
        .where(Review.book_id == book_id)
    )
    
    result = session.exec(query).first()
    avg_rating = float(result[0]) if result[0] is not None else 0.0
    total_reviews = result[1] if result[1] is not None else 0
    
    return avg_rating, total_reviews


def _build_base_review_query(book_id: int, req: ReviewRequest):
    """Build the base query for reviews with filters and sorting."""
    # Base query for reviews
    query = select(Review).where(Review.book_id == book_id)
    
    # Apply star filter if specified
    if req.star is not None:
        query = query.where(Review.rating_start == req.star)
    
    # Apply sorting
    if req.sort_by == 'newest':
        query = query.order_by(desc(Review.review_date))
    elif req.sort_by == 'oldest':
        query = query.order_by(asc(Review.review_date))
        
    return query


def _apply_pagination(session: SessionDep, query, req: ReviewRequest):
    """Apply pagination and get count information."""
    # Get total count for pagination
    count_query = select(func.count()).select_from(query.subquery())
    total_count = session.exec(count_query).one()
    
    # Calculate pagination
    offset = (req.page - 1) * req.items_per_page
    total_pages = (total_count + req.items_per_page - 1) // req.items_per_page if total_count else 0
    
    # Apply pagination
    query = query.offset(offset).limit(req.items_per_page)
    
    return query, total_count, offset, total_pages


def _prepare_pagination_info(total_count: int, offset: int, req: ReviewRequest):
    """Prepare pagination information for response."""
    if total_count > 0:
        start_item = offset + 1
        end_item = min(offset + req.items_per_page, total_count)
    else:
        start_item = 0
        end_item = 0
    
    return start_item, end_item


def get_reviews_for_book(session: SessionDep, book_id: int, req: ReviewRequest) -> ReviewResponse:
    """
    Get reviews for a book with filtering and sorting options.
    Includes star distribution and average rating.
    """
    # 1. Build the base query with filters and sorting
    query = _build_base_review_query(book_id, req)
    
    # 2. Apply pagination and get count info
    query, total_count, offset, total_pages = _apply_pagination(session, query, req)
    
    # 3. Get pagination info for response
    start_item, end_item = _prepare_pagination_info(total_count, offset, req)
    
    # 4. Execute query
    reviews = session.exec(query).all()
    
    # 5. Get star distribution and stats
    star_counts = get_star_distribution(session, book_id)
    avg_rating, total_reviews = get_review_stats(session, book_id)
    
    return ReviewResponse(
        reviews=reviews,
        count=total_count,
        current_page=req.page,
        items_per_page=req.items_per_page,
        total_pages=total_pages,
        start_item=start_item,
        end_item=end_item,
        avg_rating=avg_rating,
        reviews_count=total_reviews,
        five_stars=star_counts[5],
        four_stars=star_counts[4],
        three_stars=star_counts[3],
        two_stars=star_counts[2],
        one_stars=star_counts[1]
    )


def _check_purchase_eligibility(session: SessionDep, book_id: int, user_id: int):
    """Check if user has purchased the book and is eligible to review it."""
    user_orders_subquery = (
        select(Order.id)
        .where(Order.user_id == user_id)
        .scalar_subquery()
    )

    stmt = (
        select(OrderItem)
        .where(OrderItem.order_id.in_(user_orders_subquery))
        .where(OrderItem.book_id == book_id)
    )

    purchased_item = session.exec(stmt).first()
    
    if not purchased_item:
        raise HTTPException(
            status_code=403,
            detail="User has not purchased this book"
        )


def create_review(book_id: int, user: User, session: SessionDep, req: ReviewCreateRequest) -> BaseReview:
    # Check if user has purchased the book
    _check_purchase_eligibility(session, book_id, user.id)

    # Create review
    review = Review(
        book_id=book_id,
        user_id=user.id,
        review_title=req.title,
        review_details=req.details,
        rating_start=req.star,
        review_date=datetime.today()
    )

    # Add, commit, and refresh the session
    session.add(review)
    session.commit()
    session.refresh(review)

    return review


