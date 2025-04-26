from typing import Optional, Literal

from fastapi import APIRouter, Depends, Query, HTTPException

from app.api.dependencies import get_current_user
from app.api.dependencies import SessionDep
from app.schema.review import ReviewResponse, ReviewRequest, ReviewCreateRequest
from app.service.review_service import get_reviews_for_book, create_review
from app.model.review import BaseReview
import app.service.review_service as review_service

router = APIRouter(prefix="/reviews", tags=["reviews"])

@router.get("/{book_id}", response_model=ReviewResponse)
def get_book_reviews(*,
    book_id: int,
    req : ReviewRequest = Depends(ReviewRequest),
    session: SessionDep
) -> ReviewResponse:
    try:
        return get_reviews_for_book(session=session, book_id=book_id, req=req)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

@router.post("/{book_id}", response_model=BaseReview)
def create_review(book_id : int , session : SessionDep, req : ReviewCreateRequest, user = Depends(get_current_user)) -> BaseReview:
    try:
        return review_service.create_review(book_id=book_id, session=session, req=req, user=user)
    except (ValueError, TypeError) as e:
        raise HTTPException(status_code=422, detail=str(e))
