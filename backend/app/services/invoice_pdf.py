import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and draw the total page count
    along with a clean branded footer on every page.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        
        # Bottom Accent Line
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(20 * mm, 18 * mm, 190 * mm, 18 * mm)

        # Footer Text
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(20 * mm, 12 * mm, "Security Workforce Manager — Confidential Invoice Document")
        
        # Dynamic Page Number
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(190 * mm, 12 * mm, page_text)
        
        self.restoreState()


def generate_invoice_pdf(site_name: str, invoice) -> bytes:
    buffer = io.BytesIO()

    # Document Setup (A4 with 20mm margins)
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=25 * mm,
    )

    # Theme Color Palette
    PRIMARY = colors.HexColor("#0F172A")      # Dark Slate/Navy
    ACCENT = colors.HexColor("#0284C7")       # Sky Blue Accent
    TEXT_DARK = colors.HexColor("#1E293B")    # Slate 800
    TEXT_MUTED = colors.HexColor("#64748B")   # Slate 500
    BG_LIGHT = colors.HexColor("#F8FAFC")     # Soft Background Tint
    BORDER_COLOR = colors.HexColor("#E2E8F0") # Border Gray

    # Typography Stylesheet
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=PRIMARY
    )

    badge_style = ParagraphStyle(
        'InvoiceBadge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=14,
        textColor=ACCENT,
        alignment=2 # Right align
    )

    meta_label = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=TEXT_MUTED
    )

    meta_value = ParagraphStyle(
        'MetaValue',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=TEXT_DARK
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=PRIMARY
    )

    table_body_style = ParagraphStyle(
        'TableBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=TEXT_DARK
    )

    table_body_right = ParagraphStyle(
        'TableBodyRight',
        parent=table_body_style,
        alignment=2
    )

    total_label_style = ParagraphStyle(
        'TotalLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=PRIMARY
    )

    total_val_style = ParagraphStyle(
        'TotalValue',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=ACCENT,
        alignment=2
    )

    elements = []

    # -------------------------------------------------------------------------
    # 1. HEADER SECTION (Brand Title & Invoice Tag)
    # -------------------------------------------------------------------------
    header_data = [
        [
            Paragraph("Security Workforce Manager", title_style),
            Paragraph("INVOICE", badge_style)
        ]
    ]
    header_table = Table(header_data, colWidths=[110 * mm, 60 * mm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(header_table)

    elements.append(Spacer(1, 4 * mm))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY, spaceAfter=8 * mm))

    # -------------------------------------------------------------------------
    # 2. METADATA CARDS (Bill To & Invoice Details)
    # -------------------------------------------------------------------------
    invoice_id = getattr(invoice, 'id', 'INV-001')
    issue_date = datetime.now().strftime('%Y-%m-%d')
    p_start = invoice.period_start.strftime('%Y-%m-%d') if hasattr(invoice.period_start, 'strftime') else str(invoice.period_start)
    p_end = invoice.period_end.strftime('%Y-%m-%d') if hasattr(invoice.period_end, 'strftime') else str(invoice.period_end)

    left_info = [
        Paragraph("BILLING TARGET / SITE", meta_label),
        Paragraph(f"<b>{site_name}</b>", meta_value),
        Paragraph(f"Service Location", meta_value),
    ]

    right_info = [
        Paragraph(f"<b>Invoice #:</b> {invoice_id}", meta_value),
        Paragraph(f"<b>Issue Date:</b> {issue_date}", meta_value),
        Paragraph(f"<b>Billing Period:</b> {p_start} to {p_end}", meta_value),
    ]

    meta_table = Table(
        [[left_info, right_info]],
        colWidths=[85 * mm, 85 * mm]
    )
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
        ('PADDING', (0, 0), (-1, -1), 10),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 8 * mm))

    # -------------------------------------------------------------------------
    # 3. ITEMIZED SERVICES TABLE
    # -------------------------------------------------------------------------
    currency = getattr(invoice, 'currency', 'USD')
    contracted = getattr(invoice, 'contracted_hours', 0)
    actual = getattr(invoice, 'actual_hours', 0)
    rate = getattr(invoice, 'rate_per_hour', 0.0)

    # Line item calculated subtotal
    subtotal = actual * rate

    table_data = [
        [
            Paragraph("Description", table_header_style),
            Paragraph("Contracted", table_header_style),
            Paragraph("Actual Hours", table_header_style),
            Paragraph("Hourly Rate", table_header_style),
            Paragraph("Amount", ParagraphStyle('HeaderRight', parent=table_header_style, alignment=2)),
        ],
        [
            Paragraph(f"Security Workforce Guarding Services<br/><font color='#64748B' size=8>Site: {site_name}</font>", table_body_style),
            Paragraph(f"{contracted} hrs", table_body_style),
            Paragraph(f"{actual} hrs", table_body_style),
            Paragraph(f"{rate:,.2f} {currency}", table_body_style),
            Paragraph(f"{subtotal:,.2f} {currency}", table_body_right),
        ]
    ]

    service_table = Table(table_data, colWidths=[60 * mm, 25 * mm, 25 * mm, 30 * mm, 30 * mm])
    service_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BG_LIGHT),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('LINEBELOW', (0, 0), (-1, 0), 1, PRIMARY),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('LINEBELOW', (0, 1), (-1, -1), 0.5, BORDER_COLOR),
    ]))
    elements.append(service_table)
    elements.append(Spacer(1, 6 * mm))

    # -------------------------------------------------------------------------
    # 4. SUMMARY & TOTALS SECTION
    # -------------------------------------------------------------------------
    total_amount = getattr(invoice, 'total_amount', subtotal)

    summary_data = [
        [Paragraph("Subtotal", meta_label), Paragraph(f"{subtotal:,.2f} {currency}", meta_value)],
        [Paragraph("Total Payable", total_label_style), Paragraph(f"{total_amount:,.2f} {currency}", total_val_style)],
    ]

    summary_table = Table(summary_data, colWidths=[40 * mm, 40 * mm])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LINEABOVE', (0, 1), (-1, 1), 1, PRIMARY),
        ('TOPPADDING', (0, 1), (-1, 1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, 1), 6),
    ]))

    # Align summary block to the right
    wrapper_table = Table([[Paragraph("", styles['Normal']), summary_table]], colWidths=[90 * mm, 80 * mm])
    wrapper_table.setStyle(TableStyle([
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    
    elements.append(KeepTogether([wrapper_table]))
    elements.append(Spacer(1, 12 * mm))

    # -------------------------------------------------------------------------
    # 5. PAYMENT & REMITTANCE NOTES
    # -------------------------------------------------------------------------
    notes_header = ParagraphStyle('NotesHeader', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, leading=13, textColor=PRIMARY)
    notes_body = ParagraphStyle('NotesBody', parent=styles['Normal'], fontName='Helvetica', fontSize=8.5, leading=12, textColor=TEXT_MUTED)

    notes_box = [
        Paragraph("Payment Terms & Notes", notes_header),
        Spacer(1, 2 * mm),
        Paragraph("• Payment is due within 30 days of invoice date.<br/>• Please include the Invoice Number on your transfer wire reference.<br/>• Direct all billing inquiries to support or site admin.", notes_body)
    ]

    notes_table = Table([[notes_box]], colWidths=[170 * mm])
    notes_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
    ]))
    
    elements.append(KeepTogether([notes_table]))

    # Build PDF Document
    doc.build(elements, canvasmaker=NumberedCanvas)

    buffer.seek(0)
    return buffer.read()