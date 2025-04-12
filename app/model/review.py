# models/review.py

from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import func
from sqlmodel import Field, Relationship, SQLModel, Column, DateTime

if TYPE_CHECKING:
    from .book import Book


class Review(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    book_id: int = Field(foreign_key="book.id", index=True)
    review_title: str = Field(max_length=120)
    review_details: Optional[str] = Field(default=None)

    review_date: datetime = Field(
        sa_column=Column(DateTime, nullable=False, server_default=func.now())
    )
    review_star: int

    book: "Book" = Relationship(back_populates="reviews")