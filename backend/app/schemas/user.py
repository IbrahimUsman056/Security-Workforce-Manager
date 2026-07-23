from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str
    role: UserRole = UserRole.STAFF

class UserRead(BaseModel):
    id: int
    organization_id: int
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None