from datetime import datetime
from sqlmodel import Session, select
from app.database import engine
from app.models.incident_report import IncidentReport, IncidentStatus
from app.models.shift_assignment import ShiftAssignment
from app.models.shift import Shift
from app.models.user import User, UserRole
from app.services.notifications import create_notification

def escalate_overdue_incidents():
    with Session(engine) as db:
        now = datetime.utcnow()
        statement = select(IncidentReport).where(
            IncidentReport.status == IncidentStatus.PENDING,
            IncidentReport.sla_deadline != None,
            IncidentReport.sla_deadline <= now,
        )
        overdue = db.exec(statement).all()

        for incident in overdue:
            incident.status = IncidentStatus.ESCALATED
            db.add(incident)
            db.commit()

            assignment = db.get(ShiftAssignment, incident.shift_assignment_id)
            shift = db.get(Shift, assignment.shift_id)

            admins = db.exec(
                select(User).where(
                    User.organization_id == shift.organization_id,
                    User.role.in_([UserRole.ADMIN, UserRole.SUPERVISOR]),
                )
            ).all()

            for admin in admins:
                create_notification(
                    db, admin.id, "Incident SLA Breached",
                    f"Incident #{incident.id} ({incident.severity.value}) was not reviewed in time and has been auto-escalated."
                )

        print(f"[sla_escalation] Escalated {len(overdue)} overdue incidents")