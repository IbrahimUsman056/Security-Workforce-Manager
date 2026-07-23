from typing import Optional
from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class StaffJoinRequest(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str
    subdomain: str