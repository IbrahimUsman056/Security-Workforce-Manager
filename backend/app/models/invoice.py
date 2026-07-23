from enum import Enum
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class InvoiceStatus(str, Enum):
    DRAFT = "DRAFT"
    SENT = "SENT"
    PAID = "PAID"

class Invoice(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    organization_id: int = Field(foreign_key="organization.id")
    site_id: int = Field(foreign_key="site.id")
    period_start: datetime
    period_end: datetime
    contracted_hours: float
    actual_hours: float
    rate_per_hour: float
    currency: str = Field(default="PKR")
    total_amount: float
    status: InvoiceStatus = Field(default=InvoiceStatus.DRAFT)
    created_at: datetime = Field(default_factory=datetime.utcnow)