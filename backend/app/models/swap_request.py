from enum import Enum
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class SwapStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class SwapRequest(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    shift_assignment_id: int = Field(foreign_key="shiftassignment.id")
    requested_by: int = Field(foreign_key="user.id")
    proposed_replacement_id: Optional[int] = Field(default=None, foreign_key="user.id")
    reason: Optional[str] = None
    status: SwapStatus = Field(default=SwapStatus.PENDING)
    reviewed_by: Optional[int] = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)