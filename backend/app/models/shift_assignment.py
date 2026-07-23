from enum import Enum
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class AssignmentStatus(str, Enum):
    ASSIGNED = "ASSIGNED"
    SWAP_REQUESTED = "SWAP_REQUESTED"
    SWAPPED = "SWAPPED"
    CANCELLED = "CANCELLED"

class ShiftAssignment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    shift_id: int = Field(foreign_key="shift.id")
    user_id: int = Field(foreign_key="user.id")
    status: AssignmentStatus = Field(default=AssignmentStatus.ASSIGNED)
    assigned_at: datetime = Field(default_factory=datetime.utcnow)