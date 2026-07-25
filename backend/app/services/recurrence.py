from datetime import datetime, date, timedelta
from sqlmodel import Session, select
from app.models.shift_template import ShiftTemplate
from app.models.shift import Shift

DAY_CODES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]

def generate_shifts_from_template(db: Session, template: ShiftTemplate, window_start: date, window_end: date) -> dict:
    """
    Generates concrete Shift rows for a template across [window_start, window_end],
    skipping dates where a shift already exists for that site+time.
    Returns a dict with counts so callers can show an accurate, non-confusing message.
    """
    allowed_days = {d.strip().upper() for d in template.days_of_week.split(",") if d.strip()}
    created_count = 0
    skipped_existing = 0
    days_checked = 0

    effective_start = max(window_start, template.start_date)
    effective_end = min(window_end, template.end_date)

    current = effective_start
    while current <= effective_end:
        day_code = DAY_CODES[current.weekday()]
        if day_code in allowed_days:
            days_checked += 1
            shift_start = datetime.combine(current, template.start_time_of_day)
            shift_end = datetime.combine(current, template.end_time_of_day)
            if shift_end <= shift_start:
                shift_end += timedelta(days=1)

            existing = db.exec(
                select(Shift).where(
                    Shift.site_id == template.site_id,
                    Shift.start_time == shift_start,
                )
            ).first()

            if not existing:
                shift = Shift(
                    organization_id=template.organization_id,
                    site_id=template.site_id,
                    start_time=shift_start,
                    end_time=shift_end,
                    required_count=template.required_count,
                    is_recurring=True,
                    recurrence_rule=f"template:{template.id}",
                )
                db.add(shift)
                created_count += 1
            else:
                skipped_existing += 1

        current += timedelta(days=1)

    db.commit()
    return {
        "created": created_count,
        "skipped_existing": skipped_existing,
        "days_checked": days_checked,
    }

def generate_all_active_templates(db: Session, days_ahead: int = 14) -> dict:
    today = date.today()
    window_end = today + timedelta(days=days_ahead)

    templates = db.exec(select(ShiftTemplate).where(ShiftTemplate.is_active == True)).all()
    results = {}
    for template in templates:
        result = generate_shifts_from_template(db, template, today, window_end)
        results[template.id] = result["created"]
    return results