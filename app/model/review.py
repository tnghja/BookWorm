# models/review.py

from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import func
from sqlmodel import Field, Relationship, SQLModel, Column, DateTime

from app.model.book import Book


class BaseReview(SQLModel):
    # review_id: int = Field(default=None)
    review_title: str = Field(max_length=120)
    review_details: Optional[str] = Field(default=None)
    review_date: datetime = Field(
        sa_column=Column(DateTime, nullable=False, server_default=func.now())
    )
    rating_start: int

class Review(BaseReview, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    book_id: int = Field(foreign_key="book.id", index=True)

    book: "Book" = Relationship(back_populates="reviews")