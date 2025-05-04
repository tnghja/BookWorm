"""
Book Management Routes

This module handles all book-related endpoints for the BookWorm API.
It provides functionality for retrieving and searching books with various filtering and sorting options.

Endpoints:
- GET /books: List all books with filtering, sorting, and pagination
- GET /books/top-sale: Get top selling books
- GET /books/most_reviews: Get most reviewed books
- GET /books/recommend: Get recommended books
- GET /books/{book_id}: Get detailed information about a specific book

Features:
- Advanced filtering by category, author, and rating
- Multiple sorting options
- Pagination support
- Recommendation engine integration

Version: 1.0.0
"""

from typing import Any, Annotated, Optional, Literal

from fastapi import APIRouter, Depends, Query, Request

from app.api.dependencies import SessionDep
from app.model import Book
from app.schema.book import BookListResponse
from app.service.book_service import get_books, get_book
from app.schema.book import BookListRequest, BookInfo

router = APIRouter(
    prefix="/books", 
    tags=["books"],
    responses={
        404: {"description": "Book not found"},
        400: {"description": "Invalid parameters"},
        500: {"description": "Internal server error"}
    }
)


@router.get(
    "",
    response_model=BookListResponse,
    summary="List books",
    description="Retrieve a list of books with filtering, sorting and pagination options",
    responses={
        200: {"description": "List of books retrieved successfully"}
    }
)
def list_books(
    session : SessionDep,
    req : BookListRequest = Depends(BookListRequest),
) -> Any:
    """
    Retrieve a list of books with filtering, sorting and pagination.
    
    Args:
        session: Database session
        request: FastAPI request object
        req: Book list request with filtering and sorting parameters
        
    Returns:
        BookListResponse: Paginated list of books matching the criteria
    
    Filtering options:
    - category_name: Filter books by category name
    - author_name: Filter books by author name
    - rating: Filter books by average rating (1-5 stars)
    
    Sorting options:
    - sort_by: Sort by on_sale, popularity
    - sort_order: Sort in ascending (asc) or descending (desc) order
    """
    result = get_books(session=session, req=req)
    return result


@router.get(
    "/top-sale",
    response_model=BookListResponse,
    summary="Top selling books",
    description="Get a list of top selling books",
    responses={
        200: {"description": "Top selling books retrieved successfully"}
    }
)
def top_books(
    session : SessionDep
) -> BookListResponse:
    """
    Get a list of top selling books.
    
    Args:
        session: Database session
        request: FastAPI request object
        
    Returns:
        BookListResponse: List of top 10 best-selling books
    """
    req = BookListRequest(
        sort_by='on_sale',
        limit=10
    )
    return get_books(session=session, req=req)


@router.get(
    "/most_reviews",
    response_model=BookListResponse,
    summary="Most reviewed books",
    description="Get a list of books with the most reviews",
    responses={
        200: {"description": "Most reviewed books retrieved successfully"}
    }
)
def popular_books(
    session : SessionDep
) -> BookListResponse:
    """
    Get a list of books with the most reviews.
    
    Args:
        session: Database session
        request: FastAPI request object
        
    Returns:
        BookListResponse: List of 8 most reviewed books
    """
    req = BookListRequest(
        sort_by='popularity',
        limit=8
    )
    return get_books(session=session, req=req)


@router.get(
    "/recommend",
    response_model=BookListResponse,
    summary="Recommended books",
    description="Get a list of recommended books",
    responses={
        200: {"description": "Recommended books retrieved successfully"}
    }
)
def recommend_books(
    session : SessionDep
) -> BookListResponse:
    """
    Get a list of recommended books.
    
    Args:
        session: Database session
        request: FastAPI request object
        
    Returns:
        BookListResponse: List of 8 recommended books
    """
    req = BookListRequest(
        sort_by='recommend',
        limit=8
    )
    return get_books(session=session, req=req)


@router.get(
    "/{book_id}",
    response_model=BookInfo,
    summary="Get book details",
    description="Get detailed information about a specific book",
    responses={
        200: {"description": "Book details retrieved successfully"},
        404: {"description": "Book not found"}
    }
)
def book(session : SessionDep, book_id: int) -> BookInfo:
    """
    Get detailed information about a specific book.
    
    Args:
        session: Database session
        request: FastAPI request object
        book_id: ID of the book to retrieve
        
    Returns:
        BookInfo: Detailed book information
        
    Raises:
        HTTPException: If book not found
    """
    return get_book(session=session, book_id=book_id)

