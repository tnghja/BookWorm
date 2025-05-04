"""
Private API Routes

This module provides administrative and testing endpoints for the BookWorm API.
These endpoints are intended for internal use only and are not part of the public API.

Endpoints:
- POST /private/users/: Create a user directly (bypassing standard registration)

Security:
- These endpoints should be protected or disabled in production
- Intended for testing, seeding data, or administrative purposes

Version: 1.0.0
"""

from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from app.api.dependencies import SessionDep
from app.core.security import get_password_hash
from app.schema.user import UserPublic
from app.model.user import User

router = APIRouter(
    tags=["private"], 
    prefix="/private",
    responses={
        400: {"description": "Bad request"},
        500: {"description": "Internal server error"}
    }
)


class PrivateUserCreate(BaseModel):
    """
    Schema for direct user creation in private endpoints.
    
    Attributes:
        email: User email address
        password: Raw password (will be hashed)
        full_name: User's full name
        is_verified: Whether the user email is verified
    """
    email: str
    password: str
    full_name: str
    is_verified: bool = False


@router.post(
    "/users/", 
    response_model=UserPublic,
    summary="Create user (private)",
    description="Create a new user directly (administrative endpoint)",
    responses={
        200: {"description": "User created successfully"},
        400: {"description": "Invalid user data"}
    }
)
def create_user(user_in: PrivateUserCreate, session: SessionDep) -> Any:
    """
    Create a new user directly (administrative endpoint).
    
    This endpoint bypasses the standard registration process,
    email verification, and other validation steps.
    
    Args:
        user_in: User creation data
        session: Database session
        
    Returns:
        UserPublic: Created user data
    """
    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
    )

    session.add(user)
    session.commit()

    return user
