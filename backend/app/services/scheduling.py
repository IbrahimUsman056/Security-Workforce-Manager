from sqlmodel import Session, select
from app.models.shift import Shift
from app.models.shift_assignment import ShiftAssignment, AssignmentStatus

def has_conflict(db: Session, user_id: int, new_start, new_end, exclude_assignment_id: int | None = None) -> bool:
    """
    Returns True if the user already has an active shift assignment
    that overlaps with [new_start, new_end).
    """
    statement = (
        select(ShiftAssignment, Shift)
        .join(Shift, ShiftAssignment.shift_id == Shift.id)
        .where(ShiftAssignment.user_id == user_id)
        .where(ShiftAssignment.status == AssignmentStatus.ASSIGNED)
    )
    results = db.exec(statement).all()

    for assignment, shift in results:
        if exclude_assignment_id and assignment.id == exclude_assignment_id:
            continue
        # overlap check: existing.start < new_end AND existing.end > new_start
        if shift.start_time < new_end and shift.end_time > new_start:
            return True
    return False


def count_assigned_staff(db: Session, shift_id: int) -> int:
    statement = select(ShiftAssignment).where(
        ShiftAssignment.shift_id == shift_id,
        ShiftAssignment.status == AssignmentStatus.ASSIGNED,
    )
    return len(db.exec(statement).all())