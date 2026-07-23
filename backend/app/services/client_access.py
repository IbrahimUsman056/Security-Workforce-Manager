from sqlmodel import Session, select
from app.models.client_site_access import ClientSiteAccess

def get_client_site_ids(db: Session, user_id: int) -> list[int]:
    statement = select(ClientSiteAccess).where(ClientSiteAccess.user_id == user_id)
    access_rows = db.exec(statement).all()
    return [row.site_id for row in access_rows]


def client_has_site_access(db: Session, user_id: int, site_id: int) -> bool:
    statement = select(ClientSiteAccess).where(
        ClientSiteAccess.user_id == user_id,
        ClientSiteAccess.site_id == site_id,
    )
    return db.exec(statement).first() is not None