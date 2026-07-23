from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_db
from app.models.site import Site
from app.models.user import User, UserRole
from app.schemas.site import SiteCreate, SiteRead, SiteUpdate
from app.core.deps import require_role, get_current_user
from app.services.audit import log_action

router = APIRouter(prefix="/sites", tags=["sites"])

@router.post("/", response_model=SiteRead)
def create_site(
    payload: SiteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    site = Site(**payload.model_dump(), organization_id=current_user.organization_id)
    db.add(site)
    db.commit()
    db.refresh(site)

    log_action(
        db, current_user.organization_id, current_user.id,
        "CREATE", "Site", site.id, after=site.model_dump()
    )
    return site

@router.get("/", response_model=List[SiteRead])
def list_sites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = select(Site).where(
        Site.is_active == True,
        Site.organization_id == current_user.organization_id,
    )
    if current_user.role == UserRole.SUPERVISOR:
        statement = statement.where(Site.supervisor_id == current_user.id)
    return db.exec(statement).all()

@router.get("/{site_id}", response_model=SiteRead)
def get_site(
    site_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    site = db.get(Site, site_id)
    if not site or site.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Site not found")
    if current_user.role == UserRole.SUPERVISOR and site.supervisor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this site")
    return site

@router.patch("/{site_id}", response_model=SiteRead)
def update_site(
    site_id: int,
    payload: SiteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    site = db.get(Site, site_id)
    if not site or site.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Site not found")

    before = site.model_dump()
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(site, key, value)
    db.add(site)
    db.commit()
    db.refresh(site)

    log_action(
        db, current_user.organization_id, current_user.id,
        "UPDATE", "Site", site.id, before=before, after=site.model_dump()
    )
    return site

@router.delete("/{site_id}")
def deactivate_site(
    site_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    site = db.get(Site, site_id)
    if not site or site.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Site not found")

    before = site.model_dump()
    site.is_active = False
    db.add(site)
    db.commit()

    log_action(
        db, current_user.organization_id, current_user.id,
        "DELETE", "Site", site.id, before=before, after={"is_active": False}
    )
    return {"detail": "Site deactivated"}