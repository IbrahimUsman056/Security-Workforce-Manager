from enum import Enum
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class AdjustmentType(str, Enum):
    BONUS = "BONUS"
    DEDUCTION = "DEDUCTION"

class PayrollAdjustment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    organization_id: int = Field(foreign_key="organization.id")
    user_id: int = Field(foreign_key="user.id")
    type: AdjustmentType
    label: str
    amount: float
    period_start: datetime
    period_end: datetime
    created_by: Optional[int] = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)