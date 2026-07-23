"""
Seed script for Security Workforce Manager.
Wipes all data and inserts 200+ related rows per operational table,
plus 6 months of historical shift data for ML training.

Run from backend/ with venv activated:
    python seed.py
"""
import random
from datetime import datetime, timedelta, date, time

from sqlmodel import Session, select, delete

from app.database import engine
from app.core.security import hash_password

from app.models.organization import Organization
from app.models.user import User, UserRole
from app.models.staff_profile import StaffProfile
from app.models.site import Site
from app.models.shift import Shift
from app.models.shift_template import ShiftTemplate
from app.models.shift_assignment import ShiftAssignment, AssignmentStatus
from app.models.attendance import Attendance, AttendanceStatus
from app.models.incident_report import IncidentReport, IncidentType, IncidentSeverity, IncidentStatus
from app.models.swap_request import SwapRequest, SwapStatus
from app.models.notification import Notification
from app.models.audit_log import AuditLog
from app.models.payroll_adjustment import PayrollAdjustment, AdjustmentType
from app.models.invoice import Invoice, InvoiceStatus
from app.models.staff_document import StaffDocument, DocumentType
from app.models.client_site_access import ClientSiteAccess

random.seed(42)
SEED_PASSWORD = "password123"


def wipe_all(db: Session):
    print("Wiping existing data...")
    db.exec(delete(ClientSiteAccess))
    db.exec(delete(StaffDocument))
    db.exec(delete(Invoice))
    db.exec(delete(PayrollAdjustment))
    db.exec(delete(AuditLog))
    db.exec(delete(Notification))
    db.exec(delete(SwapRequest))
    db.exec(delete(IncidentReport))
    db.exec(delete(Attendance))
    db.exec(delete(ShiftAssignment))
    db.exec(delete(Shift))
    db.exec(delete(ShiftTemplate))
    db.exec(delete(StaffProfile))
    db.exec(delete(Site))
    db.exec(delete(User))
    db.exec(delete(Organization))
    db.commit()
    print("Wipe complete.")


FIRST_NAMES = [
    "Ali", "Ahmed", "Hassan", "Usman", "Bilawal", "Zeeshan", "Kamran", "Tariq", "Faisal", "Imran",
    "Waqas", "Junaid", "Adnan", "Shahzad", "Rizwan", "Naveed", "Asad", "Fahad", "Talha", "Sohail",
    "Danish", "Umair", "Kashif", "Sajjad", "Nabeel", "Owais", "Salman", "Haris", "Yasir", "Arslan",
    "Mudassar", "Ehsan", "Qasim", "Adeel", "Waseem", "Shoaib", "Farhan", "Hamza", "Rehan", "Asim",
]
LAST_NAMES = ["Guard", "Khan", "Malik", "Butt", "Sheikh", "Raza", "Iqbal", "Shah", "Chaudhry", "Baig"]
CITY_SITES = [
    ("Multan", "Industrial Area"), ("Lahore", "Gulberg"), ("Karachi", "SITE Area"),
    ("Islamabad", "F-7"), ("Lahore", "Model Town"), ("Karachi", "Korangi"),
    ("Lahore", "DHA Phase 5"), ("Peshawar", "Hayatabad"), ("Rawalpindi", "Bahria Town"),
    ("Karachi", "Clifton"), ("Faisalabad", "D Ground"), ("Multan", "Cantt"),
    ("Lahore", "Johar Town"), ("Karachi", "Gulshan-e-Iqbal"), ("Islamabad", "Blue Area"),
]
SITE_TYPE_NAMES = [
    "Warehouse", "Office Tower", "Textile Mill", "Shopping Mall", "Cold Storage",
    "Distribution Center", "Corporate HQ", "Steel Plant", "Residential Complex", "Bank Branch",
    "Hospital", "University Campus", "Data Center", "Logistics Hub", "Retail Outlet",
]


def rand_name(i):
    return f"{FIRST_NAMES[i % len(FIRST_NAMES)]} {LAST_NAMES[i % len(LAST_NAMES)]}"


