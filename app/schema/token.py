
from datetime import timedelta

from pydantic import Field
from sqlmodel import SQLModel
from typing import Optional

class Message(SQLModel):
    message: str


class Token(SQLModel):
    access_token: str
    token_type: str = "Bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)