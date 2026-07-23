from datetime import datetime
from sqlmodel import Session, select
from app.models.attendance import Attendance
from app.models.shift_assignment import ShiftAssignment
from app.models.shift import Shift

def calculate_actual_hours_for_site(db: Session, site_id: int, start_date: datetime, end_date: datetime) -> float:
    statement = (
        select(Attendance)
        .join(ShiftAssignment, Attendance.shift_assignment_id == ShiftAssignment.id)
        .join(Shift, ShiftAssignment.shift_id == Shift.id)
        .where(Shift.site_id == site_id)
        .where(Attendance.check_in_time >= start_date)
        .where(Attendance.check_in_time <= end_date)
        .where(Attendance.total_hours != None)
    )
    records = db.exec(statement).all()
    return sum(r.total_hours or 0 for r in records)