from sqlmodel import Session
from app.database import engine
from app.services.recurrence import generate_all_active_templates

def run_recurring_shift_generation():
    with Session(engine) as db:
        results = generate_all_active_templates(db, days_ahead=14)
        total = sum(results.values())
        print(f"[recurrence] Generated {total} shifts across {len(results)} templates")