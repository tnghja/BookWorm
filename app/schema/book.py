from typing import Literal, Optional, List, Any
from decimal import Decimal

from pydantic import field_validator

from app.model.book import Book
from sqlmodel import SQLModel, Field
class BasePagination(SQLModel):
    count: int
    current_page: int
    items_per_page: int
    total_pages: int
    start_item: int
    end_item: int

class BookListRequest(SQLModel):
    page: int = Field(default=1, ge=1)
    items_per_page: int = Field(default=20)
    @field_validator('items_per_page')
    def cast_and_validate_items_per_page(cls, v: Any) -> int:
        try:
            v = int(v)
        except (ValueError, TypeError):
            raise ValueError("items_per_page must be an integer")

        if v not in [5, 15, 20, 25]:
            raise ValueError("items_per_page must be one of [5, 15, 20, 25]")
        return v
    # Category filter - accepts category name
    category_name: Optional[str] = Field(default=None, max_length=100)
    # Author filter - accepts author name
    author_name: Optional[str] = Field(default=None, max_length=100)
    # Rating filter - accepts minimum rating (1-5 stars)
    min_rating: Optional[int] = Field(default=None, ge=1, le=5)
    # Sorting options
    sort_by: Optional[Literal['on_sale', 'popularity', 'price_asc', 'price_desc', 'recommend']] = Field(default='on_sale')
    limit : Optional[int] = Field(default=None, ge=1)

class BookInfo(SQLModel):
    book: Book
    final_price: Decimal = None
    # discount_price: Optional[Decimal]
    discount_amount: Decimal = None
    avg_rating: Optional[float] = None
    review_count: int = 0  # Default to 0 if no reviews
    author_name: Optional[str] = Field(default=None, max_length=100)
    category_name: Optional[str] = Field(default=None, max_length=100)
class BookListResponse(BasePagination):
    books: List[BookInfo]

