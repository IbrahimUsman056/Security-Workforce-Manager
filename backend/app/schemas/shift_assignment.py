from datetime import datetime
from pydantic import BaseModel
from app.models.shift_assignment import AssignmentStatus

class ShiftAssignmentCreate(BaseModel):
    shift_id: int
    user_id: int

class ShiftAssignmentRead(BaseModel):
    id: int
    shift_id: int
    user_id: int
    status: AssignmentStatus
    assigned_at: datetime

    class Config:
        from_attributes = True