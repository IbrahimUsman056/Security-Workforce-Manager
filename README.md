# Security Workforce Manager

A full-stack, multi-tenant workforce management platform built for security companies to manage guards, sites, shifts, attendance, incidents, payroll, and client relationships — end to end.

Originally built as an internship project (starting from a MERN-based background), this version was deliberately built with **FastAPI + SQLModel** on the backend to deepen Python/backend skills, while keeping **React + Redux Toolkit** on the frontend.

**Live demo:** [security-workforce-manager-iota.vercel.app](https://security-workforce-manager-iota.vercel.app)
**API docs:** [security-workforce-manager-bju6.onrender.com/docs](https://security-workforce-manager-bju6.onrender.com/docs)

> Demo credentials: any seeded account, e.g. `admin@sos.com` / `security2468`

---

## Screenshots

<!-- Add screenshots here, e.g.: -->
<!-- ![Admin Dashboard](./docs/screenshots/admin-dashboard.png) -->
<img width="946" height="539" alt="image" src="https://github.com/user-attachments/assets/a8f51083-393e-4739-b72d-9ef31798acbb" />

<!-- ![Shift Management](./docs/screenshots/shifts.png) -->
<img width="946" height="539" alt="image" src="https://github.com/user-attachments/assets/1a51fc38-6288-4a6b-8892-eb282bcc9ff7" />

<!-- ![Face Verification Check-In](./docs/screenshots/checkin.png) -->
<img width="946" height="539" alt="image" src="https://github.com/user-attachments/assets/68b80136-d3e8-4414-b524-e1c23706612c" />


<img width="946" height="539" alt="image" src="https://github.com/user-attachments/assets/8538f373-cdf9-44e9-a303-6f81426473b5" />

<!-- ![Client Portal](./docs/screenshots/client-portal.png) -->
<img width="946" height="539" alt="image" src="https://github.com/user-attachments/assets/eda17541-474b-4a9a-bc3a-2ff5f8db66f9" />


<img width="946" height="539" alt="image" src="https://github.com/user-attachments/assets/ca3fb848-63be-452a-a424-c76a8d0626f7" />

*(Screenshots: Admin dashboard, Shift scheduling, Geofenced check-in with face verification, Incident reporting, Client portal, ML staffing forecast)*

---

## What It Does

Security companies deploying guards across multiple client sites need to answer three questions in real time: **who's scheduled where, did they actually show up, and what happened while they were there.** This platform handles that end to end, plus the operational layer around it — payroll, billing, compliance documents, and multi-tenant isolation so multiple security companies can use the same deployment without ever seeing each other's data.

### Core Features

- **Multi-tenancy** — each organization's data (staff, sites, shifts, records) is fully isolated at the database query level
- **Four distinct roles** — Admin (full org control), Supervisor (scoped to assigned sites), Staff (their own shifts/attendance), Client (read-only portal for their own site's coverage/incidents/invoices)
- **Geofenced attendance with face verification** — staff check in via mobile browser; the app validates GPS location against a site's geofence **and** runs on-device face recognition (face-api.js) comparing a live selfie to their profile photo — both checks are required, not optional, to mark attendance
- **Shift scheduling** — manual scheduling, recurring shift templates (auto-generates shifts on a rolling basis), and a greedy staff-suggestion optimizer that ranks eligible candidates by conflict-free availability and weekly hour balance
- **Incident reporting with SLA escalation** — severity-based response deadlines (Critical: 1hr, High: 4hr, Medium: 24hr, Low: 72hr), auto-escalated and staff/admins notified if a report goes unreviewed past deadline
- **Payroll & invoicing** — hourly-rate calculations, bonuses/deductions, PDF payslips, bank-transfer CSV export, and client invoicing based on contracted vs. actual hours worked
- **Document management** — staff upload CNIC/licenses/contracts with expiry tracking and automated renewal reminders
- **Client portal** — clients see live coverage status, incidents, and invoices for their own site(s) only, with zero visibility into internal staff operations
- **ML-based demand forecasting** — a trained Gradient Boosting Regressor predicts next-week staffing needs per site from historical shift data, benchmarked honestly against a moving-average baseline (~19% MAE improvement)
- **Audit logging** — every sensitive action (site/shift changes, user/role updates, incident status changes) is logged with before/after state
- **Live dashboards** — role-specific dashboards with real charts (attendance trends, incident heatmaps, staff hours, ML forecasts) instead of static summary pages

---

## Tech Stack

**Backend**
- FastAPI + SQLModel (async-ready ORM built on SQLAlchemy + Pydantic)
- MySQL / TiDB (MySQL-compatible distributed SQL, used in production)
- JWT authentication with role-based access control
- APScheduler for background jobs (SLA escalation, reminders, recurring shift generation, expiry checks)
- scikit-learn + NumPy for the demand forecasting model
- Cloudinary for persistent file storage (profile photos, selfies, incident photos, documents)
- ReportLab for PDF generation (payslips, invoices)

**Frontend**
- React (Vite) + Redux Toolkit + RTK Query
- Recharts for data visualization
- face-api.js for client-side face recognition
- Custom design system — corporate/enterprise theme, collapsible sidebar navigation

**Infrastructure**
- Frontend: Vercel
- Backend: Render
- Database: TiDB Cloud
- File storage: Cloudinary

---

## Architecture Highlights

- **Multi-tenancy via shared schema** — every table scoped by `organization_id`, enforced at the query layer on every endpoint, not just at the UI level
- **Role-based data scoping** — Supervisors only ever see/manage sites where `Site.supervisor_id` matches them; this is enforced server-side, not hidden by frontend routing alone
- **N+1 query prevention** — list endpoints (e.g. shifts with 1000+ rows) use bulk aggregate queries and pagination instead of per-row lookups
- **Honest ML** — the forecasting model is evaluated against a naive baseline and the comparison is shown transparently in the UI, rather than presenting predictions as more authoritative than they are

---

## Project Structure
<img width="165" height="251" alt="image" src="https://github.com/user-attachments/assets/44d916a0-ba6b-445e-b9ea-f14962ac8798" />


<img width="152" height="221" alt="image" src="https://github.com/user-attachments/assets/233465bc-c2f1-4844-bc66-409a3ef4d591" />


---

## Running Locally

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
cp .env.example .env           # fill in your own DB/Cloudinary/secret values
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## What I'd Build Next

- Celery + Redis to replace APScheduler for more robust distributed background jobs
- WebSockets for real-time notifications instead of polling
- PWA support for installable, offline-capable mobile access
- Docker Compose for one-command local environment setup

---

## License

This project was built as a personal learning/portfolio project. Feel free to explore the code for reference.
