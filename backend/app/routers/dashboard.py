from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_db
from app.models.attendance import Attendance, AttendanceStatus
from app.models.shift_assignment import ShiftAssignment
from app.models.shift import Shift
from app.models.site import Site
from app.models.incident_report import IncidentReport
from app.models.user import User, UserRole
from app.schemas.dashboard import AttendanceTrendPoint, IncidentHeatmapEntry, StaffHoursEntry, ForecastEntry
from app.core.deps import require_role
from app.services.access import get_accessible_site_ids
from app.services.forecasting import forecast_next_week_staffing
from app.schemas.dashboard import MLForecastEntry
from app.services.ml_forecast import predict_next_7_days, is_model_available

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/attendance-trend", response_model=List[AttendanceTrendPoint])
def attendance_trend(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPERVISOR])),
):
    start_date = datetime.utcnow() - timedelta(days=days)

    statement = (
        select(Attendance)
        .join(ShiftAssignment, Attendance.shift_assignment_id == ShiftAssignment.id)
        .join(Shift, ShiftAssignment.shift_id == Shift.id)
        .where(Shift.organization_id == current_user.organization_id)
        .where(Attendance.check_in_time >= start_date)
    )
    if current_user.role == UserRole.SUPERVISOR:
        site_ids = get_accessible_site_ids(db, current_user)
        statement = statement.where(Shift.site_id.in_(site_ids))

    records = db.exec(statement).all()

    by_date = {}
    for r in records:
        if not r.check_in_time:
            continue
        day_key = r.check_in_time.strftime("%Y-%m-%d")
        if day_key not in by_date:
            by_date[day_key] = {"on_time": 0, "late": 0, "absent": 0}
        if r.status == AttendanceStatus.ON_TIME:
            by_date[day_key]["on_time"] += 1
        elif r.status == AttendanceStatus.LATE:
            by_date[day_key]["late"] += 1
        elif r.status == AttendanceStatus.ABSENT:
            by_date[day_key]["absent"] += 1

    result = [
        AttendanceTrendPoint(date=day, **counts)
        for day, counts in sorted(by_date.items())
    ]
    return result


@router.get("/incident-heatmap", response_model=List[IncidentHeatmapEntry])
def incident_heatmap(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPERVISOR])),
):
    statement = (
        select(IncidentReport, Shift, Site)
        .join(ShiftAssignment, IncidentReport.shift_assignment_id == ShiftAssignment.id)
        .join(Shift, ShiftAssignment.shift_id == Shift.id)
        .join(Site, Shift.site_id == Site.id)
        .where(Shift.organization_id == current_user.organization_id)
    )
    if current_user.role == UserRole.SUPERVISOR:
        site_ids = get_accessible_site_ids(db, current_user)
        statement = statement.where(Shift.site_id.in_(site_ids))

    results = db.exec(statement).all()

    stats = {}
    for incident, shift, site in results:
        if site.id not in stats:
            stats[site.id] = {"site_id": site.id, "site_name": site.name, "low": 0, "medium": 0, "high": 0, "critical": 0}
        stats[site.id][incident.severity.value.lower()] += 1

    return list(stats.values())


@router.get("/staff-hours", response_model=List[StaffHoursEntry])
def staff_hours_distribution(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPERVISOR])),
):
    start_date = datetime.utcnow() - timedelta(days=days)

    statement = (
        select(Attendance, ShiftAssignment, User)
        .join(ShiftAssignment, Attendance.shift_assignment_id == ShiftAssignment.id)
        .join(Shift, ShiftAssignment.shift_id == Shift.id)
        .join(User, ShiftAssignment.user_id == User.id)
        .where(Shift.organization_id == current_user.organization_id)
        .where(Attendance.check_in_time >= start_date)
        .where(Attendance.total_hours != None)
    )
    if current_user.role == UserRole.SUPERVISOR:
        site_ids = get_accessible_site_ids(db, current_user)
        statement = statement.where(Shift.site_id.in_(site_ids))

    results = db.exec(statement).all()

    hours_by_user = {}
    for attendance, assignment, user in results:
        if user.id not in hours_by_user:
            hours_by_user[user.id] = {"user_id": user.id, "name": user.name, "total_hours": 0.0}
        hours_by_user[user.id]["total_hours"] += attendance.total_hours or 0

    for entry in hours_by_user.values():
        entry["total_hours"] = round(entry["total_hours"], 2)

    return list(hours_by_user.values())


@router.get("/forecast", response_model=List[ForecastEntry])
def staffing_forecast(
    site_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPERVISOR])),
):
    site = db.get(Site, site_id)
    if not site or site.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Site not found")

    if current_user.role == UserRole.SUPERVISOR:
        site_ids = get_accessible_site_ids(db, current_user)
        if site_id not in site_ids:
            raise HTTPException(status_code=403, detail="Not authorized for this site")

    return forecast_next_week_staffing(db, site_id)

@router.get("/ml-forecast", response_model=List[MLForecastEntry])
def ml_demand_forecast(
    site_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPERVISOR])),
):
    site = db.get(Site, site_id)
    if not site or site.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Site not found")

    if current_user.role == UserRole.SUPERVISOR:
        site_ids = get_accessible_site_ids(db, current_user)
        if site_id not in site_ids:
            raise HTTPException(status_code=403, detail="Not authorized for this site")

    if not is_model_available(current_user.organization_id):
        raise HTTPException(
            status_code=503,
            detail="Forecasting model has not been trained yet for your organization. Not enough historical shift data may be available.",
        )

    return predict_next_7_days(db, site_id, current_user.organization_id)