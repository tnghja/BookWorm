from sqlmodel import Session, create_engine, select, SQLModel

from app.service import user_service
from app.core.config import settings
from app.schema.user import UserCreate

from app.model import *
engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))

# make sure all SQLModel models are imported (app.models) before initializing DB
# otherwise, SQLModel might fail to initialize relationships properly
# for more details: https://github.com/fastapi/full-stack-fastapi-template/issues/28

def init_db(session: Session) -> None:
    user_in = UserCreate(
        email=settings.FIRST_SUPERUSER,
        password=settings.FIRST_SUPERUSER_PASSWORD,
        is_admin=True
    )
    user_service.create_user(session=session, user_create=user_in)
