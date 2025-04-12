import uuid

from pydantic import EmailStr
from sqlmodel import SQLModel, Field


class BaseUser(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_admin: bool = False
    first_name: str | None = Field(default=None, max_length=50)
    last_name: str | None = Field(default=None, max_length=50)

# Properties to receive via API on creation
class UserCreate(BaseUser):
    password: str = Field(min_length=8, max_length=40)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(BaseUser):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=40)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)

# Properties to return via API, id is always required
class UserPublic(BaseUser):
    id: uuid.UUID


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int