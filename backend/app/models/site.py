from typing import Optional
from sqlmodel import SQLModel, Field

class Site(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    organization_id: int = Field(foreign_key="organization.id")
    name: str
    address: str
    lat: float
    lng: float
    geofence_radius_m: int = Field(default=150)
    required_staff_count: int = Field(default=1)
    supervisor_id: Optional[int] = Field(default=None, foreign_key="user.id")
    is_active: bool = Field(default=True)