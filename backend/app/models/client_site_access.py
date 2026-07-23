from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class ClientSiteAccess(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")   # the CLIENT user
    site_id: int = Field(foreign_key="site.id")
    granted_at: datetime = Field(default_factory=datetime.utcnow)