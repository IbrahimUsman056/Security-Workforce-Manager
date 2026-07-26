"""
Trains a demand forecasting model per organization, using that org's own
historical shift data. Each org gets its own model file.

Run from backend/ with venv activated:
    python ml/train_demand_model.py
"""
import os
import sys
import joblib
import numpy as np
from datetime import datetime
from collections import defaultdict
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, select
from app.database import engine
from app.models.shift import Shift
from app.models.organization import Organization

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
FEATURE_NAMES = ["day_of_week", "is_weekend", "month", "day_of_month", "rolling_avg_7d"]


def load_daily_demand(db: Session, organization_id: int) -> dict:
    """Returns {(site_id, date): total_required_count} for ONE organization only."""
    shifts = db.exec(select(Shift).where(Shift.organization_id == organization_id)).all()

    daily = defaultdict(int)
    for s in shifts:
        key = (s.site_id, s.start_time.date())
        daily[key] += s.required_count
    return daily


def build_feature_rows(daily: dict) -> tuple[list, list, list]:
    by_site = defaultdict(list)
    for (site_id, day), demand in daily.items():
        by_site[site_id].append((day, demand))

    X_rows = []
    y_rows = []
    site_ids_row = []  # kept separately, NOT used as a model feature

    for site_id, entries in by_site.items():
        entries.sort(key=lambda e: e[0])
        demands_so_far = []

        for day, demand in entries:
            if demands_so_far:
                window = demands_so_far[-7:]
                rolling_avg = sum(window) / len(window)
            else:
                rolling_avg = float(demand)

            row = [
                day.weekday(),
                1 if day.weekday() in (5, 6) else 0,
                day.month,
                day.day,
                rolling_avg,
            ]
            X_rows.append(row)
            y_rows.append(demand)
            site_ids_row.append(site_id)

            demands_so_far.append(demand)

    return X_rows, y_rows, site_ids_row


def train_for_organization(db: Session, org: Organization) -> bool:
    daily = load_daily_demand(db, org.id)

    if len(daily) < 30:
        print(f"[{org.subdomain}] Skipped — only {len(daily)} site-day records (need at least 30).")
        return False

    X_rows, y_rows, _ = build_feature_rows(daily)
    X = np.array(X_rows, dtype=float)
    y = np.array(y_rows, dtype=float)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = GradientBoostingRegressor(n_estimators=150, max_depth=3, learning_rate=0.1, random_state=42)
    model.fit(X_train, y_train)

    predictions = model.predict(X_test)
    mae = mean_absolute_error(y_test, predictions)
    naive_mae = mean_absolute_error(y_test, np.full_like(y_test, fill_value=y_train.mean()))

    print(f"[{org.subdomain}] {len(daily)} records | Model MAE: {mae:.3f} | Naive MAE: {naive_mae:.3f} | "
          f"{'beats' if mae < naive_mae else 'does NOT beat'} baseline")

    os.makedirs(MODEL_DIR, exist_ok=True)
    model_path = os.path.join(MODEL_DIR, f"demand_model_org{org.id}.joblib")
    joblib.dump({
        "model": model,
        "feature_cols": FEATURE_NAMES,
        "trained_at": datetime.utcnow().isoformat(),
        "test_mae": float(mae),
        "organization_id": org.id,
    }, model_path)
    print(f"[{org.subdomain}] Saved to {model_path}")
    return True


def main():
    with Session(engine) as db:
        orgs = db.exec(select(Organization)).all()
        print(f"Found {len(orgs)} organizations. Training a model for each with enough data...\n")
        for org in orgs:
            train_for_organization(db, org)


if __name__ == "__main__":
    main()