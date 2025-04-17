
from typing import List, Optional, TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

from ..schema.user import BaseUser

if TYPE_CHECKING:
    from .order import Order



class User(BaseUser, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    password: str
    refresh_token : str | None
    orders: list["Order"] = Relationship(back_populates="user")






