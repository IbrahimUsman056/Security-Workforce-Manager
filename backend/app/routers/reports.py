import io
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from app.database import get_db
from app.models.user import User, UserRole
from app.models.organization import Organization
from app.models.incident_report import IncidentReport
from app.models.shift_assignment import ShiftAssignment
from app.models.shift import Shift
from app.models.site import Site
from app.models.attendance import Attendance, AttendanceStatus
from app.models.staff_profile import StaffProfile
from app.schemas.report import PayrollEntry, NetPayrollEntry, IncidentStatsEntry
from app.core.deps import require_role, get_current_user
from app.services.payroll import calculate_hours_report, calculate_net_pay_report
from app.services.payslip_pdf import generate_payslip_pdf
from app.utils.csv_export import dicts_to_csv
from app.services.access import get_accessible_site_ids

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/payroll", response_model=List[PayrollEntry])
def payroll_report(
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    return calculate_hours_report(db, start_date, end_date, current_user.organization_id)


@router.get("/payroll/export")
def export_payroll_csv(
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    data = calculate_hours_report(db, start_date, end_date, current_user.organization_id)
    csv_content = dicts_to_csv(data)
    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=payroll_report.csv"},
    )


@router.get("/net-payroll", response_model=List[NetPayrollEntry])
def net_payroll_report(
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    return calculate_net_pay_report(db, start_date, end_date, current_user.organization_id)


@router.get("/bank-export")
def export_bank_csv(
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    net_payroll = calculate_net_pay_report(db, start_date, end_date, current_user.organization_id)
    bank_rows = []
    for entry in net_payroll:
        profile = db.exec(select(StaffProfile).where(StaffProfile.user_id == entry["user_id"])).first()
        bank_rows.append({
            "employee_code": profile.employee_code if profile else "N/A",
            "account_number": profile.bank_account_number if profile and profile.bank_account_number else "N/A",
            "name": entry["name"],
            "amount": entry["net_pay"],
        })
    csv_content = dicts_to_csv(bank_rows)
    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=bank_export.csv"},
    )

@router.get("/payslip/{user_id}/pdf")
def download_payslip(
    user_id: int,
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Staff can only download their own payslip; Admin can download anyone's
    if current_user.role != UserRole.ADMIN and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this payslip")

    target_user = db.get(User, user_id)
    if not target_user or target_user.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="User not found")

    net_payroll = calculate_net_pay_report(db, start_date, end_date, current_user.organization_id)
    entry = next((e for e in net_payroll if e["user_id"] == user_id), None)
    if not entry:
        raise HTTPException(status_code=404, detail="No payroll data found for this user in the given period")

    org = db.get(Organization, current_user.organization_id)
    pdf_bytes = generate_payslip_pdf(org.name, entry, start_date, end_date)
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=payslip_{user_id}.pdf"},
    )

@router.get("/incidents-by-site", response_model=List[IncidentStatsEntry])
def incidents_by_site(
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
            stats[site.id] = {
                "site_id": site.id, "site_name": site.name,
                "total_incidents": 0, "pending": 0, "approved": 0, "escalated": 0, "rejected": 0,
            }
        entry = stats[site.id]
        entry["total_incidents"] += 1
        entry[incident.status.value.lower()] += 1

    return list(stats.values())


@router.get("/attendance-rate")
def attendance_rate(
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPERVISOR])),
):
    statement = (
        select(Attendance)
        .join(ShiftAssignment, Attendance.shift_assignment_id == ShiftAssignment.id)
        .join(Shift, ShiftAssignment.shift_id == Shift.id)
        .where(Shift.organization_id == current_user.organization_id)
        .where(Attendance.check_in_time >= start_date)
        .where(Attendance.check_in_time <= end_date)
    )
    if current_user.role == UserRole.SUPERVISOR:
        site_ids = get_accessible_site_ids(db, current_user)
        statement = statement.where(Shift.site_id.in_(site_ids))

    records = db.exec(statement).all()

    total = len(records)
    on_time = sum(1 for r in records if r.status == AttendanceStatus.ON_TIME)
    late = sum(1 for r in records if r.status == AttendanceStatus.LATE)
    absent = sum(1 for r in records if r.status == AttendanceStatus.ABSENT)

    return {
        "total_records": total,
        "on_time": on_time,
        "late": late,
        "absent": absent,
        "on_time_rate_percent": round((on_time / total * 100), 2) if total else 0,
    }