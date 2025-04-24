from typing import Optional, List, Literal, Any
from datetime import datetime
from pydantic import field_validator
from sqlalchemy import func
from sqlmodel import Field, SQLModel, Column, DateTime

from app.schema.book import BasePagination
from app.model.review import    Review

class ReviewCreateRequest(SQLModel):
    title: str = Field(..., description="Review title")
    details: Optional[str] = Field(default=None, nullable=True, description="Review details")
    star: int = Field(..., ge=1, le=5, description="Rating from 1 to 5 stars")

    @field_validator('star')
    def validate_star(cls, v: Any) -> int:
        try:
            v = int(v)
        except (ValueError, TypeError):
            raise ValueError("Star rating must be an integer")
        if v not in range(1, 6):
            raise ValueError("Star rating must be between 1 and 5")
        return v
class ReviewRequest(SQLModel):
    page: int = Field(default=1, ge=1, description="Page number")
    items_per_page: int = Field(
        default=20,
        description="Number of items per page (5, 15, 20, or 25)"
    )
    star: Optional[int] = Field(
        default=None,
        ge=1,
        le=5,
        description="Filter by star rating (1-5)"
    )
    sort_by: Optional[Literal['newest', 'oldest']] = Field(
        default='newest',
        description="Sort reviews by date"
    )

    @field_validator('items_per_page')
    def validate_items_per_page(cls, v: Any) -> int:
        try:
            v = int(v)
        except (ValueError, TypeError):
            raise ValueError("Items per page must be an integer")
        if v not in [5, 15, 20, 25]:
            raise ValueError("Items per page must be one of: 5, 15, 20, or 25")
        return v
class ReviewResponse(BasePagination):
    avg_rating: Optional[float] = Field(default=0, nullable=True)
    reviews_count: Optional[int] = Field(default=0, nullable=True)
    five_stars: Optional[int] = Field(default=0, nullable=True)
    four_stars: Optional[int] = Field(default=0, nullable=True)
    three_stars: Optional[int] = Field(default=0, nullable=True)
    two_stars: Optional[int] = Field(default=0, nullable=True)
    one_stars: Optional[int] = Field(default=0, nullable=True)
    reviews : List[Review]
