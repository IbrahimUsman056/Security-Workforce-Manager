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
    Two-pass canvas to dynamically compute total pages and draw 
    the branded footer on every page.
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
        self.drawString(20 * mm, 12 * mm, "Security Workforce Manager — Confidential Payroll Document")
        
        # Dynamic Page Number
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(190 * mm, 12 * mm, page_text)
        
        self.restoreState()


def generate_payslip_pdf(org_name: str, entry: dict, period_start: datetime, period_end: datetime) -> bytes:
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
    ACCENT = colors.HexColor("#0284C7")       # Sky Blue
    TEXT_DARK = colors.HexColor("#1E293B")    # Slate 800
    TEXT_MUTED = colors.HexColor("#64748B")   # Slate 500
    BG_LIGHT = colors.HexColor("#F8FAFC")     # Card/Header Background
    BORDER_COLOR = colors.HexColor("#E2E8F0") # Border Gray
    GREEN_TEXT = colors.HexColor("#166534")   # Green for Bonuses
    RED_TEXT = colors.HexColor("#991B1B")     # Red for Deductions

    # Typography Stylesheet
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=PRIMARY
    )

    badge_style = ParagraphStyle(
        'PayslipBadge',
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

    bonus_style = ParagraphStyle(
        'BonusStyle',
        parent=table_body_right,
        textColor=GREEN_TEXT,
        fontName='Helvetica-Bold'
    )

    deduction_style = ParagraphStyle(
        'DeductionStyle',
        parent=table_body_right,
        textColor=RED_TEXT,
        fontName='Helvetica-Bold'
    )

    net_pay_label = ParagraphStyle(
        'NetPayLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=PRIMARY
    )

    net_pay_val = ParagraphStyle(
        'NetPayValue',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=17,
        textColor=ACCENT,
        alignment=2
    )

    elements = []

    # -------------------------------------------------------------------------
    # 1. HEADER SECTION (Organization Name & Payslip Badge)
    # -------------------------------------------------------------------------
    header_data = [
        [
            Paragraph(org_name, title_style),
            Paragraph("PAYSLIP STATEMENT", badge_style)
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
    # 2. METADATA CARDS (Employee Info & Pay Period)
    # -------------------------------------------------------------------------
    p_start = period_start.strftime('%Y-%m-%d') if hasattr(period_start, 'strftime') else str(period_start)
    p_end = period_end.strftime('%Y-%m-%d') if hasattr(period_end, 'strftime') else str(period_end)
    issue_date = datetime.now().strftime('%Y-%m-%d')

    left_info = [
        Paragraph("EMPLOYEE DETAILS", meta_label),
        Paragraph(f"<b>Name:</b> {entry.get('name', 'N/A')}", meta_value),
        Paragraph(f"<b>Hourly Rate:</b> {entry.get('hourly_rate', '0.00')}", meta_value),
    ]

    right_info = [
        Paragraph("PAYMENT PERIOD", meta_label),
        Paragraph(f"<b>Period:</b> {p_start} to {p_end}", meta_value),
        Paragraph(f"<b>Issue Date:</b> {issue_date}", meta_value),
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
    elements.append(Spacer(1, 6 * mm))

    # -------------------------------------------------------------------------
    # 3. WORK SUMMARY (Metrics Panel)
    # -------------------------------------------------------------------------
    summary_header = ParagraphStyle('SectionHeader', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, leading=13, textColor=PRIMARY)
    
    metrics_data = [
        [
            Paragraph("Work Metrics", summary_header),
            Paragraph(f"<b>Total Worked:</b> {entry.get('total_hours', 0)} hrs", meta_value),
            Paragraph(f"<b>Overtime:</b> {entry.get('overtime_hours', 0)} hrs", meta_value),
            Paragraph(f"<b>Lates:</b> {entry.get('late_count', 0)}", meta_value),
            Paragraph(f"<b>Absences:</b> {entry.get('absent_count', 0)}", meta_value),
        ]
    ]

    metrics_table = Table(metrics_data, colWidths=[35 * mm, 35 * mm, 35 * mm, 32 * mm, 33 * mm])
    metrics_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(metrics_table)
    elements.append(Spacer(1, 8 * mm))

    # -------------------------------------------------------------------------
    # 4. EARNINGS & DEDUCTIONS BREAKDOWN TABLE
    # -------------------------------------------------------------------------
    table_data = [
        [
            Paragraph("Item Description", table_header_style),
            Paragraph("Category", table_header_style),
            Paragraph("Amount", ParagraphStyle('HeaderRight', parent=table_header_style, alignment=2)),
        ],
        [
            Paragraph("Base Earnings", table_body_style),
            Paragraph("Standard Pay", table_body_style),
            Paragraph(f"{entry.get('base_pay', 0.00)}", table_body_right),
        ],
        [
            Paragraph("Bonuses / Allowances", table_body_style),
            Paragraph("Addition", table_body_style),
            Paragraph(f"+{entry.get('bonus_total', 0.00)}", bonus_style),
        ],
        [
            Paragraph("Deductions", table_body_style),
            Paragraph("Subtraction", table_body_style),
            Paragraph(f"-{entry.get('deduction_total', 0.00)}", deduction_style),
        ],
    ]

    breakdown_table = Table(table_data, colWidths=[80 * mm, 45 * mm, 45 * mm])
    breakdown_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BG_LIGHT),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('LINEBELOW', (0, 0), (-1, 0), 1, PRIMARY),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('LINEBELOW', (0, 1), (-1, -1), 0.5, BORDER_COLOR),
    ]))
    elements.append(breakdown_table)
    elements.append(Spacer(1, 8 * mm))

    # -------------------------------------------------------------------------
    # 5. NET PAY HIGHLIGHT CARD
    # -------------------------------------------------------------------------
    net_pay_data = [
        [
            Paragraph("NET PAYABLE AMOUNT", net_pay_label),
            Paragraph(f"{entry.get('net_pay', '0.00')}", net_pay_val)
        ]
    ]

    net_pay_table = Table(net_pay_data, colWidths=[90 * mm, 80 * mm])
    net_pay_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
        ('PADDING', (0, 0), (-1, -1), 12),
        ('BOX', (0, 0), (-1, -1), 1, PRIMARY),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))

    elements.append(KeepTogether([net_pay_table]))
    elements.append(Spacer(1, 10 * mm))

    # -------------------------------------------------------------------------
    # 6. CONFIDENTIALITY & REMITTANCE FOOTNOTE
    # -------------------------------------------------------------------------
    notes_header = ParagraphStyle('NotesHeader', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9.5, leading=12, textColor=PRIMARY)
    notes_body = ParagraphStyle('NotesBody', parent=styles['Normal'], fontName='Helvetica', fontSize=8.5, leading=12, textColor=TEXT_MUTED)

    notes_box = [
        Paragraph("Notice & Disclaimer", notes_header),
        Spacer(1, 1.5 * mm),
        Paragraph("• This payslip is a system-generated record of your earnings and deductions for the specified period.<br/>• If you notice any discrepancies in hours worked or pay amounts, please contact your administrative team immediately.", notes_body)
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