def seed(db: Session):
    now = datetime.utcnow()

    # ================= Organizations (3) =================
    org = Organization(name="SOS Security Services", subdomain="sos", is_active=True, created_at=now)
    org2 = Organization(name="Guardian Protection Ltd", subdomain="guardian", is_active=True, created_at=now)
    org3 = Organization(name="Falcon Security Group", subdomain="falcon", is_active=True, created_at=now)
    db.add_all([org, org2, org3])
    db.commit()
    for o in [org, org2, org3]:
        db.refresh(o)
    print(f"Created 3 organizations (main: {org.name}, plus 2 isolation-test orgs: {org2.name}, {org3.name})")

    # Give the 2 extra orgs a tiny bit of their own data, just enough to prove isolation works
    for extra_org in [org2, org3]:
        extra_admin = User(
            organization_id=extra_org.id, name=f"{extra_org.name} Admin",
            email=f"admin@{extra_org.subdomain}.com", phone="03000000000",
            hashed_password=hash_password(SEED_PASSWORD), role=UserRole.ADMIN,
            is_active=True, created_at=now,
        )
        db.add(extra_admin)
        db.commit()
        db.refresh(extra_admin)
        extra_site = Site(
            organization_id=extra_org.id, name=f"{extra_org.name} HQ Site",
            address="Sample Address", lat=31.5, lng=74.3,
            geofence_radius_m=150, required_staff_count=1, is_active=True,
        )
        db.add(extra_site)
        db.commit()
    print("Seeded minimal isolation-test data for the 2 extra organizations.")

    # ================= Users (220 in main org) =================
    admin = User(
        organization_id=org.id, name="Ibrahim Admin", email="admin@sos.com",
        phone="03001110001", hashed_password=hash_password(SEED_PASSWORD),
        role=UserRole.ADMIN, is_active=True, created_at=now,
    )
    db.add(admin)

    supervisors = []
    for i in range(10):
        s = User(
            organization_id=org.id, name=f"{rand_name(i)} (Supervisor)",
            email=f"supervisor{i+1}@sos.com", phone=f"030011{i+2:04d}",
            hashed_password=hash_password(SEED_PASSWORD), role=UserRole.SUPERVISOR,
            is_active=True, created_at=now,
        )
        db.add(s)
        supervisors.append(s)

    staff_users = []
    for i in range(195):
        u = User(
            organization_id=org.id, name=rand_name(i),
            email=f"staff{i+1}@sos.com", phone=f"03002{i+1:06d}",
            hashed_password=hash_password(SEED_PASSWORD), role=UserRole.STAFF,
            is_active=random.random() > 0.03,  # a few inactive staff, realistic
            created_at=now - timedelta(days=random.randint(0, 400)),
        )
        db.add(u)
        staff_users.append(u)

    client_users = []
    for i in range(14):
        c = User(
            organization_id=org.id, name=f"Client Contact {i+1}",
            email=f"client{i+1}@sos.com", phone=f"03003{i+1:06d}",
            hashed_password=hash_password(SEED_PASSWORD), role=UserRole.CLIENT,
            is_active=True, created_at=now,
        )
        db.add(c)
        client_users.append(c)

    db.commit()
    for u in [admin] + supervisors + staff_users + client_users:
        db.refresh(u)
    total_users = 1 + len(supervisors) + len(staff_users) + len(client_users)
    print(f"Created {total_users} users (1 admin, {len(supervisors)} supervisors, "
          f"{len(staff_users)} staff, {len(client_users)} clients)")

    # ================= Staff Profiles (195) =================
    cert_names = ["Weapons License", "First Aid", "Security Guard License", None, "CPR Certified", "Fire Safety Cert"]
    for i, u in enumerate(staff_users):
        cert = cert_names[i % len(cert_names)]
        profile = StaffProfile(
            user_id=u.id,
            employee_code=f"EMP{1000 + i}",
            certification_name=cert,
            certification_expiry=(now + timedelta(days=random.choice([10, 30, 60, 90, 200, -5]))) if cert else None,
            hourly_rate=round(random.uniform(150, 450), 2),
            bank_account_number=f"PK{random.randint(10**10, 10**11 - 1)}",
        )
        db.add(profile)
    db.commit()
    print(f"Created {len(staff_users)} staff profiles")

    # ================= Sites (30) =================
    sites = []
    for i in range(30):
        city, area = CITY_SITES[i % len(CITY_SITES)]
        site_type = SITE_TYPE_NAMES[i % len(SITE_TYPE_NAMES)]
        base_lat = 24.0 + (i % 15) * 0.6
        base_lng = 67.0 + (i % 15) * 0.5
        site = Site(
            organization_id=org.id,
            name=f"{site_type} - {city}",
            address=f"{area}, {city}",
            lat=round(base_lat + random.uniform(-0.05, 0.05), 6),
            lng=round(base_lng + random.uniform(-0.05, 0.05), 6),
            geofence_radius_m=random.choice([100, 150, 200, 250]),
            required_staff_count=random.choice([1, 2, 3, 4]),
            supervisor_id=supervisors[i % len(supervisors)].id if i < 24 else None,  # some unassigned
            is_active=True,
        )
        db.add(site)
        sites.append(site)
    db.commit()
    for s in sites:
        db.refresh(s)
    print(f"Created {len(sites)} sites")

    # ================= Shift Templates (210, 7 per site) =================
    templates = []
    day_patterns = ["MON,WED,FRI", "TUE,THU,SAT", "MON,TUE,WED,THU,FRI", "SAT,SUN", "MON,TUE,THU,FRI,SAT"]
    for site_idx, site in enumerate(sites):
        for t in range(7):
            is_day = t % 2 == 0
            tmpl = ShiftTemplate(
                organization_id=org.id, site_id=site.id,
                name=f"{'Day' if is_day else 'Night'} Shift {t+1} - {site.name}",
                start_time_of_day=time(9, 0) if is_day else time(21, 0),
                end_time_of_day=time(17, 0) if is_day else time(5, 0),
                required_count=random.choice([1, 2]),
                days_of_week=day_patterns[t % len(day_patterns)],
                start_date=date.today() - timedelta(days=60),
                end_date=date.today() + timedelta(days=120),
                is_active=random.random() > 0.05,
            )
            db.add(tmpl)
            templates.append(tmpl)
    db.commit()
    for t in templates:
        db.refresh(t)
    print(f"Created {len(templates)} shift templates")

    # ================= Shifts =================
    # Part A: 6 months of daily history per site (kept exactly as before, for ML training)
    site_weekday_bias = {}
    for site in sites:
        weekend_heavy = random.choice([True, False])
        base = [random.choice([1, 2]) for _ in range(7)]
        if weekend_heavy:
            base[5] += 1
            base[6] += 1
        site_weekday_bias[site.id] = base

    history_days = 180
    historical_count = 0
    for site in sites:
        for day_offset in range(history_days, 0, -1):
            shift_date = now - timedelta(days=day_offset)
            weekday = shift_date.weekday()
            base_count = site_weekday_bias[site.id][weekday]
            noise = random.choice([-1, 0, 0, 0, 1])
            required = max(1, base_count + noise)

            start_time = shift_date.replace(hour=9, minute=0, second=0, microsecond=0)
            end_time = start_time + timedelta(hours=8)
            shift = Shift(
                organization_id=org.id, site_id=site.id,
                start_time=start_time, end_time=end_time,
                required_count=required,
                is_recurring=False, recurrence_rule=None, created_at=shift_date,
            )
            db.add(shift)
            historical_count += 1
    db.commit()
    print(f"Created {historical_count} historical shifts (6 months, for ML training)")

    # Part B: 210 near-term shifts for app testing (assignments/attendance/incidents attach to these)
    near_term_shifts = []
    for i in range(210):
        site = sites[i % len(sites)]
        start_offset_days = (i % 20) - 10  # spread across -10 to +9 days from now
        start_time = (now + timedelta(days=start_offset_days)).replace(hour=9, minute=0, second=0, microsecond=0)
        end_time = start_time + timedelta(hours=8)
        shift = Shift(
            organization_id=org.id, site_id=site.id,
            start_time=start_time, end_time=end_time,
            required_count=random.choice([1, 2, 3]),
            is_recurring=False, recurrence_rule=None, created_at=now,
        )
        db.add(shift)
        near_term_shifts.append(shift)
    db.commit()
    for sh in near_term_shifts:
        db.refresh(sh)
    print(f"Created {len(near_term_shifts)} near-term shifts (app testing)")

    shifts = near_term_shifts

    # ================= Shift Assignments (210) =================
    assignments = []
    for i in range(210):
        shift = shifts[i]
        staff = staff_users[i % len(staff_users)]
        assignment = ShiftAssignment(
            shift_id=shift.id, user_id=staff.id,
            status=random.choice([AssignmentStatus.ASSIGNED] * 9 + [AssignmentStatus.CANCELLED]),
            assigned_at=now - timedelta(days=random.randint(0, 15)),
        )
        db.add(assignment)
        assignments.append(assignment)
    db.commit()
    for a in assignments:
        db.refresh(a)
    print(f"Created {len(assignments)} shift assignments")

    # ================= Attendance (210) =================
    # Only shifts in the past have meaningful check-in/out; future ones get partial/no attendance.
    attendances = []
    for i, assignment in enumerate(assignments):
        shift = shifts[i]
        is_past = shift.start_time < now

        if is_past and assignment.status == AssignmentStatus.ASSIGNED:
            check_in = shift.start_time + timedelta(minutes=random.choice([0, 3, 8, 20, 35]))
            checked_out = random.random() > 0.15
            minutes_late = (check_in - shift.start_time).total_seconds() / 60
            status = AttendanceStatus.LATE if minutes_late > 15 else AttendanceStatus.ON_TIME

            check_out = None
            total_hours = None
            if checked_out:
                check_out = shift.end_time - timedelta(minutes=random.choice([0, 10, 30]))
                total_hours = round((check_out - check_in).total_seconds() / 3600, 2)
                if check_out < shift.end_time - timedelta(minutes=20):
                    status = AttendanceStatus.LEFT_EARLY

            att = Attendance(
                shift_assignment_id=assignment.id,
                check_in_time=check_in,
                check_in_lat=round(24.0 + random.uniform(-0.05, 0.05), 6),
                check_in_lng=round(67.0 + random.uniform(-0.05, 0.05), 6),
                check_in_within_geofence=True,
                face_match_score=round(random.uniform(0.55, 0.95), 2),
                face_match_passed=True,
                check_out_time=check_out,
                check_out_lat=round(24.0 + random.uniform(-0.05, 0.05), 6) if check_out else None,
                check_out_lng=round(67.0 + random.uniform(-0.05, 0.05), 6) if check_out else None,
                status=status,
                total_hours=total_hours,
            )
        else:
            att = Attendance(shift_assignment_id=assignment.id, check_in_time=None, status=None)

        db.add(att)
        attendances.append(att)
    db.commit()
    print(f"Created {len(attendances)} attendance records")

    # ================= Incident Reports (210) =================
    incident_types = list(IncidentType)
    severities = list(IncidentSeverity)
    statuses = [IncidentStatus.PENDING, IncidentStatus.APPROVED, IncidentStatus.ESCALATED, IncidentStatus.REJECTED]
    descriptions = [
        "Unauthorized individual attempted to access restricted area.",
        "Suspicious activity observed near the perimeter fence.",
        "Equipment malfunction reported in the security checkpoint.",
        "Minor disturbance between two visitors, resolved on site.",
        "Vehicle without valid pass attempted entry.",
        "Broken CCTV camera identified during patrol.",
        "Unattended package found near the main entrance.",
        "Noise complaint from nearby residents during night shift.",
        "Fire alarm triggered accidentally, false alarm confirmed.",
        "Missing inventory reported by site manager.",
    ]
    for i in range(210):
        assignment = assignments[i % len(assignments)]
        severity = severities[i % len(severities)]
        sla_hours = {"CRITICAL": 1, "HIGH": 4, "MEDIUM": 24, "LOW": 72}[severity.value]
        status = statuses[i % len(statuses)]
        incident = IncidentReport(
            shift_assignment_id=assignment.id,
            reported_by=assignment.user_id,
            type=incident_types[i % len(incident_types)],
            severity=severity,
            description=descriptions[i % len(descriptions)],
            lat=round(24.0 + random.uniform(-0.05, 0.05), 6),
            lng=round(67.0 + random.uniform(-0.05, 0.05), 6),
            status=status,
            sla_deadline=(now + timedelta(hours=sla_hours)) if status == IncidentStatus.PENDING else None,
            reviewed_by=admin.id if status != IncidentStatus.PENDING else None,
            created_at=now - timedelta(days=random.randint(0, 45), hours=random.randint(0, 23)),
        )
        db.add(incident)
    db.commit()
    print("Created 210 incident reports")

    # ================= Swap Requests (210) =================
    swap_statuses = [SwapStatus.PENDING, SwapStatus.APPROVED, SwapStatus.REJECTED]
    reasons = ["Family emergency", "Medical appointment", "Personal reason", "Schedule conflict", "Illness"]
    for i in range(210):
        assignment = assignments[i % len(assignments)]
        replacement = staff_users[(i + 7) % len(staff_users)]
        status = swap_statuses[i % len(swap_statuses)]
        swap = SwapRequest(
            shift_assignment_id=assignment.id,
            requested_by=assignment.user_id,
            proposed_replacement_id=replacement.id,
            reason=reasons[i % len(reasons)],
            status=status,
            reviewed_by=admin.id if status != SwapStatus.PENDING else None,
            created_at=now - timedelta(days=random.randint(0, 30)),
        )
        db.add(swap)
    db.commit()
    print("Created 210 swap requests")

    # ================= Notifications (210) =================
    all_recipients = [admin] + supervisors + staff_users
    notif_templates = [
        ("Upcoming Shift", "You have a shift starting soon."),
        ("Swap Request Update", "Your swap request was reviewed."),
        ("Certification Expiring Soon", "Your certification expires soon."),
        ("Incident SLA Breached", "An incident was auto-escalated."),
        ("Document Expiring Soon", "Your document expires soon."),
        ("Shift Assignment", "You have been assigned to a new shift."),
        ("Attendance Flagged", "Your recent check-in was flagged as late."),
    ]
    for i in range(210):
        title, message = notif_templates[i % len(notif_templates)]
        notif = Notification(
            user_id=all_recipients[i % len(all_recipients)].id,
            title=title, message=message,
            is_read=random.random() > 0.4,
            created_at=now - timedelta(hours=random.randint(0, 500)),
        )
        db.add(notif)
    db.commit()
    print("Created 210 notifications")

    # ================= Audit Logs (210) =================
    actions = ["CREATE", "UPDATE", "DELETE"]
    entity_types = ["Site", "Shift", "IncidentReport", "User"]
    for i in range(210):
        log = AuditLog(
            organization_id=org.id,
            user_id=admin.id,
            action=actions[i % len(actions)],
            entity_type=entity_types[i % len(entity_types)],
            entity_id=(i % 30) + 1,
            changes='{"before": {}, "after": {}}',
            created_at=now - timedelta(hours=random.randint(0, 800)),
        )
        db.add(log)
    db.commit()
    print("Created 210 audit logs")

