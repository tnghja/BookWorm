from typing import List

from fastapi import APIRouter

from app.api.dependencies import SessionDep
from app.model.author import Author
from app.service import author_service

router = APIRouter(prefix="/authors" ,tags=["authors"])
@router.get('', response_model=List[Author])
def get_authors(*,session: SessionDep ) -> List[Author]:
    return author_service.get_authors(session=session)