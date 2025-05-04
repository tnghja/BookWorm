# app/api/routes/login.py

"""
Authentication Routes

This module handles all authentication-related endpoints for the BookWorm API.
It provides functionality for user login, token management, and logout operations.

Endpoints:
- /auth/token: Login and get access token
- /auth/token/test: Test token validity
- /auth/token/refresh: Refresh access token
- /auth/logout: Logout and clear tokens

Security Features:
- JWT-based authentication
- Refresh token rotation
- Secure cookie handling
- Token expiration management

Version: 1.0.0
"""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Response, Cookie, status
from fastapi.security import OAuth2PasswordRequestForm

from app.api.dependencies import CurrentUser, SessionDep
from app.core.config import settings
from app.schema.token import Token
from app.schema.user import UserPublic
from app.service import auth_service

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
    responses={
        401: {"description": "Unauthorized"},
        400: {"description": "Bad Request"},
        403: {"description": "Forbidden"}
    }
)


@router.post(
    "/token",
    response_model=Token,
    summary="Login and get access token",
    description="Authenticate user and return access token with refresh token in cookie",
    responses={
        200: {"description": "Successfully authenticated"},
        400: {"description": "Invalid credentials"}
    }
)
def login_access_token(
    response: Response,
    session: SessionDep,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
) -> Token:
    """
    OAuth2 compatible token login, get an access token for future requests.
    
    Args:
        response: FastAPI response object for setting cookies
        session: Database session
        form_data: OAuth2 password request form containing username (email) and password
        
    Returns:
        Token: Access token for API authentication
        
    Raises:
        HTTPException: If credentials are invalid
    """
    return auth_service.login_user(
        response=response,
        session=session,
        email=form_data.username,
        password=form_data.password
    )


@router.post(
    "/token/test",
    response_model=UserPublic,
    summary="Test token validity",
    description="Test if the current access token is valid and return user data",
    responses={
        200: {"description": "Token is valid"},
        401: {"description": "Invalid or expired token"}
    }
)
def test_token(current_user: CurrentUser) -> Any:
    """
    Test access token for validity.
    
    Args:
        current_user: The authenticated user from the token
        
    Returns:
        UserPublic: Public user data if token is valid
    """
    return current_user


@router.get(
    "/token/refresh",
    response_model=Token,
    summary="Refresh access token",
    description="Get a new access token using refresh token from cookie",
    responses={
        200: {"description": "New access token generated"},
        401: {"description": "Invalid or expired refresh token"}
    }
)
def refresh_token(
    response: Response,
    session: SessionDep,
    refresh_token: str | None = Cookie(None, alias=settings.REFRESH_COOKIE_NAME)
) -> Token:
    """
    Refresh access token using refresh token from cookie.
    
    Args:
        response: FastAPI response object for cookie management
        session: Database session
        refresh_token: Refresh token from cookie
        
    Returns:
        Token: New access token
        
    Raises:
        HTTPException: If refresh token is invalid or expired
    """
    return auth_service.refresh_access_token(
        response=response,
        session=session,
        refresh_token=refresh_token
    )


@router.post(
    "/logout",
    summary="Logout user",
    description="Clear refresh token and logout user",
    responses={
        200: {"description": "Successfully logged out"},
        401: {"description": "Invalid token"}
    }
)
def logout(
    response: Response,
    session: SessionDep, 
    refresh_token: str | None = Cookie(None, alias=settings.REFRESH_COOKIE_NAME) 
) -> dict[str, str]:
    """
    Logout user and clear refresh token.
    
    Args:
        response: FastAPI response object for cookie management
        session: Database session
        refresh_token: Refresh token from cookie
        
    Returns:
        dict: Success message
    """
    return auth_service.logout_user(
        response=response,
        session=session,
        refresh_token=refresh_token
    )