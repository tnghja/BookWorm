# models/category.py

from typing import List, Optional, TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

# Use TYPE_CHECKING to avoid circular import errors for type hints
if TYPE_CHECKING:
    from .book import Book


class Category(SQLModel, table=True):

    id: Optional[int] = Field(default=None, primary_key=True)
    category_name: str = Field(index=True, max_length=120)
    category_desc: Optional[str] = Field(default=None, max_length=255)

    books: List["Book"] = Relationship(back_populates="category")