from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class Shift(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    organization_id: int = Field(foreign_key="organization.id")
    site_id: int = Field(foreign_key="site.id")
    start_time: datetime
    end_time: datetime
    required_count: int = Field(default=1)
    is_recurring: bool = Field(default=False)
    recurrence_rule: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)