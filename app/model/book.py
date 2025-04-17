# models/book.py

from decimal import Decimal
from typing import List, Optional, TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

# Import related models under TYPE_CHECKING to prevent circular imports
if TYPE_CHECKING:
    from .category import Category
    from .author import Author
    from .review import Review
    from .discount import Discount
    from .order import OrderItem

class Book(SQLModel, table=True):
    """Represents the book table"""
    id: Optional[int] = Field(default=None, primary_key=True)
    category_id: int = Field(foreign_key="category.id", index=True)  # Remove default=None
    author_id: int = Field(foreign_key="author.id", index=True)  # Remove default=None
    book_title: str = Field(max_length=255)
    book_summary: Optional[str] = Field(default=None)
    book_price: Decimal = Field(max_digits=5, decimal_places=2)
    book_cover_photo: Optional[str] = Field(default=None, max_length=20)

    category: "Category" = Relationship(back_populates="books")
    author: "Author" = Relationship(back_populates="books")
    reviews: List["Review"] = Relationship(back_populates="book")
    discounts: List["Discount"] = Relationship(back_populates="book")
    order_items: List["OrderItem"] = Relationship(back_populates="book")
