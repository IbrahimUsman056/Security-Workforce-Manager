from apscheduler.schedulers.background import BackgroundScheduler
from app.jobs.shift_reminders import send_shift_reminders
from app.jobs.cert_expiry_check import check_certification_expiry
from app.jobs.generate_recurring_shifts import run_recurring_shift_generation
from app.jobs.sla_escalation import escalate_overdue_incidents
from app.jobs.document_expiry_check import check_document_expiry

scheduler = BackgroundScheduler()

def start_scheduler():
    scheduler.add_job(send_shift_reminders, "interval", minutes=15, id="shift_reminders")
    scheduler.add_job(check_certification_expiry, "cron", hour=8, id="cert_expiry_check")
    scheduler.add_job(run_recurring_shift_generation, "cron", hour=1, id="generate_recurring_shifts")
    scheduler.add_job(escalate_overdue_incidents, "interval", minutes=15, id="sla_escalation")
    scheduler.add_job(check_document_expiry, "cron", hour=8, id="document_expiry_check")
    scheduler.start()