# ================= Payroll Adjustments (210) =================
    for i in range(210):
        staff = staff_users[i % len(staff_users)]
        adj_type = AdjustmentType.BONUS if i % 3 != 0 else AdjustmentType.DEDUCTION
        # Keep deductions modest and bonuses a bit more generous, so net pay stays realistic
        # relative to typical hourly-rate * shift-length earnings (roughly 1500-4000 PKR per shift).
        amount = round(random.uniform(100, 800), 2) if adj_type == AdjustmentType.DEDUCTION else round(random.uniform(200, 1500), 2)
        adj = PayrollAdjustment(
            organization_id=org.id, user_id=staff.id, type=adj_type,
            label="Performance bonus" if adj_type == AdjustmentType.BONUS else "Late penalty",
            amount=amount,
            period_start=now - timedelta(days=30), period_end=now,
            created_by=admin.id, created_at=now - timedelta(days=random.randint(0, 30)),
        )
        db.add(adj)
    db.commit()
    print("Created 210 payroll adjustments")

    # ================= Invoices (210) =================
    invoice_statuses = [InvoiceStatus.DRAFT, InvoiceStatus.SENT, InvoiceStatus.PAID]
    for i in range(210):
        site = sites[i % len(sites)]
        contracted = random.choice([160, 200, 240, 280])
        actual = max(0, contracted + random.randint(-15, 25))
        rate = round(random.uniform(150, 320), 2)
        inv = Invoice(
            organization_id=org.id, site_id=site.id,
            period_start=now - timedelta(days=random.choice([30, 60, 90])),
            period_end=now - timedelta(days=random.choice([0, 15, 30])),
            contracted_hours=contracted, actual_hours=actual, rate_per_hour=rate,
            currency="PKR", total_amount=round(actual * rate, 2),
            status=invoice_statuses[i % len(invoice_statuses)],
            created_at=now - timedelta(days=random.randint(0, 60)),
        )
        db.add(inv)
    db.commit()
    print("Created 210 invoices")

    # ================= Staff Documents (210) =================
    doc_types = list(DocumentType)
    for i in range(210):
        staff = staff_users[i % len(staff_users)]
        doc = StaffDocument(
            user_id=staff.id,
            document_type=doc_types[i % len(doc_types)],
            file_url=f"uploads/documents/seed_placeholder_{i+1}.pdf",
            expiry_date=(now + timedelta(days=random.choice([5, 15, 30, 60, 90, -3]))) if i % 4 != 0 else None,
            uploaded_at=now - timedelta(days=random.randint(0, 120)),
        )
        db.add(doc)
    db.commit()
    print("Created 210 staff documents")

    # ================= Client Site Access (210) =================
    for i in range(210):
        client = client_users[i % len(client_users)]
        site = sites[i % len(sites)]
        # avoid duplicate (client, site) pairs by only adding if this exact combo index is new
        access = ClientSiteAccess(user_id=client.id, site_id=site.id, granted_at=now - timedelta(days=random.randint(0, 90)))
        db.add(access)
    db.commit()
    print("Created 210 client-site access records")

    print("\nSeeding complete!")
    print(f"All seeded users share the password: {SEED_PASSWORD}")
    print("Main org login examples: admin@sos.com, supervisor1@sos.com, staff1@sos.com, client1@sos.com")
    print(f"Isolation-test orgs: admin@guardian.com, admin@falcon.com (same password)")


if __name__ == "__main__":
    with Session(engine) as db:
        wipe_all(db)
        seed(db)