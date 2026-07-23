from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class AuditLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    organization_id: int = Field(foreign_key="organization.id")
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    action: str            # "CREATE", "UPDATE", "DELETE"
    entity_type: str        # "Shift", "Site", "IncidentReport", etc.
    entity_id: int
    changes: Optional[str] = None   # JSON string, e.g. '{"before": {...}, "after": {...}}'
    created_at: datetime = Field(default_factory=datetime.utcnow)