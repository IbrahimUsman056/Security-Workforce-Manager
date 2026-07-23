from enum import Enum
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    SUPERVISOR = "SUPERVISOR"
    STAFF = "STAFF"
    CLIENT = "CLIENT"

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    organization_id: int = Field(foreign_key="organization.id")
    name: str
    email: str = Field(unique=True, index=True)
    phone: Optional[str] = None
    hashed_password: str
    role: UserRole = Field(default=UserRole.STAFF)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    staff_profile: Optional["StaffProfile"] = Relationship(back_populates="user")