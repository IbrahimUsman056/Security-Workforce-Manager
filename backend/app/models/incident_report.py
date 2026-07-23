from enum import Enum
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class IncidentType(str, Enum):
    THEFT = "THEFT"
    BREACH = "BREACH"
    DISTURBANCE = "DISTURBANCE"
    EQUIPMENT = "EQUIPMENT"
    OTHER = "OTHER"

class IncidentSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class IncidentStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    ESCALATED = "ESCALATED"
    REJECTED = "REJECTED"

class IncidentReport(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    shift_assignment_id: int = Field(foreign_key="shiftassignment.id")
    reported_by: int = Field(foreign_key="user.id")
    type: IncidentType
    severity: IncidentSeverity = Field(default=IncidentSeverity.MEDIUM)
    description: str
    photo_url: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    status: IncidentStatus = Field(default=IncidentStatus.PENDING)
    sla_deadline: Optional[datetime] = None
    reviewed_by: Optional[int] = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)