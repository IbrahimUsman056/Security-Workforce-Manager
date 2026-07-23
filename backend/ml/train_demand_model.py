"""
Trains a demand forecasting model predicting daily required staffing count
per site, using historical Shift data. Pandas-free version (NumPy + plain Python)
to avoid Windows Application Control DLL blocking issues with pandas on newer Python versions.

Run from backend/ with venv activated:
    python ml/train_demand_model.py
"""
import os
import sys
import joblib
import numpy as np
from datetime import datetime, date, timedelta
from collections import defaultdict
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, select
from app.database import engine
from app.models.shift import Shift

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "demand_model.joblib")

FEATURE_NAMES = ["site_id", "day_of_week", "is_weekend", "month", "day_of_month", "rolling_avg_7d"]


def load_daily_demand() -> dict:
    """Returns {(site_id, date): total_required_count}"""
    with Session(engine) as db:
        shifts = db.exec(select(Shift)).all()

    daily = defaultdict(int)
    for s in shifts:
        key = (s.site_id, s.start_time.date())
        daily[key] += s.required_count
    return daily


def build_feature_rows(daily: dict) -> tuple[list, list]:
    # Group by site so we can compute a 7-day rolling average per site, sorted by date
    by_site = defaultdict(list)
    for (site_id, day), demand in daily.items():
        by_site[site_id].append((day, demand))

    X_rows = []
    y_rows = []

    for site_id, entries in by_site.items():
        entries.sort(key=lambda e: e[0])  # sort by date ascending
        demands_so_far = []

        for day, demand in entries:
            # rolling average of the PRIOR up-to-7 days (avoid leaking today's value)
            if demands_so_far:
                window = demands_so_far[-7:]
                rolling_avg = sum(window) / len(window)
            else:
                rolling_avg = float(demand)  # fallback for the very first record

            row = [
                site_id,
                day.weekday(),
                1 if day.weekday() in (5, 6) else 0,
                day.month,
                day.day,
                rolling_avg,
            ]
            X_rows.append(row)
            y_rows.append(demand)

            demands_so_far.append(demand)

    return X_rows, y_rows


def main():
    print("Loading shift data from database...")
    daily = load_daily_demand()

    if len(daily) < 30:
        print(f"Not enough data to train ({len(daily)} site-day records). Run seed.py first to generate historical shifts.")
        return

    print(f"Loaded {len(daily)} site-day records.")

    X_rows, y_rows = build_feature_rows(daily)
    X = np.array(X_rows, dtype=float)
    y = np.array(y_rows, dtype=float)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Training GradientBoostingRegressor...")
    model = GradientBoostingRegressor(
        n_estimators=150,
        max_depth=3,
        learning_rate=0.1,
        random_state=42,
    )
    model.fit(X_train, y_train)

    predictions = model.predict(X_test)
    mae = mean_absolute_error(y_test, predictions)
    print(f"Test MAE: {mae:.3f} (average error in predicted staff count)")

    naive_predictions = np.full_like(y_test, fill_value=y_train.mean())
    naive_mae = mean_absolute_error(y_test, naive_predictions)
    print(f"Naive baseline MAE (always predict mean): {naive_mae:.3f}")
    print(f"Model {'beats' if mae < naive_mae else 'does NOT beat'} the naive baseline.")

    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump({
        "model": model,
        "feature_cols": FEATURE_NAMES,
        "trained_at": datetime.utcnow().isoformat(),
        "test_mae": float(mae),
    }, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")


if __name__ == "__main__":
    main()