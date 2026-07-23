from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_db
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.schemas.organization import OrganizationRegister, OrganizationRead
from app.schemas.auth import TokenResponse
from app.core.security import hash_password, create_access_token
from app.core.deps import get_current_organization

router = APIRouter(prefix="/organizations", tags=["organizations"])

@router.post("/register", response_model=TokenResponse)
def register_organization(payload: OrganizationRegister, db: Session = Depends(get_db)):
    existing_org = db.exec(
        select(Organization).where(Organization.subdomain == payload.subdomain)
    ).first()
    if existing_org:
        raise HTTPException(status_code=400, detail="Subdomain already taken")

    existing_user = db.exec(select(User).where(User.email == payload.admin_email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    org = Organization(name=payload.org_name, subdomain=payload.subdomain)
    db.add(org)
    db.commit()
    db.refresh(org)

    admin = User(
        organization_id=org.id,
        name=payload.admin_name,
        email=payload.admin_email,
        phone=payload.admin_phone,
        hashed_password=hash_password(payload.admin_password),
        role=UserRole.ADMIN,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)

    token = create_access_token({
        "sub": str(admin.id),
        "role": admin.role,
        "org_id": admin.organization_id,
    })
    return TokenResponse(access_token=token)


@router.get("/me", response_model=OrganizationRead)
def get_my_organization(current_org: Organization = Depends(get_current_organization)):
    return current_org