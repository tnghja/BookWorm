from decimal import Decimal
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Column, Numeric
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .order import Order
    from .book import Book

class OrderItem(SQLModel, table=True):
    """Represents the order_item table"""
    id: Optional[int] = Field(default=None, primary_key=True)
    order_id: int = Field(foreign_key="order.id", index=True)
    book_id: int = Field(foreign_key="book.id", index=True)
    quantity: int # smallint maps to int
    price: Decimal = Field(max_digits=5, decimal_places=2) # Price at the time of order

    # Relationship: Many-to-One with Order
    order: "Order" = Relationship(back_populates="items")
    # Relationship: Many-to-One with Book
    book: "Book" = Relationship(back_populates="order_items")