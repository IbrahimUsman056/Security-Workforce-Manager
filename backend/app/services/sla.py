from datetime import datetime, timedelta
from app.models.incident_report import IncidentSeverity

SLA_HOURS = {
    IncidentSeverity.CRITICAL: 1,
    IncidentSeverity.HIGH: 4,
    IncidentSeverity.MEDIUM: 24,
    IncidentSeverity.LOW: 72,
}

def calculate_sla_deadline(severity: IncidentSeverity, created_at: datetime | None = None) -> datetime:
    base = created_at or datetime.utcnow()
    hours = SLA_HOURS.get(severity, 24)
    return base + timedelta(hours=hours)