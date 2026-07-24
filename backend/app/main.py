from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
import os
from app.database import create_db_and_tables
from app.core.exceptions import validation_exception_handler
from app.routers import (
    organizations, auth, users, sites, shifts, shift_templates, shift_assignments,
    attendance, incidents, swaps, notifications, reports, audit_logs, staff_profiles,
    payroll_adjustments, invoices, staff_documents, client_portal, dashboard,
)

app = FastAPI(title="Security Workforce Manager API")

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://security-workforce-manager-iota.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(RequestValidationError, validation_exception_handler)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

app.include_router(organizations.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(sites.router)
app.include_router(shifts.router)
app.include_router(shift_templates.router)
app.include_router(shift_assignments.router)
app.include_router(attendance.router)
app.include_router(incidents.router)
app.include_router(swaps.router)
app.include_router(notifications.router)
app.include_router(reports.router)
app.include_router(audit_logs.router)
app.include_router(staff_profiles.router)
app.include_router(payroll_adjustments.router)
app.include_router(invoices.router)
app.include_router(staff_documents.router)
app.include_router(client_portal.router)
app.include_router(dashboard.router)

@app.get("/")
def root():
    return {"status": "Security Workforce Manager API running"}