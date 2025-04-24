from typing import List

from sqlmodel import  select

from app.api.dependencies import SessionDep
from app.model.author import Author


def get_authors(session: SessionDep) -> List[Author]:
    query = select(Author)
    result = session.exec(query).all()
    return result