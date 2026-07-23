from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.incident_report import IncidentType, IncidentSeverity, IncidentStatus

class IncidentCreate(BaseModel):
    shift_assignment_id: int
    type: IncidentType
    severity: IncidentSeverity = IncidentSeverity.MEDIUM
    description: str
    lat: Optional[float] = None
    lng: Optional[float] = None

class IncidentRead(BaseModel):
    id: int
    shift_assignment_id: int
    reported_by: int
    type: IncidentType
    severity: IncidentSeverity
    description: str
    photo_url: Optional[str]
    lat: Optional[float]
    lng: Optional[float]
    status: IncidentStatus
    sla_deadline: Optional[datetime]
    reviewed_by: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True

class IncidentStatusUpdate(BaseModel):
    status: IncidentStatus