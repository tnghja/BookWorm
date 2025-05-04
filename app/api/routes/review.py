"""
Book Review Routes

This module handles all review-related endpoints for the BookWorm API.
It provides functionality for retrieving and creating book reviews.

Endpoints:
- GET /reviews/{book_id}: Get reviews for a specific book
- POST /reviews/{book_id}: Create a new review for a book

Features:
- Pagination support for reviews
- Authentication required for creating reviews
- Rating system integration
- Review filtering options

Version: 1.0.0
"""

from typing import Optional, Literal

from fastapi import APIRouter, Depends, Query, HTTPException

from app.api.dependencies import get_current_user
from app.api.dependencies import SessionDep
from app.schema.review import ReviewResponse, ReviewRequest, ReviewCreateRequest
from app.service.review_service import get_reviews_for_book, create_review
from app.model.review import BaseReview
import app.service.review_service as review_service

router = APIRouter(
    prefix="/reviews", 
    tags=["reviews"],
    responses={
        401: {"description": "Unauthorized"},
        404: {"description": "Book not found"},
        422: {"description": "Validation error"}
    }
)

@router.get(
    "/{book_id}",
    response_model=ReviewResponse,
    summary="Get book reviews",
    description="Retrieve reviews for a specific book with pagination",
    responses={
        200: {"description": "Reviews retrieved successfully"},
        422: {"description": "Invalid parameters"}
    }
)
def get_book_reviews(*,
    book_id: int,
    req : ReviewRequest = Depends(ReviewRequest),
    session: SessionDep
) -> ReviewResponse:
    """
    Retrieve reviews for a specific book with pagination.
    
    Args:
        book_id: ID of the book to get reviews for
        req: Review request with pagination parameters
        session: Database session
        
    Returns:
        ReviewResponse: Paginated list of reviews for the book
        
    Raises:
        HTTPException: If book not found or parameters invalid
    """
    try:
        return get_reviews_for_book(session=session, book_id=book_id, req=req)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

@router.post(
    "/{book_id}",
    response_model=BaseReview,
    summary="Create review",
    description="Create a new review for a specific book",
    responses={
        200: {"description": "Review created successfully"},
        401: {"description": "Authentication required"},
        422: {"description": "Validation error"}
    }
)
def create_review(
    book_id : int, 
    session : SessionDep, 
    req : ReviewCreateRequest, 
    user = Depends(get_current_user)
) -> BaseReview:
    """
    Create a new review for a specific book.
    
    Args:
        book_id: ID of the book to review
        session: Database session
        req: Review creation data (rating, text)
        user: Authenticated user creating the review
        
    Returns:
        BaseReview: Created review data
        
    Raises:
        HTTPException: If validation fails or user not authenticated
    """
    try:
        return review_service.create_review(book_id=book_id, session=session, req=req, user=user)
    except (ValueError, TypeError) as e:
        raise HTTPException(status_code=422, detail=str(e))
