from datetime import timedelta, timezone, datetime
from typing import Any

import jwt
from fastapi import HTTPException, Response, status
from pydantic import ValidationError
from sqlmodel import Session

from app.core import security
from app.core.config import settings
from app.model.user import User
from app.schema.token import Token, TokenPayload
from app.service import user_service


def login_user(
    response: Response,
    session: Session,
    email: str,
    password: str
) -> Token:
    """
    Authenticate user and return access token with refresh token in cookie.
    
    Args:
        response: FastAPI response object for setting cookies
        session: Database session
        email: User email
        password: User password
        
    Returns:
        Token: Access token for API authentication
        
    Raises:
        HTTPException: If credentials are invalid
    """
    user = user_service.authenticate(
        session=session, email=email, password=password
    )
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect email or password")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)

    access_token = security.create_access_token(
        user.id,
        expires_delta=access_token_expires
    )

    refresh_token = security.create_refresh_token(
        user.id,
        expires_delta=refresh_token_expires
    )

    # Store the HASHED refresh token in the database
    user_service.update_refresh_token(
        session=session,
        user=user,
        refresh_token=refresh_token
    )

    # Set raw refresh token in HttpOnly cookie using settings from config
    set_refresh_token_cookie(
        response=response, 
        refresh_token=refresh_token, 
        expires_delta=refresh_token_expires
    )
    
    return Token(access_token=access_token)


def set_refresh_token_cookie(
    response: Response, 
    refresh_token: str, 
    expires_delta: timedelta
) -> None:
    """
    Set refresh token in HttpOnly cookie.
    
    Args:
        response: FastAPI response object
        refresh_token: Token to set in cookie
        expires_delta: Cookie expiration time
    """
    response.set_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=settings.REFRESH_COOKIE_HTTPONLY,
        secure=settings.REFRESH_COOKIE_SECURE,
        samesite=settings.REFRESH_COOKIE_SAMESITE,
        expires=expires_delta,
        path=settings.REFRESH_COOKIE_PATH,
        domain=settings.REFRESH_COOKIE_DOMAIN
    )


def refresh_access_token(
    response: Response,
    session: Session,
    refresh_token: str | None
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
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not refresh_token:
        delete_refresh_token_cookie(response)
        raise credentials_exception
        
    try:
        payload = jwt.decode(
            refresh_token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = TokenPayload(sub=payload.get("sub"))
        
        # Check if token has expired
        now = datetime.now(timezone.utc).timestamp()
        if now > payload['exp']:
            delete_refresh_token_cookie(response)
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token has expired")

        user_id = int(token_data.sub)
        user = session.get(User, user_id)

        if not user or not user.refresh_token or not security.verify_token(refresh_token, user.refresh_token):
            delete_refresh_token_cookie(response)
            raise credentials_exception

        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        new_access_token = security.create_access_token(
            subject=user.id, expires_delta=access_token_expires
        )
        return Token(access_token=new_access_token)

    except (jwt.InvalidTokenError, ValidationError, ValueError):
        delete_refresh_token_cookie(response)
        raise credentials_exception


def logout_user(
    response: Response,
    session: Session, 
    refresh_token: str | None
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
    if refresh_token:
        try:
            payload = jwt.decode(
                refresh_token, settings.SECRET_KEY, algorithms=[security.ALGORITHM],
                options={"verify_exp": False} 
            )
            user_id_str = payload.get("sub")
            if user_id_str:
                user = session.get(User, int(user_id_str))
                if user and user.refresh_token:
                    if security.verify_token(refresh_token, user.refresh_token):
                        user_service.clear_refresh_token(session=session, user=user)
        except (jwt.InvalidTokenError, ValueError):
            pass

    delete_refresh_token_cookie(response)
    return {"message": "Logout successful"}


def delete_refresh_token_cookie(response: Response) -> None:
    """
    Delete refresh token cookie.
    
    Args:
        response: FastAPI response object
    """
    response.delete_cookie(
        settings.REFRESH_COOKIE_NAME,
        path=settings.REFRESH_COOKIE_PATH,
        domain=settings.REFRESH_COOKIE_DOMAIN
    ) 