from enum import Enum
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class DocumentType(str, Enum):
    CNIC = "CNIC"
    LICENSE = "LICENSE"
    CONTRACT = "CONTRACT"
    OTHER = "OTHER"

class StaffDocument(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    document_type: DocumentType
    file_url: str
    expiry_date: Optional[datetime] = None
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)