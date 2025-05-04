from typing import List
from enum import Enum

from sqlmodel import SQLModel
from typing_extensions import Optional

from app.schema.user import BaseUser
from pydantic import field_validator

class OrderErrorType(str, Enum):
    BOOK_NOT_FOUND = "book_not_found"
    PRICE_CHANGED = "price_changed"
    DISCOUNT_EXPIRED = "discount_expired"
    NEW_DISCOUNT = "new_discount"

class Item(SQLModel):
    book_id: int
    quantity: int
    price: Optional[float]

    @field_validator('quantity')
    @classmethod
    def quantity_must_be_valid(cls, v):
        if not (1 <= v <= 8):
            raise ValueError('Quantity must be between 1 and 8')
        return v

class OrderRequest(SQLModel):
    list_item : List[Item]

class OrderResponse(SQLModel):
    list_item : List[Item]
    final_price: float
    user : BaseUser
    errors: Optional[dict] = None