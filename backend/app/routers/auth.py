from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from app.database import get_db
from app.models.user import User, UserRole
from app.models.organization import Organization
from app.schemas.auth import LoginRequest, TokenResponse, StaffJoinRequest
from app.schemas.user import UserRead
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserRead)
def register(payload: StaffJoinRequest, db: Session = Depends(get_db)):
    org = db.exec(select(Organization).where(Organization.subdomain == payload.subdomain)).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found for that subdomain")
    if not org.is_active:
        raise HTTPException(status_code=403, detail="Organization is deactivated")

    existing = db.exec(select(User).where(User.email == payload.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        organization_id=org.id,
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        hashed_password=hash_password(payload.password),
        role=UserRole.STAFF,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.exec(select(User).where(User.email == payload.email)).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    token = create_access_token({
        "sub": str(user.id),
        "role": user.role,
        "org_id": user.organization_id,
    })
    return TokenResponse(access_token=token)


@router.post("/token", response_model=TokenResponse)
def login_for_swagger(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.exec(select(User).where(User.email == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    token = create_access_token({
        "sub": str(user.id),
        "role": user.role,
        "org_id": user.organization_id,
    })
    return TokenResponse(access_token=token)