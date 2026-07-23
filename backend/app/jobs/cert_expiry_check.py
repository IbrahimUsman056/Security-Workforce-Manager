from datetime import datetime, timedelta
from sqlmodel import Session, select
from app.database import engine
from app.models.staff_profile import StaffProfile
from app.services.notifications import create_notification

def check_certification_expiry():
    with Session(engine) as db:
        soon = datetime.utcnow() + timedelta(days=7)
        statement = select(StaffProfile).where(
            StaffProfile.certification_expiry != None,
            StaffProfile.certification_expiry <= soon,
        )
        expiring = db.exec(statement).all()

        for profile in expiring:
            create_notification(
                db, profile.user_id, "Certification Expiring Soon",
                f"Your certification '{profile.certification_name}' expires on "
                f"{profile.certification_expiry.strftime('%Y-%m-%d')}."
            )