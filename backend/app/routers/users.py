from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserRead, UserUpdate, UserCreate
from app.core.deps import get_current_user, require_role
from app.core.security import hash_password
from app.services.audit import log_action
from app.models.client_site_access import ClientSiteAccess
from app.models.site import Site
from app.schemas.client_portal import ClientSiteRead

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserRead)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/", response_model=List[UserRead])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPERVISOR])),
):
    statement = select(User).where(User.organization_id == current_user.organization_id)
    return db.exec(statement).all()

@router.get("/{user_id}", response_model=UserRead)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPERVISOR])),
):
    user = db.get(User, user_id)
    if not user or user.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.patch("/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    user = db.get(User, user_id)
    if not user or user.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="User not found")

    before = {"name": user.name, "phone": user.phone, "is_active": user.is_active}
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(user, key, value)
    db.add(user)
    db.commit()
    db.refresh(user)

    log_action(
        db, current_user.organization_id, current_user.id,
        "UPDATE", "User", user.id, before=before,
        after={"name": user.name, "phone": user.phone, "is_active": user.is_active},
    )
    return user

@router.post("/create-privileged", response_model=UserRead)
def create_privileged_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    existing = db.exec(select(User).where(User.email == payload.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        organization_id=current_user.organization_id,
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/{user_id}/grant-site-access")
def grant_client_site_access(
    user_id: int,
    site_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    target_user = db.get(User, user_id)
    if not target_user or target_user.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="User not found")
    if target_user.role != UserRole.CLIENT:
        raise HTTPException(status_code=400, detail="Site access can only be granted to CLIENT role users")

    site = db.get(Site, site_id)
    if not site or site.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Site not found")

    existing = db.exec(
        select(ClientSiteAccess).where(
            ClientSiteAccess.user_id == user_id,
            ClientSiteAccess.site_id == site_id,
        )
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Access already granted")

    access = ClientSiteAccess(user_id=user_id, site_id=site_id)
    db.add(access)
    db.commit()
    return {"detail": "Access granted"}


@router.delete("/{user_id}/revoke-site-access")
def revoke_client_site_access(
    user_id: int,
    site_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    access = db.exec(
        select(ClientSiteAccess).where(
            ClientSiteAccess.user_id == user_id,
            ClientSiteAccess.site_id == site_id,
        )
    ).first()
    if not access:
        raise HTTPException(status_code=404, detail="Access not found")
    db.delete(access)
    db.commit()
    return {"detail": "Access revoked"}


@router.get("/{user_id}/site-access", response_model=List[int])
def list_client_site_access(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    statement = select(ClientSiteAccess).where(ClientSiteAccess.user_id == user_id)
    rows = db.exec(statement).all()
    return [row.site_id for row in rows]

@router.get("/client-site-access/all")
def list_all_client_site_access(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    statement = (
        select(ClientSiteAccess)
        .join(User, ClientSiteAccess.user_id == User.id)
        .where(User.organization_id == current_user.organization_id)
    )
    rows = db.exec(statement).all()
    return [{"client_id": row.user_id, "site_id": row.site_id} for row in rows]