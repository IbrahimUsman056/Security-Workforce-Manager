import json
from typing import Optional, Any
from sqlmodel import Session
from app.models.audit_log import AuditLog

def log_action(
    db: Session,
    organization_id: int,
    user_id: Optional[int],
    action: str,
    entity_type: str,
    entity_id: int,
    before: Optional[dict[str, Any]] = None,
    after: Optional[dict[str, Any]] = None,
):
    changes = None
    if before is not None or after is not None:
        changes = json.dumps({"before": before, "after": after}, default=str)

    entry = AuditLog(
        organization_id=organization_id,
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        changes=changes,
    )
    db.add(entry)
    db.commit()