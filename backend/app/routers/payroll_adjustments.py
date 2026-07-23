from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_db
from app.models.payroll_adjustment import PayrollAdjustment
from app.models.user import User, UserRole
from app.schemas.payroll_adjustment import PayrollAdjustmentCreate, PayrollAdjustmentRead
from app.core.deps import require_role

router = APIRouter(prefix="/payroll-adjustments", tags=["payroll-adjustments"])

@router.post("/", response_model=PayrollAdjustmentRead)
def create_adjustment(
    payload: PayrollAdjustmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    target_user = db.get(User, payload.user_id)
    if not target_user or target_user.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="User not found")

    adjustment = PayrollAdjustment(
        organization_id=current_user.organization_id,
        user_id=payload.user_id,
        type=payload.type,
        label=payload.label,
        amount=payload.amount,
        period_start=payload.period_start,
        period_end=payload.period_end,
        created_by=current_user.id,
    )
    db.add(adjustment)
    db.commit()
    db.refresh(adjustment)
    return adjustment


@router.get("/", response_model=List[PayrollAdjustmentRead])
def list_adjustments(
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    statement = select(PayrollAdjustment).where(PayrollAdjustment.organization_id == current_user.organization_id)
    if user_id:
        statement = statement.where(PayrollAdjustment.user_id == user_id)
    return db.exec(statement).all()


@router.delete("/{adjustment_id}")
def delete_adjustment(
    adjustment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    adjustment = db.get(PayrollAdjustment, adjustment_id)
    if not adjustment or adjustment.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Adjustment not found")
    db.delete(adjustment)
    db.commit()
    return {"detail": "Adjustment deleted"}