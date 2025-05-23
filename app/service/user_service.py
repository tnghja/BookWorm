
from typing import Any

from sqlmodel import Session, select

from app.core.security import get_password_hash, verify_password, hash_token
from app.model import User
from app.schema.user import UserUpdate,UserCreate


def create_user(*, session: Session, user_create: UserCreate) -> User:
    db_obj = User.model_validate(
        user_create, update={
        "password": get_password_hash(user_create.password),
                             "refresh_token": None}

    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj

def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data = {}
    if "password" in user_data:
        password = user_data["password"]
        hashed_password = get_password_hash(password)
        extra_data["hashed_password"] = password
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def get_user_by_email(*, session: Session, email: str) -> User | None:

    statement = select(User).where(User.email == email)
    session_user = session.exec(statement).first()

    return session_user


def authenticate(*, session: Session, email: str, password: str) -> User | None:
    db_user = get_user_by_email(session=session, email=email)

    if not db_user:
        return None
    if not verify_password(password, db_user.password):
        return None
    return db_user

def update_refresh_token(*, session: Session, user: User, refresh_token: str) -> None:
    """Updates the user's hashed refresh token in the database."""
    user.refresh_token = hash_token(refresh_token)
    session.add(user)
    session.commit()
    session.refresh(user) # Refresh to get updated state if needed elsewhere

# Added function to clear the hash on logout
def clear_refresh_token(*, session: Session, user: User) -> None:
    """Clears the user's hashed refresh token in the database."""
    user.refresh_token = None
    session.add(user)
    session.commit()

