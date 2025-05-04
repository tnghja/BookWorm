"""
User Management Routes

This module handles all user-related endpoints for the BookWorm API.
It provides functionality for user management, including CRUD operations and user profile management.

Endpoints:
- GET /users/: List users (admin only)
- POST /users/: Create new user
- GET /users/me: Get current user profile
- PATCH /users/me: Update current user profile
- PATCH /users/me/password: Update current user password
- DELETE /users/me: Delete current user
- POST /users/signup: Register new user
- GET /users/{user_id}: Get specific user
- PATCH /users/{user_id}: Update specific user (admin only)
- DELETE /users/{user_id}: Delete specific user (admin only)

Security:
- Role-based access control
- Password hashing
- User authentication required for most endpoints
- Admin privileges required for certain operations

Version: 1.0.0
"""

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import col, delete, func, select


from app.schema.token import Message
from app.service import user_service

from app.api.dependencies import (
    CurrentUser,
    SessionDep,
    get_current_admin,
)
from app.core.config import settings
from app.core.security import get_password_hash, verify_password
from app.model.user import User
from app.schema.user import UsersPublic, UserCreate, UserPublic, UserUpdateMe, UpdatePassword, UserRegister, UserUpdate



router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden"},
        404: {"description": "Not found"},
        409: {"description": "Conflict"}
    }
)


@router.get(
    "/",
    dependencies=[Depends(get_current_admin)],
    response_model=UsersPublic,
    summary="List users",
    description="Retrieve a list of users (admin only)",
    responses={
        200: {"description": "List of users retrieved successfully"},
        403: {"description": "Not enough privileges"}
    }
)
def read_users(session: SessionDep, skip: int = 0, limit: int = 100) -> Any:
    """
    Retrieve a paginated list of users.
    
    Args:
        session: Database session
        skip: Number of records to skip (for pagination)
        limit: Maximum number of records to return
        
    Returns:
        UsersPublic: List of users with total count
        
    Raises:
        HTTPException: If user doesn't have admin privileges
    """

    count_statement = select(func.count()).select_from(User)
    count = session.exec(count_statement).one()

    statement = select(User).offset(skip).limit(limit)
    users = session.exec(statement).all()

    return UsersPublic(data=users, count=count)

@router.post(
    # "/", dependencies=[Depends(get_current_admin)], response_model=UserPublic
    "/", response_model=UserPublic,
    summary="Create user",
    description="Create a new user in the system",
    responses={
        200: {"description": "User created successfully"},
        400: {"description": "User with this email already exists"}
    }
)
def create_user(*, session: SessionDep, user_in: UserCreate) -> Any:
    """
    Create a new user in the system.
    
    Args:
        session: Database session
        user_in: User creation data
        
    Returns:
        UserPublic: Created user data
        
    Raises:
        HTTPException: If user with email already exists
    """
    user = user_service.get_user_by_email(session=session, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )

    user = user_service.create_user(session=session, user_create=user_in)
    return user


@router.patch(
    "/me",
    response_model=UserPublic,
    summary="Update current user",
    description="Update the current user's profile information",
    responses={
        200: {"description": "User updated successfully"},
        409: {"description": "Email already in use"}
    }
)
def update_user_me(
    *, session: SessionDep, user_in: UserUpdateMe, current_user: CurrentUser
) -> Any:
    """
    Update the current user's profile information.
    
    Args:
        session: Database session
        user_in: User update data
        current_user: Current authenticated user
        
    Returns:
        UserPublic: Updated user data
        
    Raises:
        HTTPException: If email is already in use
    """
    if user_in.email:
        existing_user = user_service.get_user_by_email(session=session, email=user_in.email)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=409, detail="User with this email already exists"
            )
    user_data = user_in.model_dump(exclude_unset=True)
    current_user.sqlmodel_update(user_data)
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user


@router.patch(
    "/me/password",
    response_model=Message,
    summary="Update password",
    description="Update the current user's password",
    responses={
        200: {"description": "Password updated successfully"},
        400: {"description": "Invalid current password or new password same as current"}
    }
)
def update_password_me(
    *, session: SessionDep, body: UpdatePassword, current_user: CurrentUser
) -> Any:
    """
    Update the current user's password.
    
    Args:
        session: Database session
        body: Password update data
        current_user: Current authenticated user
        
    Returns:
        Message: Success message
        
    Raises:
        HTTPException: If current password is incorrect or new password is same as current
    """
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect password")
    if body.current_password == body.new_password:
        raise HTTPException(
            status_code=400, detail="New password cannot be the same as the current one"
        )
    hashed_password = get_password_hash(body.new_password)
    current_user.hashed_password = hashed_password
    session.add(current_user)
    session.commit()
    return Message(message="Password updated successfully")


