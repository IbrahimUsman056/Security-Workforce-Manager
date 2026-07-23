from typing import Optional
from pydantic import BaseModel

class SiteCreate(BaseModel):
    name: str
    address: str
    lat: float
    lng: float
    geofence_radius_m: int = 150
    required_staff_count: int = 1
    supervisor_id: Optional[int] = None

class SiteRead(BaseModel):
    id: int
    name: str
    address: str
    lat: float
    lng: float
    geofence_radius_m: int
    required_staff_count: int
    supervisor_id: Optional[int]
    is_active: bool

    class Config:
        from_attributes = True

class SiteUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    geofence_radius_m: Optional[int] = None
    required_staff_count: Optional[int] = None
    supervisor_id: Optional[int] = None
    is_active: Optional[bool] = None