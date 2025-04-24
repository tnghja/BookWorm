from fastapi import APIRouter

from app.api.routes import  login, private, users, utils, book, review, order, category, author
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(book.router)

api_router.include_router(order.router)
api_router.include_router(category.router)
api_router.include_router(review.router)

api_router.include_router(author.router)