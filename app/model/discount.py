
from datetime import date
from decimal import Decimal
from typing import Optional, TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .book import Book


class Discount(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    book_id: int = Field(foreign_key="book.id", index=True)
    discount_start_date: date
    discount_end_date: date
    discount_price: Decimal = Field(max_digits=5, decimal_places=2)


    book: "Book" = Relationship(back_populates="discounts")