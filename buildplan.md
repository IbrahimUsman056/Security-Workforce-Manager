# Security Workforce Manager — Full Build Plan (FastAPI + SQLModel)

## 1. Tech Stack

- **Backend**: FastAPI, SQLModel (async), Alembic, MySQL
- **Auth**: JWT via `python-jose` + `passlib[bcrypt]`
- **Background jobs**: APScheduler (lighter than Celery+Redis for a solo project — good enough for reminders/expiry checks)
- **Validation**: Pydantic (built into SQLModel)
- **Frontend**: React (Vite) + Redux Toolkit + RTK Query — same as FMS/CTMP
- **File storage**: local `/uploads` folder for now (incident photos), swap to S3-compatible later if needed
- **Geolocation**: `geopy` for Haversine distance check

---

## 2. Folder Structure

```
shiftguard/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI app entrypoint
│   │   ├── config.py                  # env settings (pydantic BaseSettings)
│   │   ├── database.py                # engine, session, get_db dependency
│   │   │
│   │   ├── models/                    # SQLModel table models
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── site.py
│   │   │   ├── staff_profile.py
│   │   │   ├── shift.py
│   │   │   ├── shift_assignment.py
│   │   │   ├── attendance.py
│   │   │   ├── incident_report.py
│   │   │   ├── swap_request.py
│   │   │   └── notification.py
│   │   │
│   │   ├── schemas/                   # Pydantic request/response schemas
│   │   │   ├── user.py
│   │   │   ├── site.py
│   │   │   ├── shift.py
│   │   │   ├── attendance.py
│   │   │   ├── incident.py
│   │   │   └── auth.py
│   │   │
│   │   ├── routers/                   # API route handlers
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── sites.py
│   │   │   ├── shifts.py
│   │   │   ├── attendance.py
│   │   │   ├── incidents.py
│   │   │   ├── swaps.py
│   │   │   └── reports.py
│   │   │
│   │   ├── services/                  # business logic (kept out of routers)
│   │   │   ├── scheduling.py          # conflict detection, shift generation
│   │   │   ├── geofence.py            # distance validation
│   │   │   ├── payroll.py             # hours calc, overtime
│   │   │   └── notifications.py
│   │   │
│   │   ├── core/
│   │   │   ├── security.py            # JWT, password hashing
│   │   │   ├── deps.py                # role-based dependency guards
│   │   │   └── exceptions.py
│   │   │
│   │   ├── jobs/                      # APScheduler background tasks
│   │   │   ├── scheduler.py
│   │   │   ├── shift_reminders.py
│   │   │   └── cert_expiry_check.py
│   │   │
│   │   └── utils/
│   │       ├── file_upload.py
│   │       └── pagination.py
│   │
│   ├── alembic/
│   │   ├── versions/
│   │   └── env.py
│   ├── alembic.ini
│   ├── requirements.txt
│   ├── .env
│   └── tests/
│       ├── test_auth.py
│       ├── test_scheduling.py
│       └── test_attendance.py
│
├── frontend/                          # React + Vite (same structure as FMS)
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── sites/
│   │   │   ├── shifts/
│   │   │   ├── attendance/
│   │   │   ├── incidents/
│   │   │   └── swaps/
│   │   ├── app/store.js
│   │   └── ...
│   └── ...
│
└── README.md
```

---

## 3. Database Schema (SQLModel)

```python
# models/user.py
from enum import Enum
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    SUPERVISOR = "SUPERVISOR"
    STAFF = "STAFF"

class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    email: str = Field(unique=True, index=True)
    phone: str | None = None
    hashed_password: str
    role: UserRole = Field(default=UserRole.STAFF)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    staff_profile: "StaffProfile" = Relationship(back_populates="user")
```

```python
# models/site.py
class Site(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    address: str
    lat: float
    lng: float
    geofence_radius_m: int = Field(default=150)   # meters
    required_staff_count: int = Field(default=1)
    supervisor_id: int | None = Field(default=None, foreign_key="user.id")
    is_active: bool = Field(default=True)
```

```python
# models/staff_profile.py
class CertificationStatus(str, Enum):
    VALID = "VALID"
    EXPIRING_SOON = "EXPIRING_SOON"
    EXPIRED = "EXPIRED"

class StaffProfile(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", unique=True)
    employee_code: str = Field(unique=True)
    certification_name: str | None = None
    certification_expiry: datetime | None = None
    hourly_rate: float | None = None

    user: User = Relationship(back_populates="staff_profile")
```

