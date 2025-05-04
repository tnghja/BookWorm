"""
Author Management Routes

This module handles all author-related endpoints for the BookWorm API.
It provides functionality for retrieving book authors.

Endpoints:
- GET /authors: List all book authors

Features:
- Author listing for book attribution
- Support for book filtering by author

Version: 1.0.0
"""

from typing import List

from fastapi import APIRouter

from app.api.dependencies import SessionDep
from app.model.author import Author
from app.service import author_service

router = APIRouter(
    prefix="/authors",
    tags=["authors"],
    responses={
        404: {"description": "Not found"},
        500: {"description": "Internal server error"}
    }
)

@router.get(
    '',
    response_model=List[Author],
    summary="List authors",
    description="Retrieve all available book authors",
    responses={
        200: {"description": "Authors retrieved successfully"}
    }
)
def get_authors(*, session: SessionDep) -> List[Author]:
    """
    Retrieve all available book authors.
    
    Args:
        session: Database session
        
    Returns:
        List[Author]: List of all book authors
    """
    return author_service.get_authors(session=session)