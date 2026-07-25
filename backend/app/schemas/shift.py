from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class ShiftCreate(BaseModel):
    site_id: int
    start_time: datetime
    end_time: datetime
    required_count: int = 1
    is_recurring: bool = False
    recurrence_rule: Optional[str] = None

class ShiftRead(BaseModel):
    id: int
    site_id: int
    start_time: datetime
    end_time: datetime
    required_count: int
    is_recurring: bool
    recurrence_rule: Optional[str]
    created_at: datetime
    assigned_count: int = 0
    has_assignment_history: bool = False

    class Config:
        from_attributes = True

class ShiftUpdate(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    required_count: Optional[int] = None
    is_recurring: Optional[bool] = None
    recurrence_rule: Optional[str] = None