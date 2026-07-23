from datetime import datetime, timedelta
from collections import defaultdict
from sqlmodel import Session, select
from app.models.shift import Shift

DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

def forecast_next_week_staffing(db: Session, site_id: int, weeks_lookback: int = 4) -> list[dict]:
    """
    Simple moving-average forecast: for each weekday, average the required_count
    of past shifts on that weekday over the last `weeks_lookback` weeks.
    This is a baseline statistical estimate, not a machine learning model.
    """
    today = datetime.utcnow()
    lookback_start = today - timedelta(weeks=weeks_lookback)

    statement = select(Shift).where(
        Shift.site_id == site_id,
        Shift.start_time >= lookback_start,
        Shift.start_time < today,
    )
    past_shifts = db.exec(statement).all()

    by_weekday = defaultdict(list)
    for shift in past_shifts:
        weekday = shift.start_time.weekday()
        by_weekday[weekday].append(shift.required_count)

    forecast = []
    for weekday in range(7):
        counts = by_weekday.get(weekday, [])
        avg = round(sum(counts) / len(counts), 1) if counts else 0
        forecast.append({
            "day": DAY_NAMES[weekday],
            "predicted_required_staff": avg,
            "based_on_shifts": len(counts),
        })

    return forecast