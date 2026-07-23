import os
import joblib
import numpy as np
from datetime import datetime, timedelta
from sqlmodel import Session, select
from app.models.shift import Shift

MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "ml", "models", "demand_model.joblib")

_cached_model_bundle = None


def _load_model_bundle():
    global _cached_model_bundle
    if _cached_model_bundle is None:
        if not os.path.exists(MODEL_PATH):
            return None
        _cached_model_bundle = joblib.load(MODEL_PATH)
    return _cached_model_bundle


def is_model_available() -> bool:
    return os.path.exists(MODEL_PATH)


def get_recent_rolling_avg(db: Session, site_id: int) -> float:
    cutoff = datetime.utcnow() - timedelta(days=7)
    statement = select(Shift).where(Shift.site_id == site_id, Shift.start_time >= cutoff)
    recent_shifts = db.exec(statement).all()
    if not recent_shifts:
        return 1.0
    daily_totals = {}
    for s in recent_shifts:
        day_key = s.start_time.date()
        daily_totals[day_key] = daily_totals.get(day_key, 0) + s.required_count
    return sum(daily_totals.values()) / len(daily_totals)


def predict_next_7_days(db: Session, site_id: int) -> list[dict]:
    bundle = _load_model_bundle()
    if bundle is None:
        return []

    model = bundle["model"]
    rolling_avg = get_recent_rolling_avg(db, site_id)

    DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    predictions = []
    today = datetime.utcnow().date()

    for offset in range(1, 8):
        target_date = today + timedelta(days=offset)
        row = [[
            site_id,
            target_date.weekday(),
            1 if target_date.weekday() in (5, 6) else 0,
            target_date.month,
            target_date.day,
            rolling_avg,
        ]]
        X = np.array(row, dtype=float)
        predicted_demand = model.predict(X)[0]

        predictions.append({
            "date": target_date.isoformat(),
            "day": DAY_NAMES[target_date.weekday()],
            "predicted_demand": round(max(0, float(predicted_demand)), 1),
        })

    return predictions