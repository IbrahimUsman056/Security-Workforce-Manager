from datetime import date, time
from typing import Optional
from sqlmodel import SQLModel, Field

class ShiftTemplate(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    organization_id: int = Field(foreign_key="organization.id")
    site_id: int = Field(foreign_key="site.id")
    name: str
    start_time_of_day: time
    end_time_of_day: time
    required_count: int = Field(default=1)
    days_of_week: str          # comma-separated: "MON,WED,FRI"
    start_date: date
    end_date: date
    is_active: bool = Field(default=True)