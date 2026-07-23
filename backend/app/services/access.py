from sqlmodel import Session, select
from app.models.site import Site
from app.models.user import User, UserRole

def get_accessible_site_ids(db: Session, user: User) -> list[int] | None:
    """
    None = unrestricted access to all sites in the org (ADMIN).
    list  = restricted to these specific site IDs (SUPERVISOR).
    """
    if user.role == UserRole.ADMIN:
        return None
    if user.role == UserRole.SUPERVISOR:
        sites = db.exec(
            select(Site).where(
                Site.supervisor_id == user.id,
                Site.organization_id == user.organization_id,
            )
        ).all()
        return [s.id for s in sites]
    return []


def check_site_access(db: Session, user: User, site_id: int) -> bool:
    if user.role == UserRole.ADMIN:
        return True
    if user.role == UserRole.SUPERVISOR:
        site = db.get(Site, site_id)
        return bool(site and site.supervisor_id == user.id)
    return False