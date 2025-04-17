from typing import List

from sqlmodel import SQLModel
from typing_extensions import Optional

from app.schema.user import BaseUser


class Item(SQLModel):
    book_id: int
    quantity: int
    price: Optional[float]
class OrderRequest(SQLModel):
    list_item : List[Item]

class OrderResponse(SQLModel):
    list_item : List[Item]
    final_price: float
    user : BaseUser