"""
Order Management Routes

This module handles all order-related endpoints for the BookWorm API.
It provides functionality for creating and managing book orders.

Endpoints:
- POST /orders: Create a new book order

Features:
- Authentication required for placing orders
- Order validation and processing
- Integration with user accounts

Version: 1.0.0
"""

from typing import Annotated

from app.model.user import User
from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import SessionDep, get_current_user
from app.schema.order import OrderRequest, OrderResponse
from app.service import order_service

router = APIRouter(
    prefix="/orders", 
    tags=["orders"],
    responses={
        401: {"description": "Unauthorized"},
        404: {"description": "Not found"},
        422: {"description": "Validation error"}
    }
)

@router.post(
    "", 
    response_model=OrderResponse,
    summary="Create order",
    description="Create a new book order for the current user",
    responses={
        200: {"description": "Order created successfully"},
        401: {"description": "Not authenticated"},
        400: {"description": "Invalid order data"}
    }
)
def create_order(
    *, 
    session: SessionDep, 
    req: OrderRequest, 
    current_user: Annotated[User, Depends(get_current_user)]
) -> OrderResponse:
    """
    Create a new book order for the authenticated user.
    
    Args:
        session: Database session
        req: Order request data containing books and quantities
        current_user: Authenticated user placing the order
        
    Returns:
        OrderResponse: Created order details
        
    Raises:
        HTTPException: If user not authenticated or order validation fails
    """
    if not current_user:
        raise HTTPException(status_code=404, detail="Not authenticated")
    return order_service.place_order(session=session, req=req, current_user=current_user)