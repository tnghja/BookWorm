"""
Utility Routes

This module provides utility endpoints for the BookWorm API.
It includes health check and other system status endpoints.

Endpoints:
- GET /utils/health-check: Check API health status

Features:
- System health monitoring
- Diagnostic tools

Version: 1.0.0
"""

from fastapi import APIRouter, Depends
from pydantic.networks import EmailStr
from app.schema.token import Message


router = APIRouter(
    prefix="/utils", 
    tags=["utils"],
    responses={
        500: {"description": "Internal server error"}
    }
)


@router.get(
    "/health-check/", 
    summary="Health check", 
    description="Check if the API is functioning properly",
    responses={
        200: {"description": "API is healthy"}
    }
)
async def health_check() -> bool:
    """
    Perform a health check on the API.
    
    Returns:
        bool: True if the API is functioning properly
    """
    return True
