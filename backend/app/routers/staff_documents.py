from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlmodel import Session, select
from app.database import get_db
from app.models.staff_document import StaffDocument, DocumentType
from app.models.user import User, UserRole
from app.schemas.staff_document import StaffDocumentRead
from app.core.deps import get_current_user, require_role
from app.utils.file_upload import save_document

router = APIRouter(prefix="/staff-documents", tags=["staff-documents"])

@router.post("/", response_model=StaffDocumentRead)
def upload_document(
    document_type: DocumentType = Form(...),
    expiry_date: Optional[datetime] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    file_url = save_document(file)

    document = StaffDocument(
        user_id=current_user.id,
        document_type=document_type,
        file_url=file_url,
        expiry_date=expiry_date,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


@router.get("/me", response_model=List[StaffDocumentRead])
def list_my_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = select(StaffDocument).where(StaffDocument.user_id == current_user.id)
    return db.exec(statement).all()


@router.get("/{user_id}", response_model=List[StaffDocumentRead])
def list_user_documents(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    target_user = db.get(User, user_id)
    if not target_user or target_user.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="User not found")

    statement = select(StaffDocument).where(StaffDocument.user_id == user_id)
    return db.exec(statement).all()


@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = db.get(StaffDocument, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if document.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to delete this document")

    db.delete(document)
    db.commit()
    return {"detail": "Document deleted"}