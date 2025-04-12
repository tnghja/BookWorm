# models/__init__.py

from .author import Author
from .category import Category
from .user import User
from .book import Book
from .review import Review
from .discount import Discount
from .order import Order, OrderItem

# You can optionally define __all__ to control wildcard imports
__all__ = [
    "Author",
    "Category",
    "User",
    "Book",
    "Review",
    "Discount",
    "Order",
    "OrderItem",
]