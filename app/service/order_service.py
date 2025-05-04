from typing import Dict, List, Tuple
from decimal import Decimal
from datetime import datetime
from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import aliased
from sqlmodel import select, or_, desc
import math
from app.api.dependencies import SessionDep
from app.model.user import User
from app.model import Book, Discount, Order, OrderItem
from app.schema.order import OrderRequest, OrderResponse, Item, OrderErrorType
from app.schema.user import BaseUser
from app.service.book_service import _build_discount_price_subquery


def _query_books_with_prices(session: SessionDep, book_ids: List[int], today):
    """Query books with their current prices."""
    discount_price_sq = _build_discount_price_subquery(today)
    final_price = func.coalesce(discount_price_sq, Book.book_price).label("final_price")
    
    query = (
        select(
            Book,
            final_price,
            discount_price_sq.label("discount_price")
        )
        .where(Book.id.in_(book_ids))
    )
    
    return session.exec(query).all()


def _validate_order_items(req_items, book_data):
    """Validate each item: quantity, price match, and discount validity.
    Returns a dictionary of errors keyed by book_id with error type and message."""
    errors = {}
    for item in req_items:
        # Check if the book exists
        if item.book_id not in book_data:
            errors[item.book_id] = {
                "type": OrderErrorType.BOOK_NOT_FOUND
            }
            continue
            
        # If the book has no active discount but client thinks it has
        book_info = book_data[item.book_id]
        client_price = item.price
        current_price = float(book_info["final_price"])
        has_discount = book_info["discount_price"] is not None
        regular_price = float(book_info["book"].book_price)
        
        if not has_discount and client_price is not None and client_price != regular_price:
            errors[item.book_id] = {
                "type": OrderErrorType.DISCOUNT_EXPIRED,
                "old_price": client_price,
                "new_price": current_price
            }
            continue
        
        # Check final price match - only care if the final price changed
        if item.price is not None and abs(client_price - current_price) > 0.01:
            # Determine if this is a new discount or regular price change
            if has_discount and client_price == regular_price:
                # Client has regular price, but now there's a discount
                errors[item.book_id] = {
                    "type": OrderErrorType.NEW_DISCOUNT,
                    "old_price": client_price,
                    "new_price": current_price,
                    "regular_price": regular_price
                }
            else:
                # Regular price change
                errors[item.book_id] = {
                    "type": OrderErrorType.PRICE_CHANGED,
                    "old_price": client_price,
                    "new_price": current_price
                }
    
    return errors


def _create_order_and_items(session: SessionDep, user_id: int, req_items, book_data, quantity_map):
    """Create order and order items."""
    # Calculate total amount
    total_amount = Decimal(str(sum((
        float(book_data[item.book_id]["final_price"]) * quantity_map[item.book_id]
        for item in req_items
    ), 0.0))).quantize(Decimal('0.01'))
    
    # Create order
    order = Order(
        user_id=user_id,
        order_date=datetime.now(),
        order_amount=total_amount
    )
    session.add(order)
    session.flush()  # Get the order ID
    
    # Create order items
    order_items = []
    for item in req_items:
        book_info = book_data[item.book_id]
        order_item = OrderItem(
            order_id=order.id,
            book_id=item.book_id,
            quantity=item.quantity,
            price=Decimal(str(book_info["final_price"])).quantize(Decimal('0.01'))
        )
        order_items.append(order_item)
    
    session.add_all(order_items)
    
    return order, total_amount


def _prepare_response(req_items, book_data, total_amount, current_user: User, validation_errors=None):
    """Prepare the order response."""
    response_items = [
        Item(
            book_id=item.book_id,
            quantity=item.quantity,
            price=float(book_data[item.book_id]["final_price"]) if item.book_id in book_data else None
        )
        for item in req_items
    ]
    
    base_user = BaseUser(
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name
    )
    
    response = OrderResponse(
        list_item=response_items,
        final_price=float(total_amount),
        user=base_user
    )
    
    if validation_errors:
        response.errors = validation_errors
    
    return response


def place_order(session: SessionDep, req: OrderRequest, current_user: User | BaseUser) -> OrderResponse:
    try:
        today = datetime.now().date()
        
        # 1. Extract book IDs and quantities
        book_ids = [item.book_id for item in req.list_item]
        quantity_map = {item.book_id: item.quantity for item in req.list_item}
        
        # 2. Query books with their current prices
        books_with_prices = _query_books_with_prices(session, book_ids, today)
        
        # 3. Create a map of book data for easy access
        book_data: Dict[int, Dict] = {}
        for row in books_with_prices:
            book = row.Book
            book_data[book.id] = {
                "book": book,
                "final_price": row.final_price,
                "discount_price": row.discount_price
            }
        
        # 4. Validate each item and collect errors
        validation_errors = _validate_order_items(req.list_item, book_data)
        
        # 5. Create order and order items if there are no errors
        if not validation_errors:
            _, total_amount = _create_order_and_items(
                session, 
                current_user.id, 
                req.list_item, 
                book_data, 
                quantity_map
            )
            
            # 6. Commit transaction
            session.commit()
        else:
            # Calculate total for items that don't have errors
            valid_items = [item for item in req.list_item if item.book_id not in validation_errors and item.book_id in book_data]
            total_amount = Decimal(str(sum((
                float(book_data[item.book_id]["final_price"]) * quantity_map[item.book_id]
                for item in valid_items
            ), 0.0))).quantize(Decimal('0.01'))
        
        # 7. Prepare response with any validation errors
        return _prepare_response(req.list_item, book_data, total_amount, current_user, validation_errors)
        
    except Exception as e:
        session.rollback()
        print(f"Order placement failed: {str(e)}")  # Add logging for debugging
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to place order: {str(e)}"
        )
