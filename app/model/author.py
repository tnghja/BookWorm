# models/author.py

from typing import List, Optional, TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .book import Book


class Author(SQLModel, table=True):

    id: Optional[int] = Field(default=None, primary_key=True)
    author_name: str = Field(index=True, max_length=255)
    author_bio: Optional[str] = Field(default=None) # TEXT type

    books: List["Book"] = Relationship(back_populates="author")
