from pydantic import BaseModel

class AttendanceTrendPoint(BaseModel):
    date: str
    on_time: int
    late: int
    absent: int

class IncidentHeatmapEntry(BaseModel):
    site_id: int
    site_name: str
    low: int
    medium: int
    high: int
    critical: int

class StaffHoursEntry(BaseModel):
    user_id: int
    name: str
    total_hours: float

class ForecastEntry(BaseModel):
    day: str
    predicted_required_staff: float
    based_on_shifts: int

class MLForecastEntry(BaseModel):
    date: str
    day: str
    predicted_demand: float