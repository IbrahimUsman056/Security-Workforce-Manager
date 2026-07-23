from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_db
from app.models.shift import Shift
from app.models.shift_assignment import ShiftAssignment, AssignmentStatus
from app.models.user import User, UserRole
from app.schemas.shift_assignment import ShiftAssignmentCreate, ShiftAssignmentRead
from app.core.deps import require_role, get_current_user
from app.services.scheduling import has_conflict, count_assigned_staff
from app.services.access import check_site_access, get_accessible_site_ids

router = APIRouter(prefix="/shift-assignments", tags=["shift-assignments"])

@router.post("/", response_model=ShiftAssignmentRead)
def assign_staff_to_shift(
    payload: ShiftAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPERVISOR])),
):
    shift = db.get(Shift, payload.shift_id)
    if not shift or shift.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    if not check_site_access(db, current_user, shift.site_id):
        raise HTTPException(status_code=403, detail="Not authorized for this site")
    
    user = db.get(User, payload.user_id)
    if not user or user.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="User not found")

    if has_conflict(db, payload.user_id, shift.start_time, shift.end_time):
        raise HTTPException(
            status_code=400,
            detail="This staff member already has an overlapping shift assignment",
        )

    current_count = count_assigned_staff(db, payload.shift_id)
    if current_count >= shift.required_count:
        raise HTTPException(
            status_code=400,
            detail="This shift already has the required number of staff assigned",
        )

    assignment = ShiftAssignment(shift_id=payload.shift_id, user_id=payload.user_id)
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.get("/", response_model=List[ShiftAssignmentRead])
def list_assignments(
    shift_id: int | None = None,
    user_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = (
        select(ShiftAssignment)
        .join(Shift, ShiftAssignment.shift_id == Shift.id)
        .where(Shift.organization_id == current_user.organization_id)
    )
    if current_user.role == UserRole.SUPERVISOR:
        site_ids = get_accessible_site_ids(db, current_user)
        statement = statement.where(Shift.site_id.in_(site_ids))
    if shift_id:
        statement = statement.where(ShiftAssignment.shift_id == shift_id)
    if user_id:
        statement = statement.where(ShiftAssignment.user_id == user_id)
    return db.exec(statement).all()


@router.get("/my-shifts", response_model=List[ShiftAssignmentRead])
def my_shifts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = select(ShiftAssignment).where(ShiftAssignment.user_id == current_user.id)
    return db.exec(statement).all()


@router.delete("/{assignment_id}")
def cancel_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPERVISOR])),
):
    assignment = db.get(ShiftAssignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    shift = db.get(Shift, assignment.shift_id)

    if not check_site_access(db, current_user, shift.site_id):
        raise HTTPException(status_code=403, detail="Not authorized for this site")

    if not shift or shift.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    assignment.status = AssignmentStatus.CANCELLED
    db.add(assignment)
    db.commit()
    return {"detail": "Assignment cancelled"}