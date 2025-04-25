from typing import Dict
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
from app.schema.order import OrderRequest, OrderResponse, Item
from app.schema.user import BaseUser


def place_order(session: SessionDep, req: OrderRequest, current_user: User) -> OrderResponse:
    try:
        today = datetime.now().date()
        
        # 1. Create a list of book IDs and quantity mapping
        book_ids = [item.book_id for item in req.list_item]
        quantity_map = {item.book_id: item.quantity for item in req.list_item}
        
        # 2. Set up discount price subquery
        ActiveDiscount = aliased(Discount)
        discount_price_sq = (
            select(ActiveDiscount.discount_price)
            .where(
                (ActiveDiscount.book_id == Book.id) &
                (ActiveDiscount.discount_start_date <= today) &
                or_(
                    ActiveDiscount.discount_end_date >= today,
                    ActiveDiscount.discount_end_date.is_(None)
                )
            )
            .order_by(desc(ActiveDiscount.discount_start_date))
            .limit(1)
            .scalar_subquery()
            .label("discount_price")
        )
        
        # 3. Calculate final price
        final_price = func.coalesce(discount_price_sq, Book.book_price).label("final_price")
        
        # 4. Build query for books
        query = (
            select(
                Book,
                final_price,
                discount_price_sq.label("discount_price")
            )
            .where(Book.id.in_(book_ids))
        )
        
        # 5. Execute query and check inventory
        books_with_prices = session.exec(query).all()
        
        # Create a map of book data for easy access
        book_data: Dict[int, Dict] = {}
        for row in books_with_prices:
            book = row.Book
            book_data[book.id] = {
                "book": book,
                "final_price": row.final_price,
                "discount_price": row.discount_price
            }
        print(book_data)
        # Validate each item: quantity range, price match, and coupon/discount validity
        for item in req.list_item:
            # Check if the book exists in the fetched data
            if item.book_id not in book_data:
                raise HTTPException(
                    status_code=400,
                    detail=f"Book with id {item.book_id} not found."
                )
            # Check price match
            current_price = float(book_data[item.book_id]["final_price"])
            if item.price is not None and abs(item.price - current_price) > 0.01:
                raise HTTPException(
                    status_code=400,
                    detail=f"Price for book {item.book_id} has changed. Current price: {current_price}, submitted price: {item.price}"
                )
            # Check if discount/coupon has expired (discount_price is None if expired or not present)
            if book_data[item.book_id]["discount_price"] is None and item.price is not None and item.price != float(book_data[item.book_id]["final_price"]):
                raise HTTPException(
                    status_code=400,
                    detail=f"Discount/coupon for book {item.book_id} has expired."
                )
        
        # 6. Create order
        total_amount = Decimal(str(sum((
            float(book_data[item.book_id]["final_price"]) * quantity_map[item.book_id]
            for item in req.list_item
        ), 0.0))).quantize(Decimal('0.01'))
        order = Order(
            user_id=current_user.id,
            order_date=datetime.now(),
            order_amount=total_amount
        )
        session.add(order)
        session.flush()  # Get the order ID
        
        # 7. Create order items and update stock
        order_items = []
        for item in req.list_item:
            book_info = book_data[item.book_id]
            book = book_info["book"]
            
            # Create order item
            order_item = OrderItem(
                order_id=order.id,
                book_id=item.book_id,
                quantity=item.quantity,
                price=Decimal(str(book_info["final_price"])).quantize(Decimal('0.01'))
            )
            order_items.append(order_item)

        
        session.add_all(order_items)
        
        # 8. Commit transaction
        session.commit()
        
        # 9. Prepare response
        response_items = [
            Item(
                book_id=item.book_id,
                quantity=item.quantity,
                price=float(book_data[item.book_id]["final_price"])
            )
            for item in req.list_item
        ]
        user = BaseUser(
            email = current_user.email,
            first_name=current_user.first_name,
            last_name=current_user.last_name
        )
        return OrderResponse(
            list_item=response_items,
            final_price=float(total_amount),
            user=current_user
        )
        
    except Exception as e:
        session.rollback()
        print(f"Order placement failed: {str(e)}")  # Add logging for debugging
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to place order: {str(e)}"
        )
