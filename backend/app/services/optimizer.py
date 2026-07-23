from datetime import datetime, timedelta
from sqlmodel import Session, select
from app.models.shift import Shift
from app.models.shift_assignment import ShiftAssignment, AssignmentStatus
from app.models.staff_profile import StaffProfile
from app.models.user import User, UserRole
from app.services.scheduling import has_conflict

def get_week_bounds(reference: datetime):
    start = reference - timedelta(days=reference.weekday())
    start = start.replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=7)
    return start, end


def hours_assigned_this_week(db: Session, user_id: int, week_start: datetime, week_end: datetime) -> float:
    statement = (
        select(ShiftAssignment, Shift)
        .join(Shift, ShiftAssignment.shift_id == Shift.id)
        .where(ShiftAssignment.user_id == user_id)
        .where(ShiftAssignment.status == AssignmentStatus.ASSIGNED)
        .where(Shift.start_time >= week_start)
        .where(Shift.start_time < week_end)
    )
    results = db.exec(statement).all()
    total_hours = 0.0
    for assignment, shift in results:
        total_hours += (shift.end_time - shift.start_time).total_seconds() / 3600
    return total_hours


def suggest_staff_for_shift(db: Session, shift: Shift, limit: int = 5) -> list[dict]:
    staff_members = db.exec(
        select(User).where(
            User.organization_id == shift.organization_id,
            User.role == UserRole.STAFF,
            User.is_active == True,
        )
    ).all()

    week_start, week_end = get_week_bounds(shift.start_time)
    candidates = []

    for user in staff_members:
        if has_conflict(db, user.id, shift.start_time, shift.end_time):
            continue

        profile = db.exec(select(StaffProfile).where(StaffProfile.user_id == user.id)).first()
        if profile and profile.certification_expiry and profile.certification_expiry < shift.start_time:
            continue

        current_hours = hours_assigned_this_week(db, user.id, week_start, week_end)

        candidates.append({
            "user_id": user.id,
            "name": user.name,
            "current_week_hours": round(current_hours, 2),
        })

    candidates.sort(key=lambda c: c["current_week_hours"])
    return candidates[:limit]