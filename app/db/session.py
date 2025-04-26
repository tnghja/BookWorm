from sqlmodel import create_engine
from sqlmodel import Session

from app.core.config import settings
from app.db.init_db import init_db

if settings.SQLALCHEMY_DATABASE_URI is None:
    raise ValueError("DATABASE_URL is not set")

# engine = create_engine(settings.SQLALCHEMY_DATABASE_URI, echo=True)
#
engine = create_engine("sqlite:///C:/Users/Admin/Downloads/test (2).db", echo=True)

async def get_db():
    with Session(engine) as session:
        try :
            yield session
        finally:
            session.close()
