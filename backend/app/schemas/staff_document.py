from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.staff_document import DocumentType

class StaffDocumentRead(BaseModel):
    id: int
    user_id: int
    document_type: DocumentType
    file_url: str
    expiry_date: Optional[datetime]
    uploaded_at: datetime

    class Config:
        from_attributes = True