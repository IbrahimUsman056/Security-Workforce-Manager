from enum import Enum
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class AttendanceStatus(str, Enum):
    ON_TIME = "ON_TIME"
    LATE = "LATE"
    ABSENT = "ABSENT"
    LEFT_EARLY = "LEFT_EARLY"

class Attendance(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    shift_assignment_id: int = Field(foreign_key="shiftassignment.id", unique=True)
    check_in_time: Optional[datetime] = None
    check_in_lat: Optional[float] = None
    check_in_lng: Optional[float] = None
    check_in_within_geofence: Optional[bool] = None
    selfie_url: Optional[str] = None
    face_match_score: Optional[float] = None
    face_match_passed: Optional[bool] = None
    check_out_time: Optional[datetime] = None
    check_out_lat: Optional[float] = None
    check_out_lng: Optional[float] = None
    status: Optional[AttendanceStatus] = None
    total_hours: Optional[float] = None