from typing import List

from fastapi import APIRouter

from app.api.dependencies import SessionDep
from app.model.category import Category
from app.service import category_service

router = APIRouter(prefix="/categories" ,tags=["category"])
@router.get('', response_model=List[Category])
def get_categories(*,session: SessionDep ) -> List[Category]:
    return category_service.get_categories(session=session)