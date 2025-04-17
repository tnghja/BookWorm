# Generic message
from datetime import timedelta

from pydantic import Field
from sqlmodel import SQLModel


class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: str  # Format: "DD/MM/YY-HH:MM"


# Contents of JWT token
class TokenPayload(SQLModel):
    payload: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)
