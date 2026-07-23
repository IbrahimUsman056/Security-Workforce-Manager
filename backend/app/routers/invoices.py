import io
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from app.database import get_db
from app.models.invoice import Invoice
from app.models.site import Site
from app.models.user import User, UserRole
from app.schemas.invoice import InvoiceCreate, InvoiceRead, InvoiceStatusUpdate
from app.core.deps import require_role
from app.services.billing import calculate_actual_hours_for_site
from app.services.invoice_pdf import generate_invoice_pdf

router = APIRouter(prefix="/invoices", tags=["invoices"])

@router.post("/", response_model=InvoiceRead)
def create_invoice(
    payload: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    site = db.get(Site, payload.site_id)
    if not site or site.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Site not found")

    actual_hours = calculate_actual_hours_for_site(db, payload.site_id, payload.period_start, payload.period_end)
    total_amount = round(actual_hours * payload.rate_per_hour, 2)

    invoice = Invoice(
        organization_id=current_user.organization_id,
        site_id=payload.site_id,
        period_start=payload.period_start,
        period_end=payload.period_end,
        contracted_hours=payload.contracted_hours,
        actual_hours=round(actual_hours, 2),
        rate_per_hour=payload.rate_per_hour,
        currency=payload.currency,
        total_amount=total_amount,
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice


@router.get("/", response_model=List[InvoiceRead])
def list_invoices(
    site_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    statement = select(Invoice).where(Invoice.organization_id == current_user.organization_id)
    if site_id:
        statement = statement.where(Invoice.site_id == site_id)
    return db.exec(statement).all()


@router.patch("/{invoice_id}/status", response_model=InvoiceRead)
def update_invoice_status(
    invoice_id: int,
    payload: InvoiceStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    invoice = db.get(Invoice, invoice_id)
    if not invoice or invoice.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Invoice not found")
    invoice.status = payload.status
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice


@router.get("/{invoice_id}/pdf")
def download_invoice_pdf(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    invoice = db.get(Invoice, invoice_id)
    if not invoice or invoice.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Invoice not found")
    site = db.get(Site, invoice.site_id)

    pdf_bytes = generate_invoice_pdf(site.name, invoice)
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=invoice_{invoice.id}.pdf"},
    )