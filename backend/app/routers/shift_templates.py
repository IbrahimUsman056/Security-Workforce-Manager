from datetime import date, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_db
from app.models.shift_template import ShiftTemplate
from app.models.site import Site
from app.models.user import User, UserRole
from app.schemas.shift_template import ShiftTemplateCreate, ShiftTemplateRead, ShiftTemplateUpdate
from app.core.deps import require_role, get_current_user
from app.services.recurrence import generate_shifts_from_template
from app.services.access import check_site_access, get_accessible_site_ids

router = APIRouter(prefix="/shift-templates", tags=["shift-templates"])

@router.post("/", response_model=ShiftTemplateRead)
def create_template(
    payload: ShiftTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPERVISOR])),
):
    site = db.get(Site, payload.site_id)
    if not site or site.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Site not found")
    if not check_site_access(db, current_user, payload.site_id):
        raise HTTPException(status_code=403, detail="Not authorized for this site")

    template = ShiftTemplate(**payload.model_dump(), organization_id=current_user.organization_id)
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


@router.get("/", response_model=List[ShiftTemplateRead])
def list_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = select(ShiftTemplate).where(ShiftTemplate.organization_id == current_user.organization_id)
    if current_user.role == UserRole.SUPERVISOR:
        site_ids = get_accessible_site_ids(db, current_user)
        statement = statement.where(ShiftTemplate.site_id.in_(site_ids))
    return db.exec(statement).all()


@router.patch("/{template_id}", response_model=ShiftTemplateRead)
def update_template(
    template_id: int,
    payload: ShiftTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPERVISOR])),
):
    template = db.get(ShiftTemplate, template_id)
    if not template or template.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Template not found")
    if not check_site_access(db, current_user, template.site_id):
        raise HTTPException(status_code=403, detail="Not authorized for this site")

    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(template, key, value)
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


@router.delete("/{template_id}")
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPERVISOR])),
):
    template = db.get(ShiftTemplate, template_id)
    if not template or template.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Template not found")
    if not check_site_access(db, current_user, template.site_id):
        raise HTTPException(status_code=403, detail="Not authorized for this site")

    template.is_active = False
    db.add(template)
    db.commit()
    return {"detail": "Template deactivated"}


@router.post("/{template_id}/generate")
def generate_shifts_now(
    template_id: int,
    days_ahead: int = 14,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPERVISOR])),
):
    template = db.get(ShiftTemplate, template_id)
    if not template or template.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Template not found")
    if not check_site_access(db, current_user, template.site_id):
        raise HTTPException(status_code=403, detail="Not authorized for this site")

    today = date.today()
    window_end = today + timedelta(days=days_ahead)
    count = generate_shifts_from_template(db, template, today, window_end)
    return {"detail": f"Generated {count} new shifts"}