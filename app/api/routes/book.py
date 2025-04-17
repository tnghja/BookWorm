from typing import Any, Annotated, Optional, Literal

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import SessionDep
from app.model import Book
from app.schema.book import BookListResponse
from app.service.book_service import get_books, get_book
from app.schema.book import BookListRequest, BookInfo

router = APIRouter(prefix="/books", tags=["books"])


@router.get("/", response_model=BookListResponse)
def list_books(
    session : SessionDep,
    req : BookListRequest = Depends(BookListRequest),
) -> Any:
    """
    Retrieve a list of books with filtering, sorting and pagination.
    
    Filtering options:
    - category_name: Filter books by category name
    - author_name: Filter books by author name
    - rating: Filter books by average rating (1-5 stars)
    
    Sorting options:
    - sort_by: Sort by  on_sale, popularity
    - sort_order: Sort in ascending (asc) or descending (desc) order
    """
    result = get_books(session=session, req=req)
    return result
@router.get("/top-sale", response_model=BookListResponse)
def top_books(
session : SessionDep
) -> BookListResponse:
    req = BookListRequest(
        sort_by='on_sale',
        limit=10
    )
    return get_books(session=session, req=req)

@router.get("/most_reviews", response_model=BookListResponse)
def popular_books(
session : SessionDep
) -> BookListResponse:
    req = BookListRequest(
        sort_by='popularity',
        limit=8
    )
    return get_books(session=session, req=req)


@router.get("/recommend", response_model=BookListResponse)
def recommend_books(
session : SessionDep
) -> BookListResponse:
    req = BookListRequest(
        sort_by='recommend',
        limit=8
    )
    return get_books(session=session, req=req)

@router.get("/{book_id}", response_model=BookInfo)
def book(session : SessionDep,book_id: int) -> BookInfo:
    return get_book(session=session, book_id = book_id)

