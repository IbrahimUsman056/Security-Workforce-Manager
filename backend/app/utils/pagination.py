from typing import TypeVar, Generic, List
from pydantic import BaseModel
from sqlmodel import Session, select
from sqlmodel.sql.expression import SelectOfScalar

T = TypeVar("T")

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int


def paginate(db: Session, statement: SelectOfScalar, page: int = 1, page_size: int = 20):
    all_results = db.exec(statement).all()
    total = len(all_results)
    total_pages = (total + page_size - 1) // page_size if total else 1

    start = (page - 1) * page_size
    end = start + page_size
    items = all_results[start:end]

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }