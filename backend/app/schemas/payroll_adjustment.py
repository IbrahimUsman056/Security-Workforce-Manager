from datetime import datetime
from pydantic import BaseModel
from app.models.payroll_adjustment import AdjustmentType

class PayrollAdjustmentCreate(BaseModel):
    user_id: int
    type: AdjustmentType
    label: str
    amount: float
    period_start: datetime
    period_end: datetime

class PayrollAdjustmentRead(BaseModel):
    id: int
    user_id: int
    type: AdjustmentType
    label: str
    amount: float
    period_start: datetime
    period_end: datetime
    created_at: datetime

    class Config:
        from_attributes = True