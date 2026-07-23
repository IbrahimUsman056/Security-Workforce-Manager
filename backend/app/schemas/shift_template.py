from datetime import date, time
from typing import Optional
from pydantic import BaseModel

class ShiftTemplateCreate(BaseModel):
    site_id: int
    name: str
    start_time_of_day: time
    end_time_of_day: time
    required_count: int = 1
    days_of_week: str          # "MON,WED,FRI"
    start_date: date
    end_date: date

class ShiftTemplateRead(BaseModel):
    id: int
    site_id: int
    name: str
    start_time_of_day: time
    end_time_of_day: time
    required_count: int
    days_of_week: str
    start_date: date
    end_date: date
    is_active: bool

    class Config:
        from_attributes = True

class ShiftTemplateUpdate(BaseModel):
    name: Optional[str] = None
    start_time_of_day: Optional[time] = None
    end_time_of_day: Optional[time] = None
    required_count: Optional[int] = None
    days_of_week: Optional[str] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None