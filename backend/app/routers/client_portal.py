from typing import List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_db
from app.models.site import Site
from app.models.shift import Shift
from app.models.shift_assignment import ShiftAssignment, AssignmentStatus
from app.models.attendance import Attendance
from app.models.incident_report import IncidentReport
from app.models.invoice import Invoice
from app.models.user import User, UserRole
from app.schemas.client_portal import ClientSiteRead, CoverageEntry, ClientIncidentRead, ClientInvoiceRead
from app.core.deps import get_current_user
from app.services.client_access import get_client_site_ids, client_has_site_access

router = APIRouter(prefix="/client", tags=["client-portal"])

def require_client(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.CLIENT:
        raise HTTPException(status_code=403, detail="This endpoint is only accessible to client accounts")
    return current_user


@router.get("/sites", response_model=List[ClientSiteRead])
def get_my_sites(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client),
):
    site_ids = get_client_site_ids(db, current_user.id)
    if not site_ids:
        return []
    statement = select(Site).where(Site.id.in_(site_ids))
    return db.exec(statement).all()


@router.get("/coverage", response_model=List[CoverageEntry])
def get_coverage(
    site_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client),
):
    if not client_has_site_access(db, current_user.id, site_id):
        raise HTTPException(status_code=403, detail="Not authorized for this site")

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    statement = select(Shift).where(
        Shift.site_id == site_id,
        Shift.start_time >= today_start,
        Shift.start_time < today_end,
    )
    shifts = db.exec(statement).all()

    coverage = []
    for shift in shifts:
        assignments = db.exec(
            select(ShiftAssignment).where(
                ShiftAssignment.shift_id == shift.id,
                ShiftAssignment.status == AssignmentStatus.ASSIGNED,
            )
        ).all()

        checked_in_count = 0
        for assignment in assignments:
            attendance = db.exec(
                select(Attendance).where(
                    Attendance.shift_assignment_id == assignment.id,
                    Attendance.check_in_time != None,
                )
            ).first()
            if attendance:
                checked_in_count += 1

        coverage.append(CoverageEntry(
            shift_id=shift.id,
            start_time=shift.start_time,
            end_time=shift.end_time,
            required_count=shift.required_count,
            checked_in_count=checked_in_count,
            is_fully_staffed=checked_in_count >= shift.required_count,
        ))

    return coverage


@router.get("/incidents", response_model=List[ClientIncidentRead])
def get_incidents(
    site_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client),
):
    if not client_has_site_access(db, current_user.id, site_id):
        raise HTTPException(status_code=403, detail="Not authorized for this site")

    statement = (
        select(IncidentReport)
        .join(ShiftAssignment, IncidentReport.shift_assignment_id == ShiftAssignment.id)
        .join(Shift, ShiftAssignment.shift_id == Shift.id)
        .where(Shift.site_id == site_id)
    )
    return db.exec(statement).all()


@router.get("/invoices", response_model=List[ClientInvoiceRead])
def get_invoices(
    site_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client),
):
    if not client_has_site_access(db, current_user.id, site_id):
        raise HTTPException(status_code=403, detail="Not authorized for this site")

    statement = select(Invoice).where(Invoice.site_id == site_id)
    return db.exec(statement).all()