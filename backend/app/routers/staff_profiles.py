from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlmodel import Session, select
from app.database import get_db
from app.models.staff_profile import StaffProfile
from app.models.user import User, UserRole
from app.schemas.staff_profile import StaffProfileRead
from app.core.deps import get_current_user, require_role
from app.utils.file_upload import save_profile_photo

router = APIRouter(prefix="/staff-profiles", tags=["staff-profiles"])

@router.post("/", response_model=StaffProfileRead)
def create_or_update_profile(
    employee_code: str = Form(...),
    certification_name: str = Form(None),
    hourly_rate: float = Form(None),
    bank_account_number: str = Form(None),
    photo: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.exec(select(StaffProfile).where(StaffProfile.user_id == current_user.id)).first()

    photo_url = existing.profile_photo_url if existing else None
    if photo:
        photo_url = save_profile_photo(photo)

    if existing:
        existing.employee_code = employee_code
        existing.certification_name = certification_name
        existing.hourly_rate = hourly_rate
        existing.bank_account_number = bank_account_number
        existing.profile_photo_url = photo_url
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing

    profile = StaffProfile(
        user_id=current_user.id,
        employee_code=employee_code,
        certification_name=certification_name,
        hourly_rate=hourly_rate,
        bank_account_number=bank_account_number,
        profile_photo_url=photo_url,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/me", response_model=StaffProfileRead)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.exec(select(StaffProfile).where(StaffProfile.user_id == current_user.id)).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Create one first.")
    return profile


@router.get("/{user_id}", response_model=StaffProfileRead)
def get_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPERVISOR])),
):
    profile = db.exec(select(StaffProfile).where(StaffProfile.user_id == user_id)).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile