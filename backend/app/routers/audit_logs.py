from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select
from app.database import get_db
from app.models.audit_log import AuditLog
from app.models.user import User, UserRole
from app.schemas.audit_log import AuditLogRead
from app.core.deps import require_role

router = APIRouter(prefix="/audit-logs", tags=["audit-logs"])

@router.get("/", response_model=List[AuditLogRead])
def list_audit_logs(
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    statement = (
        select(AuditLog)
        .where(AuditLog.organization_id == current_user.organization_id)
        .order_by(AuditLog.created_at.desc())
    )
    if entity_type:
        statement = statement.where(AuditLog.entity_type == entity_type)
    if entity_id:
        statement = statement.where(AuditLog.entity_id == entity_id)
    return db.exec(statement).all()