from datetime import datetime, timedelta
from sqlmodel import Session, select
from app.database import engine
from app.models.shift import Shift
from app.models.shift_assignment import ShiftAssignment, AssignmentStatus
from app.services.notifications import create_notification

def send_shift_reminders():
    with Session(engine) as db:
        now = datetime.utcnow()
        window_start = now + timedelta(minutes=45)
        window_end = now + timedelta(minutes=75)

        statement = select(Shift).where(
            Shift.start_time >= window_start,
            Shift.start_time <= window_end,
        )
        upcoming_shifts = db.exec(statement).all()

        for shift in upcoming_shifts:
            assignments = db.exec(
                select(ShiftAssignment).where(
                    ShiftAssignment.shift_id == shift.id,
                    ShiftAssignment.status == AssignmentStatus.ASSIGNED,
                )
            ).all()
            for assignment in assignments:
                create_notification(
                    db, assignment.user_id, "Upcoming Shift",
                    f"You have a shift starting at {shift.start_time.strftime('%H:%M')} today."
                )