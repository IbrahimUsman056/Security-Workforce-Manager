from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.swap_request import SwapStatus

class SwapRequestCreate(BaseModel):
    shift_assignment_id: int
    proposed_replacement_id: Optional[int] = None
    reason: Optional[str] = None

class SwapRequestRead(BaseModel):
    id: int
    shift_assignment_id: int
    requested_by: int
    proposed_replacement_id: Optional[int]
    reason: Optional[str]
    status: SwapStatus
    reviewed_by: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True

class SwapStatusUpdate(BaseModel):
    status: SwapStatus