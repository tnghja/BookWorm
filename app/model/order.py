from datetime import datetime
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING

from pydantic.v1 import validator
from sqlalchemy import Column, DateTime, func
from sqlmodel import SQLModel, Field, Relationship

from app.model.order_item import OrderItem
if TYPE_CHECKING:
    from .user import User




class Order(SQLModel, table=True):

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    order_date: datetime = Field(
        sa_column=Column(DateTime, nullable=False, server_default=func.now())
    )
    order_amount: Decimal = Field(max_digits=8, decimal_places=2)

    user: "User" = Relationship(back_populates="orders")

    items: List["OrderItem"] = Relationship(back_populates="order")

