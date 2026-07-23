from pydantic import BaseModel

class SuggestedStaffEntry(BaseModel):
    user_id: int
    name: str
    current_week_hours: float