@router.get(
    "/me",
    response_model=UserPublic,
    summary="Get current user",
    description="Get the current user's profile information",
    responses={
        200: {"description": "User data retrieved successfully"}
    }
)
def read_user_me(current_user: CurrentUser) -> Any:
    """
    Get the current user's profile information.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        UserPublic: Current user data
    """
    return current_user


@router.delete(
    "/me",
    response_model=Message,
    summary="Delete current user",
    description="Delete the current user's account",
    responses={
        200: {"description": "User deleted successfully"},
        403: {"description": "Super users cannot delete themselves"}
    }
)
def delete_user_me(session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Delete the current user's account.
    
    Args:
        session: Database session
        current_user: Current authenticated user
        
    Returns:
        Message: Success message
        
    Raises:
        HTTPException: If user is a superuser
    """
    if current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="Super users are not allowed to delete themselves"
        )
    session.delete(current_user)
    session.commit()
    return Message(message="User deleted successfully")


@router.post(
    "/signup",
    response_model=UserPublic,
    summary="Register user",
    description="Register a new user without authentication",
    responses={
        200: {"description": "User registered successfully"},
        400: {"description": "User with this email already exists"}
    }
)
def register_user(session: SessionDep, user_in: UserRegister) -> Any:
    """
    Register a new user without requiring authentication.
    
    Args:
        session: Database session
        user_in: User registration data
        
    Returns:
        UserPublic: Registered user data
        
    Raises:
        HTTPException: If user with email already exists
    """
    user = user_service.get_user_by_email(session=session, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    user_create = UserCreate.model_validate(user_in)
    user = user_service.create_user(session=session, user_create=user_create)
    return user


@router.get(
    "/{user_id}",
    response_model=UserPublic,
    summary="Get user by ID",
    description="Get a specific user's information by ID",
    responses={
        200: {"description": "User data retrieved successfully"},
        403: {"description": "Not enough privileges"},
        404: {"description": "User not found"}
    }
)
def read_user_by_id(
    user_id: uuid.UUID, session: SessionDep, current_user: CurrentUser
) -> Any:
    """
    Get a specific user's information by ID.
    
    Args:
        user_id: UUID of the user to retrieve
        session: Database session
        current_user: Current authenticated user
        
    Returns:
        UserPublic: User data
        
    Raises:
        HTTPException: If user doesn't have privileges or user not found
    """
    user = session.get(User, user_id)
    if user == current_user:
        return user
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="The user doesn't have enough privileges",
        )
    return user


@router.patch(
    "/{user_id}",
    dependencies=[Depends(get_current_admin)],
    response_model=UserPublic,
    summary="Update user by ID",
    description="Update a specific user's information (admin only)",
    responses={
        200: {"description": "User updated successfully"},
        404: {"description": "User not found"},
        409: {"description": "Email already in use"}
    }
)
def update_user(
    *,
    session: SessionDep,
    user_id: uuid.UUID,
    user_in: UserUpdate,
) -> Any:
    """
    Update a specific user's information.
    
    Args:
        session: Database session
        user_id: UUID of the user to update
        user_in: User update data
        
    Returns:
        UserPublic: Updated user data
        
    Raises:
        HTTPException: If user not found or email already in use
    """
    db_user = session.get(User, user_id)
    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )
    if user_in.email:
        existing_user = user_service.get_user_by_email(session=session, email=user_in.email)
        if existing_user and existing_user.id != user_id:
            raise HTTPException(
                status_code=409, detail="User with this email already exists"
            )

    db_user = user_service.update_user(session=session, db_user=db_user, user_in=user_in)
    return db_user


@router.delete(
    "/{user_id}",
    dependencies=[Depends(get_current_admin)],
    summary="Delete user by ID",
    description="Delete a specific user (admin only)",
    responses={
        200: {"description": "User deleted successfully"},
        403: {"description": "Cannot delete self"},
        404: {"description": "User not found"}
    }
)
def delete_user(
    session: SessionDep, current_user: CurrentUser, user_id: uuid.UUID
) -> Message:
    """
    Delete a specific user.
    
    Args:
        session: Database session
        current_user: Current authenticated user
        user_id: UUID of the user to delete
        
    Returns:
        Message: Success message
        
    Raises:
        HTTPException: If user not found or trying to delete self
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user == current_user:
        raise HTTPException(
            status_code=403, detail="Super users are not allowed to delete themselves"
        )
    session.delete(user)
    session.commit()
    return Message(message="User deleted successfully")
