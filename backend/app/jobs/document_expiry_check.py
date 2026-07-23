from datetime import datetime, timedelta
from sqlmodel import Session, select
from app.database import engine
from app.models.staff_document import StaffDocument
from app.services.notifications import create_notification

def check_document_expiry():
    with Session(engine) as db:
        soon = datetime.utcnow() + timedelta(days=7)
        statement = select(StaffDocument).where(
            StaffDocument.expiry_date != None,
            StaffDocument.expiry_date <= soon,
        )
        expiring = db.exec(statement).all()

        for doc in expiring:
            create_notification(
                db, doc.user_id, "Document Expiring Soon",
                f"Your {doc.document_type.value} document expires on {doc.expiry_date.strftime('%Y-%m-%d')}."
            )

        print(f"[document_expiry_check] Notified about {len(expiring)} expiring documents")