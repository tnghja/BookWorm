import datetime
from datetime import timedelta
from typing import Annotated, Any
from uuid import UUID

import jwt
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm


from app.service import user_service
from app.api.dependencies import CurrentUser, SessionDep, validate_refresh_token, \
    get_current_user
from app.core import security
from app.core.config import settings
from app.schema.token import Message, NewPassword, Token
from app.schema.user import UserPublic
from app.model.user import User

router = APIRouter(tags=["login"])


@router.post("/login/access-token")
def login_access_token(
    session: SessionDep, form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
) -> Token:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = user_service.authenticate(
        session=session, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    
    # Create tokens
    access_token = security.create_access_token(
        user.id, 
        expires_delta=access_token_expires
    )
    refresh_token = security.create_refresh_token(
        user.id,
        expires_delta=refresh_token_expires
    )
    
    # Store the refresh token string, not the expiration time
    user_service.update_refresh_token(
        session=session, 
        email=user.email, 
        refresh_token=refresh_token
    )
    
    # Calculate expiration time as formatted string
    expiration_time = datetime.datetime.now(datetime.timezone.utc) + access_token_expires
    expires_in = expiration_time.strftime("%d/%m/%y-%H:%M")
    
    return Token(
        access_token=access_token,
        expires_in=expires_in,
        refresh_token=refresh_token
    )


@router.post("/login/test-token", response_model=UserPublic)
def test_token(current_user: CurrentUser) -> Any:
    """
    Test access token
    """
    return current_user


@router.get("/refresh-token")
def refresh_token(session: SessionDep, user_id: UUID = Depends(validate_refresh_token)) -> Any:
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    new_access_token = security.create_access_token(
        subject=user_id, expires_delta=access_token_expires
    )
    return new_access_token

@router.post("/logout")
def logout(session: SessionDep, current_user: Annotated[User, Depends(get_current_user)]) -> None:
    if current_user:
        current_user.refresh_token = None
    else :
        raise HTTPException(status_code=401, detail="User not found")


