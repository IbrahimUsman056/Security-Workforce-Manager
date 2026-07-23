from datetime import datetime
from sqlmodel import Session, select
from app.models.attendance import Attendance
from app.models.shift_assignment import ShiftAssignment
from app.models.shift import Shift
from app.models.user import User
from app.models.staff_profile import StaffProfile
from app.models.payroll_adjustment import PayrollAdjustment, AdjustmentType

OVERTIME_THRESHOLD_HOURS = 8

def calculate_hours_report(db: Session, start_date: datetime, end_date: datetime, organization_id: int):
    statement = (
        select(Attendance, ShiftAssignment, User)
        .join(ShiftAssignment, Attendance.shift_assignment_id == ShiftAssignment.id)
        .join(Shift, ShiftAssignment.shift_id == Shift.id)
        .join(User, ShiftAssignment.user_id == User.id)
        .where(Shift.organization_id == organization_id)
        .where(Attendance.check_in_time >= start_date)
        .where(Attendance.check_in_time <= end_date)
        .where(Attendance.total_hours != None)
    )
    results = db.exec(statement).all()

    report = {}
    for attendance, assignment, user in results:
        if user.id not in report:
            report[user.id] = {
                "user_id": user.id,
                "name": user.name,
                "total_hours": 0.0,
                "overtime_hours": 0.0,
                "shifts_worked": 0,
                "late_count": 0,
                "absent_count": 0,
            }

        entry = report[user.id]
        hours = attendance.total_hours or 0
        entry["total_hours"] += hours
        entry["shifts_worked"] += 1

        if hours > OVERTIME_THRESHOLD_HOURS:
            entry["overtime_hours"] += (hours - OVERTIME_THRESHOLD_HOURS)

        if attendance.status and attendance.status.value == "LATE":
            entry["late_count"] += 1
        if attendance.status and attendance.status.value == "ABSENT":
            entry["absent_count"] += 1

    for entry in report.values():
        entry["total_hours"] = round(entry["total_hours"], 2)
        entry["overtime_hours"] = round(entry["overtime_hours"], 2)

    return list(report.values())


def calculate_net_pay_report(db: Session, start_date: datetime, end_date: datetime, organization_id: int):
    hours_report = calculate_hours_report(db, start_date, end_date, organization_id)

    for entry in hours_report:
        profile = db.exec(select(StaffProfile).where(StaffProfile.user_id == entry["user_id"])).first()
        hourly_rate = profile.hourly_rate if profile and profile.hourly_rate else 0.0

        adjustments = db.exec(
            select(PayrollAdjustment).where(
                PayrollAdjustment.user_id == entry["user_id"],
                PayrollAdjustment.period_start >= start_date,
                PayrollAdjustment.period_end <= end_date,
            )
        ).all()

        bonus_total = sum(a.amount for a in adjustments if a.type == AdjustmentType.BONUS)
        deduction_total = sum(a.amount for a in adjustments if a.type == AdjustmentType.DEDUCTION)

        base_pay = entry["total_hours"] * hourly_rate
        net_pay = base_pay + bonus_total - deduction_total

        entry["hourly_rate"] = round(hourly_rate, 2)
        entry["base_pay"] = round(base_pay, 2)
        entry["bonus_total"] = round(bonus_total, 2)
        entry["deduction_total"] = round(deduction_total, 2)
        entry["net_pay"] = round(net_pay, 2)

    return hours_report