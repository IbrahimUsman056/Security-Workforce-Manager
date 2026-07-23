from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_db
from app.models.swap_request import SwapRequest, SwapStatus
from app.models.shift_assignment import ShiftAssignment
from app.models.shift import Shift
from app.models.user import User, UserRole
from app.schemas.swap_request import SwapRequestCreate, SwapRequestRead, SwapStatusUpdate
from app.core.deps import get_current_user, require_role
from app.services.scheduling import has_conflict
from app.services.notifications import create_notification
from app.services.access import check_site_access, get_accessible_site_ids

router = APIRouter(prefix="/swaps", tags=["swaps"])

@router.post("/", response_model=SwapRequestRead)
def request_swap(
    payload: SwapRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assignment = db.get(ShiftAssignment, payload.shift_assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Shift assignment not found")
    if assignment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="This assignment does not belong to you")

    shift = db.get(Shift, assignment.shift_id)
    if not shift or shift.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Shift assignment not found")

    swap = SwapRequest(
        shift_assignment_id=payload.shift_assignment_id,
        requested_by=current_user.id,
        proposed_replacement_id=payload.proposed_replacement_id,
        reason=payload.reason,
    )
    db.add(swap)
    db.commit()
    db.refresh(swap)

    create_notification(
        db, current_user.id, "Swap Requested",
        f"Your swap request for assignment #{assignment.id} has been submitted."
    )
    return swap


@router.get("/", response_model=List[SwapRequestRead])
def list_swaps(
    status: SwapStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPERVISOR])),
):
    statement = (
        select(SwapRequest)
        .join(ShiftAssignment, SwapRequest.shift_assignment_id == ShiftAssignment.id)
        .join(Shift, ShiftAssignment.shift_id == Shift.id)
        .where(Shift.organization_id == current_user.organization_id)
    )
    if current_user.role == UserRole.SUPERVISOR:
        site_ids = get_accessible_site_ids(db, current_user)
        statement = statement.where(Shift.site_id.in_(site_ids))
    if status:
        statement = statement.where(SwapRequest.status == status)
    return db.exec(statement).all()


@router.get("/my-requests", response_model=List[SwapRequestRead])
def my_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = select(SwapRequest).where(SwapRequest.requested_by == current_user.id)
    return db.exec(statement).all()


@router.patch("/{swap_id}/status", response_model=SwapRequestRead)
def update_swap_status(
    swap_id: int,
    payload: SwapStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPERVISOR])),
):
    swap = db.get(SwapRequest, swap_id)
    if not swap:
        raise HTTPException(status_code=404, detail="Swap request not found")

    assignment = db.get(ShiftAssignment, swap.shift_assignment_id)
    shift = db.get(Shift, assignment.shift_id)

    if not check_site_access(db, current_user, shift.site_id):
        raise HTTPException(status_code=403, detail="Not authorized for this site")

    if not shift or shift.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Swap request not found")

    if payload.status == SwapStatus.APPROVED:
        if swap.proposed_replacement_id:
            replacement = db.get(User, swap.proposed_replacement_id)
            if not replacement or replacement.organization_id != current_user.organization_id:
                raise HTTPException(status_code=404, detail="Proposed replacement not found")
            if has_conflict(db, swap.proposed_replacement_id, shift.start_time, shift.end_time):
                raise HTTPException(
                    status_code=400,
                    detail="Proposed replacement already has an overlapping shift",
                )
            assignment.user_id = swap.proposed_replacement_id
            db.add(assignment)

    swap.status = payload.status
    swap.reviewed_by = current_user.id
    db.add(swap)
    db.commit()
    db.refresh(swap)

    create_notification(
        db, swap.requested_by, "Swap Request Update",
        f"Your swap request #{swap.id} was {payload.status.value.lower()}."
    )
    return swap