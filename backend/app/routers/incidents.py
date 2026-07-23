from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlmodel import Session, select
from app.database import get_db
from app.models.incident_report import IncidentReport, IncidentType, IncidentSeverity, IncidentStatus
from app.models.shift_assignment import ShiftAssignment
from app.models.shift import Shift
from app.models.user import User, UserRole
from app.schemas.incident import IncidentRead, IncidentStatusUpdate
from app.core.deps import get_current_user, require_role
from app.utils.file_upload import save_incident_photo
from app.services.audit import log_action
from app.services.sla import calculate_sla_deadline
from app.services.access import check_site_access, get_accessible_site_ids

router = APIRouter(prefix="/incidents", tags=["incidents"])

@router.post("/", response_model=IncidentRead)
def create_incident(
    shift_assignment_id: int = Form(...),
    type: IncidentType = Form(...),
    severity: IncidentSeverity = Form(IncidentSeverity.MEDIUM),
    description: str = Form(...),
    lat: Optional[float] = Form(None),
    lng: Optional[float] = Form(None),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assignment = db.get(ShiftAssignment, shift_assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Shift assignment not found")
    if assignment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="This assignment does not belong to you")

    shift = db.get(Shift, assignment.shift_id)
    if not shift or shift.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Shift assignment not found")

    photo_url = None
    if photo:
        photo_url = save_incident_photo(photo)

    incident = IncidentReport(
        shift_assignment_id=shift_assignment_id,
        reported_by=current_user.id,
        type=type,
        severity=severity,
        description=description,
        lat=lat,
        lng=lng,
        photo_url=photo_url,
        sla_deadline=calculate_sla_deadline(severity),
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident


@router.get("/", response_model=List[IncidentRead])
def list_incidents(
    status: Optional[IncidentStatus] = None,
    severity: Optional[IncidentSeverity] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPERVISOR])),
):
    statement = (
        select(IncidentReport)
        .join(ShiftAssignment, IncidentReport.shift_assignment_id == ShiftAssignment.id)
        .join(Shift, ShiftAssignment.shift_id == Shift.id)
        .where(Shift.organization_id == current_user.organization_id)
    )
    if current_user.role == UserRole.SUPERVISOR:
        site_ids = get_accessible_site_ids(db, current_user)
        statement = statement.where(Shift.site_id.in_(site_ids))
    if status:
        statement = statement.where(IncidentReport.status == status)
    if severity:
        statement = statement.where(IncidentReport.severity == severity)
    return db.exec(statement).all()


@router.get("/my-reports", response_model=List[IncidentRead])
def my_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = select(IncidentReport).where(IncidentReport.reported_by == current_user.id)
    return db.exec(statement).all()


@router.get("/{incident_id}", response_model=IncidentRead)
def get_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    incident = db.get(IncidentReport, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    if incident.reported_by != current_user.id and current_user.role == UserRole.STAFF:
        raise HTTPException(status_code=403, detail="Not authorized to view this incident")
    return incident


@router.patch("/{incident_id}/status", response_model=IncidentRead)
def update_incident_status(
    incident_id: int,
    payload: IncidentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPERVISOR])),
):
    incident = db.get(IncidentReport, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    assignment = db.get(ShiftAssignment, incident.shift_assignment_id)
    shift = db.get(Shift, assignment.shift_id)

    if not check_site_access(db, current_user, shift.site_id):
        raise HTTPException(status_code=403, detail="Not authorized for this site")

    if not shift or shift.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Incident not found")

    before_status = incident.status
    incident.status = payload.status
    incident.reviewed_by = current_user.id
    db.add(incident)
    db.commit()
    db.refresh(incident)

    log_action(
        db, current_user.organization_id, current_user.id,
        "UPDATE", "IncidentReport", incident.id,
        before={"status": before_status.value},
        after={"status": incident.status.value},
    )
    return incident

########################################################
#TEST CHECK FOR ESCALATION FOR ADMIN (REMOVE IT IBRAHIM)
########################################################

from app.jobs.sla_escalation import escalate_overdue_incidents

@router.post("/run-sla-check")
def trigger_sla_check(
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    escalate_overdue_incidents()
    return {"detail": "SLA check completed"}