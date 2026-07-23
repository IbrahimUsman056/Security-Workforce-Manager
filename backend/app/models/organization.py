from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class Organization(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    subdomain: str = Field(unique=True, index=True)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)