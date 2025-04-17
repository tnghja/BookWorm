from typing import Annotated

from app.model.user import User
from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import SessionDep, get_current_user
from app.schema.order import OrderRequest, OrderResponse
from app.service import order_service

router = APIRouter(tags=["order"])

@router.post("/place" , response_model=OrderResponse )
def place_order(*, session : SessionDep, req : OrderRequest, current_user: Annotated[User, Depends(get_current_user)]) -> OrderResponse:
    if not current_user:
        raise HTTPException(status_code=404, detail="Not authenticated")
    print(current_user)
    return order_service.place_order(session = session, req =  req, current_user = current_user)