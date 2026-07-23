from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.attendance import AttendanceStatus

class CheckOutRequest(BaseModel):
    lat: float
    lng: float

class AttendanceRead(BaseModel):
    id: int
    shift_assignment_id: int
    check_in_time: Optional[datetime]
    check_in_lat: Optional[float]
    check_in_lng: Optional[float]
    check_in_within_geofence: Optional[bool]
    selfie_url: Optional[str]
    face_match_score: Optional[float]
    face_match_passed: Optional[bool]
    check_out_time: Optional[datetime]
    check_out_lat: Optional[float]
    check_out_lng: Optional[float]
    status: Optional[AttendanceStatus]
    total_hours: Optional[float]

    class Config:
        from_attributes = True