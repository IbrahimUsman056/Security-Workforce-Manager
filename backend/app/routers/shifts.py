from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func
from app.database import get_db
from app.models.shift import Shift
from app.models.shift_assignment import ShiftAssignment, AssignmentStatus
from app.models.site import Site
from app.models.user import User, UserRole
from app.schemas.shift import ShiftCreate, ShiftRead, ShiftUpdate
from app.schemas.suggested_staff import SuggestedStaffEntry
from app.core.deps import require_role, get_current_user
from app.services.access import check_site_access, get_accessible_site_ids
from app.services.optimizer import suggest_staff_for_shift

router = APIRouter(prefix="/shifts", tags=["shifts"])

@router.post("/", response_model=ShiftRead)
def create_shift(
    payload: ShiftCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPERVISOR])),
):
    if payload.end_time <= payload.start_time:
        raise HTTPException(status_code=400, detail="end_time must be after start_time")

    site = db.get(Site, payload.site_id)
    if not site or site.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Site not found")
    if not check_site_access(db, current_user, payload.site_id):
        raise HTTPException(status_code=403, detail="Not authorized for this site")

    shift = Shift(**payload.model_dump(), organization_id=current_user.organization_id)
    db.add(shift)
    db.commit()
    db.refresh(shift)
    result = ShiftRead.model_validate(shift)
    result.assigned_count = 0
    return result


@router.get("/")
def list_shifts(
    site_id: Optional[int] = None,
    start_date: Optional[datetime] = Query(None, description="Only shifts starting on/after this datetime"),
    end_date: Optional[datetime] = Query(None, description="Only shifts starting on/before this datetime"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = select(Shift).where(Shift.organization_id == current_user.organization_id)
    if current_user.role == UserRole.SUPERVISOR:
        site_ids = get_accessible_site_ids(db, current_user)
        statement = statement.where(Shift.site_id.in_(site_ids))
    if site_id:
        statement = statement.where(Shift.site_id == site_id)
    if start_date:
        statement = statement.where(Shift.start_time >= start_date)
    if end_date:
        statement = statement.where(Shift.start_time <= end_date)
    statement = statement.order_by(Shift.start_time.desc())

    # Count total matching rows (before pagination) for the frontend's page controls
    count_statement = select(func.count()).select_from(statement.subquery())
    total = db.exec(count_statement).one()

    offset = (page - 1) * page_size
    paged_statement = statement.offset(offset).limit(page_size)
    shifts = db.exec(paged_statement).all()

    # Single bulk query for assignment counts, instead of one query per shift (N+1 fix)
    shift_ids = [s.id for s in shifts]
    counts_by_shift = {}
    if shift_ids:
        count_rows = db.exec(
            select(ShiftAssignment.shift_id, func.count())
            .where(ShiftAssignment.shift_id.in_(shift_ids))
            .where(ShiftAssignment.status == AssignmentStatus.ASSIGNED)
            .group_by(ShiftAssignment.shift_id)
        ).all()
        counts_by_shift = {shift_id: count for shift_id, count in count_rows}

    items = []
    for s in shifts:
        item = ShiftRead.model_validate(s)
        item.assigned_count = counts_by_shift.get(s.id, 0)
        items.append(item)

    total_pages = (total + page_size - 1) // page_size if total else 1
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/{shift_id}", response_model=ShiftRead)
def get_shift(
    shift_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    shift = db.get(Shift, shift_id)
    if not shift or shift.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Shift not found")
    if not check_site_access(db, current_user, shift.site_id):
        raise HTTPException(status_code=403, detail="Not authorized for this site")

    count = db.exec(
        select(func.count()).select_from(ShiftAssignment)
        .where(ShiftAssignment.shift_id == shift_id, ShiftAssignment.status == AssignmentStatus.ASSIGNED)
    ).one()
    result = ShiftRead.model_validate(shift)
    result.assigned_count = count
    return result


@router.patch("/{shift_id}", response_model=ShiftRead)
def update_shift(
    shift_id: int,
    payload: ShiftUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPERVISOR])),
):
    shift = db.get(Shift, shift_id)
    if not shift or shift.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Shift not found")
    if not check_site_access(db, current_user, shift.site_id):
        raise HTTPException(status_code=403, detail="Not authorized for this site")

    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(shift, key, value)
    db.add(shift)
    db.commit()
    db.refresh(shift)
    result = ShiftRead.model_validate(shift)
    count = db.exec(
        select(func.count()).select_from(ShiftAssignment)
        .where(ShiftAssignment.shift_id == shift_id, ShiftAssignment.status == AssignmentStatus.ASSIGNED)
    ).one()
    result.assigned_count = count
    return result


@router.delete("/{shift_id}")
def delete_shift(
    shift_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPERVISOR])),
):
    shift = db.get(Shift, shift_id)
    if not shift or shift.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Shift not found")
    if not check_site_access(db, current_user, shift.site_id):
        raise HTTPException(status_code=403, detail="Not authorized for this site")
    db.delete(shift)
    db.commit()
    return {"detail": "Shift deleted"}


@router.get("/{shift_id}/suggested-staff", response_model=List[SuggestedStaffEntry])
def get_suggested_staff(
    shift_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPERVISOR])),
):
    shift = db.get(Shift, shift_id)
    if not shift or shift.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Shift not found")
    if not check_site_access(db, current_user, shift.site_id):
        raise HTTPException(status_code=403, detail="Not authorized for this site")
    return suggest_staff_for_shift(db, shift)