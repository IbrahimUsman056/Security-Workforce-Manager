from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class StaffProfileRead(BaseModel):
    id: int
    user_id: int
    employee_code: str
    certification_name: Optional[str]
    certification_expiry: Optional[datetime]
    hourly_rate: Optional[float]
    profile_photo_url: Optional[str]
    bank_account_number: Optional[str]

    class Config:
        from_attributes = True