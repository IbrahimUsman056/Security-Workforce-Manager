from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

class OrganizationRegister(BaseModel):
    org_name: str
    subdomain: str
    admin_name: str
    admin_email: EmailStr
    admin_phone: Optional[str] = None
    admin_password: str

class OrganizationRead(BaseModel):
    id: int
    name: str
    subdomain: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True