```python
# models/shift.py
class Shift(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    site_id: int = Field(foreign_key="site.id")
    start_time: datetime
    end_time: datetime
    required_count: int = Field(default=1)
    is_recurring: bool = Field(default=False)
    recurrence_rule: str | None = None   # e.g. "WEEKLY:MON,WED,FRI"
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

```python
# models/shift_assignment.py
class AssignmentStatus(str, Enum):
    ASSIGNED = "ASSIGNED"
    SWAP_REQUESTED = "SWAP_REQUESTED"
    SWAPPED = "SWAPPED"
    CANCELLED = "CANCELLED"

class ShiftAssignment(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    shift_id: int = Field(foreign_key="shift.id")
    user_id: int = Field(foreign_key="user.id")
    status: AssignmentStatus = Field(default=AssignmentStatus.ASSIGNED)
    assigned_at: datetime = Field(default_factory=datetime.utcnow)
```

```python
# models/attendance.py
class AttendanceStatus(str, Enum):
    ON_TIME = "ON_TIME"
    LATE = "LATE"
    ABSENT = "ABSENT"
    LEFT_EARLY = "LEFT_EARLY"

class Attendance(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    shift_assignment_id: int = Field(foreign_key="shiftassignment.id", unique=True)
    check_in_time: datetime | None = None
    check_in_lat: float | None = None
    check_in_lng: float | None = None
    check_in_within_geofence: bool | None = None
    check_out_time: datetime | None = None
    check_out_lat: float | None = None
    check_out_lng: float | None = None
    status: AttendanceStatus | None = None
    total_hours: float | None = None
```

```python
# models/incident_report.py
class IncidentType(str, Enum):
    THEFT = "THEFT"
    BREACH = "BREACH"
    DISTURBANCE = "DISTURBANCE"
    EQUIPMENT = "EQUIPMENT"
    OTHER = "OTHER"

class IncidentStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    ESCALATED = "ESCALATED"
    REJECTED = "REJECTED"

class IncidentReport(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    shift_assignment_id: int = Field(foreign_key="shiftassignment.id")
    reported_by: int = Field(foreign_key="user.id")
    type: IncidentType
    description: str
    photo_url: str | None = None
    lat: float | None = None
    lng: float | None = None
    status: IncidentStatus = Field(default=IncidentStatus.PENDING)
    reviewed_by: int | None = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

```python
# models/swap_request.py
class SwapStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class SwapRequest(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    shift_assignment_id: int = Field(foreign_key="shiftassignment.id")
    requested_by: int = Field(foreign_key="user.id")
    proposed_replacement_id: int | None = Field(default=None, foreign_key="user.id")
    reason: str | None = None
    status: SwapStatus = Field(default=SwapStatus.PENDING)
    reviewed_by: int | None = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

```python
# models/notification.py
class Notification(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    title: str
    message: str
    is_read: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

---

## 4. Key Service Logic (the interesting parts)

**`services/geofence.py`** — Haversine check on every check-in:
```python
from geopy.distance import geodesic

def is_within_geofence(site_lat, site_lng, user_lat, user_lng, radius_m) -> bool:
    distance = geodesic((site_lat, site_lng), (user_lat, user_lng)).meters
    return distance <= radius_m
```

**`services/scheduling.py`** — conflict detection before assigning:
```python
def has_conflict(db, user_id, new_start, new_end) -> bool:
    # query existing ShiftAssignments joined to Shift for this user
    # where time ranges overlap: existing.start < new_end AND existing.end > new_start
    ...
```

**`services/payroll.py`** — hours + overtime from Attendance records over a date range, grouped by user.

---

## 5. Phased Build Plan

### Phase 1 — Foundation (Week 1)
- Project scaffold, `.env` config, DB connection, Alembic init
- User model + JWT auth (register/login) + role-based `deps.py` guards (`require_role(["ADMIN"])`)
- Site CRUD (Admin only)
- StaffProfile CRUD, linked to User
- Basic React scaffold: login, protected routes by role, RTK Query base API slice

**Milestone**: Admin can log in, create sites, create staff accounts.

### Phase 2 — Scheduling (Week 2)
- Shift CRUD (create one-off or recurring shifts per site)
- ShiftAssignment endpoints (assign staff to shift)
- Conflict detection service wired into assignment creation
- Frontend: calendar/grid view of shifts per site and per staff member

**Milestone**: Admin builds a weekly schedule; staff sees their own upcoming shifts.

### Phase 3 — Attendance (Week 3)
- Check-in/check-out endpoints with lat/lng payload
- Geofence validation service, auto-set `ON_TIME/LATE/ABSENT`
- Auto-calculate `total_hours` on check-out
- Frontend: mobile-friendly check-in screen (browser geolocation API)
- Admin dashboard: today's attendance status across all sites

**Milestone**: Staff can check in from their phone; system validates location and flags lateness.

### Phase 4 — Incidents & Approval Workflow (Week 4)
- IncidentReport CRUD with photo upload (`utils/file_upload.py`)
- Status transitions: PENDING → APPROVED/ESCALATED/REJECTED (Supervisor/Admin only)
- Frontend: incident submission form (staff), review queue (supervisor)

**Milestone**: Full incident lifecycle from field report to admin resolution.

### Phase 5 — Swaps & Notifications (Week 5)
- SwapRequest CRUD + approval flow (updates ShiftAssignment on approval)
- Notification model + basic in-app notification list
- APScheduler jobs: shift reminder (T-1hr), cert expiry check (daily)

**Milestone**: Staff can request swaps; system proactively warns about expiring certifications.

### Phase 6 — Reports & Payroll (Week 6)
- `reports.py` router: hours worked per staff/site over date range, overtime flags
- CSV/PDF export (reuse your `reportlab` experience from the ShopAI PDF task)
- Admin analytics: incidents by site/type, attendance rate by site

**Milestone**: Admin exports a payroll-ready hours report and views incident analytics.

### Phase 7 — Polish (Week 7)
- Input validation edge cases, error handling consistency
- Pagination on list endpoints
- Basic test coverage (`pytest` + `httpx` async client) for auth, scheduling conflict logic, geofence
- Deploy: backend on Render/Railway, DB on PlanetScale/Railway MySQL, frontend on Vercel

---

## 6. requirements.txt (core)

```
fastapi
uvicorn[standard]
sqlmodel
alembic
pymysql
python-jose[cryptography]
passlib[bcrypt]
python-multipart
geopy
apscheduler
pydantic-settings
python-dotenv
```

---

# Security Workforce Manager v2 — Enterprise Scale-Up Build Plan

This extends your existing 7-phase MVP into a genuinely large-scale system. Same approach as before: I'll give you the full phase breakdown + schema now, then we build phase-by-phase with actual file-by-file code like we did for Phases 1–7.

---
/////////////////////
//BUILD PLAN # 2
/////////////////////


## Architecture decisions (the "why" before the "what")

| Concern | Choice | Why |
|---|---|---|
| Multi-tenancy | Shared DB, `organization_id` column on every table (not separate DBs per client) | Much simpler to build/maintain, still a legitimate enterprise pattern (this is literally how Slack, Notion, etc. work under the hood) |
| Background jobs | Replace APScheduler with **Celery + Redis** | APScheduler runs in-process and dies with your server; Celery gives you a real distributed task queue, retries, and scheduled tasks — this is what real companies use |
| Real-time updates | **WebSockets** (FastAPI native support) for notifications | Replaces polling, teaches you a genuinely different communication pattern |
| Mobile access | **PWA** (installable, offline-capable, push notifications) rather than a separate React Native app | One codebase, still installs on phones like an app, supports camera/geolocation/push — the right scope for this project instead of doubling your frontend work |
| Face verification | Client-side lightweight ML (`face-api.js`) or a cloud API (AWS Rekognition / Azure Face) — **your call per phase** | Avoids running heavy ML infra yourself |
| Containerization | **Docker Compose** — backend, frontend, MySQL, Redis, Celery worker all containerized | Genuinely valuable DevOps skill, makes local dev and deployment identical |
| Audit logging | Middleware-based, writes to its own table | Cheap to add, very real-world relevant for compliance-adjacent software |

---

## Phase 8 — Multi-Tenancy Foundation

This touches almost everything, so it goes first — easier to retrofit now than after more features pile on.

**New model:**
```python
class Organization(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    subdomain: str = Field(unique=True)  # e.g. "sos" -> sos.shiftguard.com later
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

**Changes to existing models:** add `organization_id: int = Field(foreign_key="organization.id")` to `User`, `Site`, `Shift`, and cascade naturally to everything else via those relationships (ShiftAssignment/Attendance/Incident don't need their own org_id — they inherit scope through Shift/User).

**Auth changes:**
- JWT payload includes `org_id` alongside `sub` and `role`
- New `get_current_org()` dependency that all routers use to scope every query (`WHERE organization_id = current_org.id`)
- Registration flow: either invite-only (admin invites staff into their org) or self-signup creates a new Organization + its first Admin

**New endpoints:**
- `POST /organizations/` — create org (public, becomes org's first admin)
- `GET /organizations/me` — current org details

---

## Phase 9 — Audit Logging

**New model:**
```python
class AuditLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    organization_id: int = Field(foreign_key="organization.id")
    user_id: Optional[int] = Field(foreign_key="user.id")
    action: str          # "CREATE", "UPDATE", "DELETE"
    entity_type: str      # "Shift", "Site", "IncidentReport", etc.
    entity_id: int
    changes: Optional[str] = None  # JSON string of before/after diff
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

**Implementation approach:** a reusable `log_action()` service function called explicitly inside mutating endpoints (simpler and more predictable than global middleware that tries to guess what changed).

**New endpoint:** `GET /audit-logs/` (admin only, filterable by entity_type/date range)

---

## Phase 10 — Smart Scheduling

**Recurrence engine** (`services/recurrence.py`):
- Parses `recurrence_rule` (e.g. `"WEEKLY:MON,WED,FRI:2026-07-01:2026-10-01"`)
- Celery beat task runs nightly, generates concrete `Shift` rows ~2 weeks ahead on a rolling basis (not all 3 months at once — avoids a giant orphaned batch if the rule changes later)

**New model:**
```python
class ShiftTemplate(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    organization_id: int = Field(foreign_key="organization.id")
    site_id: int = Field(foreign_key="site.id")
    name: str                    # "Night Guard Standard"
    start_time_of_day: time       # just the time, e.g. 21:00
    end_time_of_day: time
    required_count: int
    recurrence_rule: str
```

**Staff auto-suggest optimizer** (`services/optimizer.py`):
- Simple greedy scoring: for an open shift, rank eligible staff by (a) no time conflict, (b) certification still valid, (c) fewer total hours this week (load balancing), (d) distance from site if you store staff home coordinates
- Returns top N candidates — `GET /shifts/{id}/suggested-staff`

---

## Phase 11 — Richer Attendance Verification

**Model change:** add `selfie_url: Optional[str]` to `Attendance`

**Selfie capture:** frontend captures a photo via `<input type="file" accept="image/*" capture="user">` (mobile browsers open front camera directly) at check-in, uploaded alongside geolocation.

**Face comparison — pick one:**
- **Option A (simpler, free):** `face-api.js` running client-side in the browser — compares check-in selfie against a stored profile photo, returns a similarity score before even submitting to backend
- **Option B (more "real"):** AWS Rekognition `CompareFaces` API called server-side — costs a few cents per call but is genuinely production-grade and a strong resume line ("integrated AWS Rekognition for identity verification")

I'd recommend starting with Option A to keep it free while learning the concept, then optionally upgrading to B.

---

## Phase 12 — Incident Severity & SLA Escalation

**Model change:** add to `IncidentReport`:
```python
severity: IncidentSeverity  # LOW, MEDIUM, HIGH, CRITICAL
sla_deadline: datetime       # calculated at creation based on severity
```

**SLA rules example:** CRITICAL → 1hr review deadline, HIGH → 4hr, MEDIUM → 24hr, LOW → 72hr

**Celery beat task:** runs every 15 min, checks for incidents past their `sla_deadline` still `PENDING`, auto-escalates status and notifies admins.

---

## Phase 13 — Real Payroll & Billing

**New models:**
```python
class PayrollAdjustment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    type: str          # "BONUS", "DEDUCTION"
    label: str          # "Late penalty", "Performance bonus"
    amount: float
    period_start: datetime
    period_end: datetime

class Invoice(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    organization_id: int = Field(foreign_key="organization.id")
    site_id: int = Field(foreign_key="site.id")
    period_start: datetime
    period_end: datetime
    contracted_hours: float
    actual_hours: float
    rate_per_hour: float
    currency: str = Field(default="PKR")
    total_amount: float
    status: str  # DRAFT, SENT, PAID
```

**Payslip PDF:** reuse `reportlab` (same as your earlier ShopAI PDF experience) — generates per-staff payslip with base hours, overtime, bonuses/deductions, net total.

**Bank export CSV:** generic format (`employee_code, account_number, amount`) — genuinely how real payroll integrations work.

---

## Phase 14 — Document Management

**New model:**
```python
class StaffDocument(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    document_type: str   # "CNIC", "LICENSE", "CONTRACT"
    file_url: str
    expiry_date: Optional[datetime] = None
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
```

Reuses your existing file upload utility from Phase 4. Expiry checks piggyback on your existing `cert_expiry_check` Celery task pattern.

---

## Phase 15 — Client-Facing Portal

**New role:** `UserRole.CLIENT` — scoped to see only their own site(s), read-only.

**New model to link clients to sites:**
```python
class ClientSiteAccess(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")   # the client user
    site_id: int = Field(foreign_key="site.id")
```

**Client-visible endpoints (read-only, heavily filtered):**
- `GET /client/sites` — their site(s) only
- `GET /client/coverage` — shifts scheduled vs filled today
- `GET /client/incidents` — incidents at their site(s), maybe excluding internal notes
- `GET /client/invoices` — their billing history

This is a separate router (`routers/client_portal.py`) rather than reusing admin routers with extra filters — keeps permission logic simple and auditable.

---

## Phase 16 — Dashboards & Predictive Staffing

**Charting library:** Recharts (already available in your artifact environment, works great in real React apps too)

**Dashboard widgets:**
- Attendance trend line chart (on-time % over past 30 days)
- Incident heatmap by site (bar chart, color-coded by severity)
- Staff hours distribution (who's overworked/underworked)

**Predictive staffing** (`services/forecasting.py`):
- Simple moving average: for each site, average required_count over the past N weeks on the same weekday, suggest next week's staffing level
- Not real ML, but legitimately called a "forecasting model" — you can be honest about it being a moving-average baseline in your README, which is actually good practice (don't oversell it)

---

## Phase 17 — Architecture Upgrades

**Docker Compose** (`docker-compose.yml` at project root):
```yaml
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    depends_on: [mysql, redis]
  frontend:
    build: ./frontend
    ports: ["5173:5173"]
  celery_worker:
    build: ./backend
    command: celery -A app.celery_app worker --loglevel=info
    depends_on: [redis, mysql]
  celery_beat:
    build: ./backend
    command: celery -A app.celery_app beat --loglevel=info
    depends_on: [redis]
  mysql:
    image: mysql:8
    environment:
      MYSQL_DATABASE: shiftguard
    ports: ["3306:3306"]
  redis:
    image: redis:7
    ports: ["6379:6379"]
```

**Celery setup** (`backend/app/celery_app.py`) replaces `jobs/scheduler.py` — same job logic, moved into proper Celery tasks with `celery beat` handling the schedule instead of APScheduler.

**WebSockets** (`routers/ws_notifications.py`) — FastAPI's native `WebSocket` support, push new notifications instantly instead of the 30-second polling interval you have now.

**PWA conversion** (frontend):
- `vite-plugin-pwa` — adds a service worker, web manifest, offline caching
- Push notifications via the Web Push API (works on Android Chrome; iOS Safari support is more limited but improving)
- "Add to Home Screen" prompt — genuinely installs like an app

---

## Suggested build order

Given dependencies between phases, build in this order:

1. **Phase 8 (Multi-tenancy)** — foundational, touches everything else
2. **Phase 17 partial (Docker + Celery + Redis)** — do this early so every later phase's background jobs go straight into Celery instead of you writing APScheduler code you'll throw away
3. **Phase 9 (Audit log)** — quick win, no dependencies
4. **Phase 10 (Smart scheduling)**
5. **Phase 12 (Incident severity/SLA)**
6. **Phase 11 (Attendance verification)**
7. **Phase 13 (Payroll/billing)**
8. **Phase 14 (Documents)**
9. **Phase 15 (Client portal)**
10. **Phase 16 (Dashboards)**
11. **Phase 17 remainder (WebSockets + PWA)**

---

This is a genuinely large scope — realistically 2-3 months of solid part-time work, not a weekend project, which is exactly what "heavy project" should look like on a resume.