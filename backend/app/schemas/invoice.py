from datetime import datetime
from pydantic import BaseModel
from app.models.invoice import InvoiceStatus

class InvoiceCreate(BaseModel):
    site_id: int
    period_start: datetime
    period_end: datetime
    contracted_hours: float
    rate_per_hour: float
    currency: str = "PKR"

class InvoiceRead(BaseModel):
    id: int
    site_id: int
    period_start: datetime
    period_end: datetime
    contracted_hours: float
    actual_hours: float
    rate_per_hour: float
    currency: str
    total_amount: float
    status: InvoiceStatus
    created_at: datetime

    class Config:
        from_attributes = True

class InvoiceStatusUpdate(BaseModel):
    status: InvoiceStatus