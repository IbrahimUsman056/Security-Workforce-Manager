from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class AuditLogRead(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    entity_type: str
    entity_id: int
    changes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True