from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.incident_report import IncidentType, IncidentSeverity, IncidentStatus
from app.models.invoice import InvoiceStatus

class ClientSiteRead(BaseModel):
    id: int
    name: str
    address: str

    class Config:
        from_attributes = True

class CoverageEntry(BaseModel):
    shift_id: int
    start_time: datetime
    end_time: datetime
    required_count: int
    checked_in_count: int
    is_fully_staffed: bool

class ClientIncidentRead(BaseModel):
    id: int
    type: IncidentType
    severity: IncidentSeverity
    description: str
    status: IncidentStatus
    created_at: datetime

    class Config:
        from_attributes = True

class ClientInvoiceRead(BaseModel):
    id: int
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