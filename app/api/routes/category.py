"""
Book Category Routes

This module handles all category-related endpoints for the BookWorm API.
It provides functionality for retrieving book categories.

Endpoints:
- GET /categories: List all book categories

Features:
- Category listing for book classification
- Support for book filtering by category

Version: 1.0.0
"""

from typing import List

from fastapi import APIRouter

from app.api.dependencies import SessionDep
from app.model.category import Category
from app.service import category_service

router = APIRouter(
    prefix="/categories",
    tags=["category"],
    responses={
        404: {"description": "Not found"},
        500: {"description": "Internal server error"}
    }
)

@router.get(
    '',
    response_model=List[Category],
    summary="List categories",
    description="Retrieve all available book categories",
    responses={
        200: {"description": "Categories retrieved successfully"}
    }
)
def get_categories(*, session: SessionDep) -> List[Category]:
    """
    Retrieve all available book categories.
    
    Args:
        session: Database session
        
    Returns:
        List[Category]: List of all book categories
    """
    return category_service.get_categories(session=session)