from pydantic import BaseModel

class PayrollEntry(BaseModel):
    user_id: int
    name: str
    total_hours: float
    overtime_hours: float
    shifts_worked: int
    late_count: int
    absent_count: int

class NetPayrollEntry(BaseModel):
    user_id: int
    name: str
    total_hours: float
    overtime_hours: float
    shifts_worked: int
    late_count: int
    absent_count: int
    hourly_rate: float
    base_pay: float
    bonus_total: float
    deduction_total: float
    net_pay: float

class IncidentStatsEntry(BaseModel):
    site_id: int
    site_name: str
    total_incidents: int
    pending: int
    approved: int
    escalated: int
    rejected: int