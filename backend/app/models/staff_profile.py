from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship

class StaffProfile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", unique=True)
    employee_code: str = Field(unique=True)
    certification_name: Optional[str] = None
    certification_expiry: Optional[datetime] = None
    hourly_rate: Optional[float] = None
    profile_photo_url: Optional[str] = None
    bank_account_number: Optional[str] = None

    user: "User" = Relationship(back_populates="staff_profile")