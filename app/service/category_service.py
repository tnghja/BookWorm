from typing import List

from sqlmodel import select

from app.api.dependencies import SessionDep
from app.model.category import Category


def get_categories(session : SessionDep) -> List[Category]:
    query = select(Category)
    result = session.exec(query).all()
    return result