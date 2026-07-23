import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import {
  Building2, CalendarClock, AlertTriangle, Users, Wallet, FileWarning,
  ClipboardCheck, ShieldAlert, Clock, UserCircle, ArrowLeftRight
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

import StatCard from '../features/dashboard/widgets/StatCard';
import { useGetSitesQuery } from '../features/sites/sitesApi';
import { useGetShiftsQuery } from '../features/shifts/shiftsApi';
import { useGetUsersQuery } from '../features/users/usersApi';
import { useGetAllIncidentsQuery, useGetMyReportsQuery } from '../features/incidents/incidentsApi';
import { useGetMyShiftsQuery } from '../features/assignments/assignmentsApi';
import { useGetMyAttendanceQuery } from '../features/attendance/attendanceApi';
import { useGetMySwapsQuery } from '../features/swaps/swapsApi';
import { useGetMyProfileQuery } from '../features/profile/profileApi';
import {
  useGetAttendanceTrendQuery, useGetIncidentHeatmapQuery, useGetStaffHoursQuery,
  useGetForecastQuery, useGetMlForecastQuery,
} from '../features/dashboard/dashboardApi';
import ClientDashboardPage from '../features/client/ClientDashboardPage';
import { formatDateTime } from '../utils/dateHelpers';

// Global Corporate Design Tokens
const theme = {
  bg: '#ffffff',
  cardBg: '#f8fafc',
  border: '#e2e8f0',
  textMain: '#0f172a',
  textMuted: '#64748b',
  primary: '#0f172a',
  primaryLight: '#f1f5f9',
  accentBlue: '#2563eb',
  accentGreen: '#16a34a',
  accentWarning: '#d97706',
  accentDanger: '#dc2626',
  accentPurple: '#7c3aed',
};

const SEVERITY_BADGE_STYLES = {
  LOW: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  MEDIUM: { bg: '#fef9c3', color: '#854d0e', border: '#fef08a' },
  HIGH: { bg: '#ffedd5', color: '#c2410c', border: '#fed7aa' },
  CRITICAL: { bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
};

const STATUS_BADGE_STYLES = {
  PENDING: { bg: '#fef9c3', color: '#854d0e', border: '#fef08a' },
  APPROVED: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  ESCALATED: { bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
  REJECTED: { bg: '#f3f4f6', color: '#4b5563', border: '#e5e7eb' },
  ASSIGNED: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  CANCELLED: { bg: '#f3f4f6', color: '#4b5563', border: '#e5e7eb' },
  SWAPPED: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  SWAP_REQUESTED: { bg: '#fef9c3', color: '#854d0e', border: '#fef08a' },
};

const POLL_MS = 20000;

function LiveBadge() {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: '#f0fdf4',
        border: '1px solid #bbf7d0',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        color: '#16a34a',
        marginBottom: '20px',
      }}
    >
      <span className="live-dot" />
      <span>Live dashboard</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const style = STATUS_BADGE_STYLES[status] || { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: '700',
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        textTransform: 'uppercase',
      }}
    >
      {status}
    </span>
  );
}

function SeverityBadge({ severity }) {
  const style = SEVERITY_BADGE_STYLES[severity] || { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: '700',
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        textTransform: 'uppercase',
      }}
    >
      {severity}
    </span>
  );
}

export default function DashboardPage() {
  const { user } = useSelector((state) => state.auth);

  if (user?.role === 'CLIENT') return <ClientDashboardPage />;

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '24px 16px 40px 16px',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        color: theme.textMain,
        boxSizing: 'border-box',
      }}
    >
      {/* Scoped Dynamic Styles */}
      <style>{`
        @keyframes pulseDot {
          0% { transform: scale(0.95); opacity: 1; }
          50% { transform: scale(1.25); opacity: 0.5; }
          100% { transform: scale(0.95); opacity: 1; }
        }
        .live-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: ${theme.accentGreen};
          animation: pulseDot 1.8s infinite ease-in-out;
        }
        .dash-card {
          background-color: #ffffff;
          border: 1px solid ${theme.border};
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .dash-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 4px 12px rgba(0,0,0,0.04);
        }
        .dash-list-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid ${theme.border};
        }
        .dash-list-item:last-child {
          border-bottom: none;
        }
        .quick-action-link {
          display: flex;
          align-items: center;
          padding: 10px 14px;
          border-radius: 6px;
          background-color: ${theme.cardBg};
          border: 1px solid ${theme.border};
          color: ${theme.textMain};
          font-weight: 600;
          font-size: 13.5px;
          text-decoration: none;
          transition: all 0.15s ease;
        }
        .quick-action-link:hover {
          background-color: ${theme.primaryLight};
          border-color: ${theme.primary};
          color: ${theme.primary};
        }
      `}</style>

      {/* Header Bar */}
      <div style={{ marginBottom: '8px' }}>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: '700',
            color: theme.textMain,
            margin: 0,
            letterSpacing: '-0.5px',
          }}
        >
          Welcome back, {user?.name}
        </h1>
        <p style={{ color: theme.textMuted, marginTop: '4px', marginBottom: '12px', fontSize: '14.5px' }}>
          Here's what's happening across your operations today.
        </p>
        <LiveBadge />
      </div>

      {(user?.role === 'ADMIN' || user?.role === 'SUPERVISOR') && <OpsDashboard role={user.role} />}
      {user?.role === 'STAFF' && <StaffDashboard />}
    </div>
  );
}

/* ============ ADMIN / SUPERVISOR ============ */
function OpsDashboard({ role }) {
  const isAdmin = role === 'ADMIN';
  const isSupervisor = role === 'SUPERVISOR';

  const { data: sites } = useGetSitesQuery(undefined, { pollingInterval: POLL_MS });
  const { data: shiftsData } = useGetShiftsQuery({ pageSize: 200 }, { pollingInterval: POLL_MS });
  const shifts = shiftsData?.items;
  const { data: users } = useGetUsersQuery();
  const { data: incidents } = useGetAllIncidentsQuery(undefined, { pollingInterval: POLL_MS });
  const { data: trend } = useGetAttendanceTrendQuery(30, { pollingInterval: POLL_MS });
  const { data: heatmap } = useGetIncidentHeatmapQuery(undefined, { pollingInterval: POLL_MS });
  const { data: staffHours } = useGetStaffHoursQuery(30, { pollingInterval: POLL_MS });

  const [forecastSiteId, setForecastSiteId] = useState('');
  const { data: forecast } = useGetForecastQuery(forecastSiteId, { skip: !forecastSiteId || !isAdmin });
  const { data: mlForecast, error: mlForecastError } = useGetMlForecastQuery(forecastSiteId, { skip: !forecastSiteId || !isAdmin });

  const today = new Date().toDateString();
  const shiftsToday = shifts?.filter((s) => new Date(s.start_time).toDateString() === today).length || 0;
  const staffCount = users?.filter((u) => u.role === 'STAFF' && u.is_active).length || 0;
  const pendingIncidents = incidents?.filter((i) => i.status === 'PENDING').length || 0;
  const criticalOpen = incidents?.filter((i) => i.severity === 'CRITICAL' && i.status !== 'APPROVED' && i.status !== 'REJECTED').length || 0;

  const recentIncidents = [...(incidents || [])]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Stat Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
        }}
      >
        <StatCard icon={Building2} label={isSupervisor ? 'My Sites' : 'Active Sites'} value={sites?.length || 0} color={theme.accentBlue} />
        <StatCard icon={Users} label="Active Staff" value={staffCount} color="#0891b2" />
        <StatCard icon={CalendarClock} label="Shifts Today" value={shiftsToday} color={theme.accentPurple} />
        <StatCard icon={AlertTriangle} label="Pending Incidents" value={pendingIncidents} color={theme.accentWarning} />
        <StatCard icon={ShieldAlert} label="Critical Open" value={criticalOpen} color={theme.accentDanger} />
      </div>

      {/* Supervisor Assigned Sites Block */}
      {isSupervisor && (
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 12px 0', color: theme.textMain }}>My Sites</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {sites?.length ? (
              sites.map((s) => (
                <div className="dash-card" key={s.id}>
                  <div style={{ fontWeight: '700', fontSize: '15px', color: theme.textMain }}>{s.name}</div>
                  <div style={{ fontSize: '13px', color: theme.textMuted, marginTop: '4px' }}>{s.address}</div>
                  <div style={{ fontSize: '12px', marginTop: '12px', color: theme.textMain, paddingTop: '10px', borderTop: `1px solid ${theme.border}` }}>
                    Required staff: <strong>{s.required_staff_count}</strong> &middot; Geofence: <strong>{s.geofence_radius_m}m</strong>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: theme.textMuted, margin: 0, fontSize: '14px' }}>No sites assigned to you yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Main Dashboard Layout Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Left Column Analytics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Attendance Trend */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 10px 0', color: theme.textMain }}>
              Attendance Trend (30 Days)
            </h3>
            <div className="dash-card">
              {trend?.length ? (
                <ResponsiveContainer width="100%" height={220} debounce={100}>
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: theme.textMuted }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: theme.textMuted }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: `1px solid ${theme.border}` }} />
                    <Line type="monotone" dataKey="on_time" stroke={theme.accentGreen} strokeWidth={2} dot={false} name="On Time" />
                    <Line type="monotone" dataKey="late" stroke={theme.accentWarning} strokeWidth={2} dot={false} name="Late" />
                    <Line type="monotone" dataKey="absent" stroke={theme.accentDanger} strokeWidth={2} dot={false} name="Absent" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ color: theme.textMuted, margin: 0, fontSize: '13.5px' }}>
                  Staff on-time vs late vs absent check-ins, day by day. No data yet.
                </p>
              )}
            </div>
          </div>

          {/* Incidents Heatmap */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 10px 0', color: theme.textMain }}>
              Incidents by Site (Severity)
            </h3>
            <div className="dash-card">
              {heatmap?.length ? (
                <ResponsiveContainer width="100%" height={220} debounce={100}>
                  <BarChart data={heatmap.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="site_name" tick={{ fontSize: 10, fill: theme.textMuted }} interval={0} angle={-15} textAnchor="end" height={55} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: theme.textMuted }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: `1px solid ${theme.border}` }} />
                    <Bar dataKey="low" stackId="a" fill={theme.accentGreen} name="Low" />
                    <Bar dataKey="medium" stackId="a" fill={theme.accentWarning} name="Medium" />
                    <Bar dataKey="high" stackId="a" fill="#ea580c" name="High" />
                    <Bar dataKey="critical" stackId="a" fill={theme.accentDanger} name="Critical" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ color: theme.textMuted, margin: 0, fontSize: '13.5px' }}>
                  How many incidents happened at each site, colored by severity. No data yet.
                </p>
              )}
            </div>
          </div>

          {/* Staff Hours */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 10px 0', color: theme.textMain }}>
              Staff Hours (30 Days)
            </h3>
            <div className="dash-card">
              {staffHours?.length ? (
                <ResponsiveContainer width="100%" height={220} debounce={100}>
                  <BarChart data={staffHours.slice(0, 15)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: theme.textMuted }} interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: theme.textMuted }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: `1px solid ${theme.border}` }} />
                    <Bar dataKey="total_hours" fill={theme.primary} radius={[4, 4, 0, 0]} name="Hours Worked" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ color: theme.textMuted, margin: 0, fontSize: '13.5px' }}>
                  Total hours worked per staff member. No data yet.
                </p>
              )}
            </div>
          </div>

          {/* Admin ML Forecast */}
          {isAdmin && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 10px 0', color: theme.textMain }}>
                Next Week Staffing Forecast
              </h3>
              <div className="dash-card">
                <p style={{ fontSize: '13px', color: theme.textMuted, marginTop: 0, marginBottom: '14px' }}>
                  Pick a site to see predicted staffing needs for the next 7 days — both a trained ML model and a simple baseline for comparison.
                </p>

                <div style={{ marginBottom: '16px' }}>
                  <select
                    value={forecastSiteId}
                    onChange={(e) => setForecastSiteId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${theme.border}`,
                      fontSize: '13.5px',
                      color: theme.textMain,
                      backgroundColor: '#ffffff',
                      outline: 'none',
                    }}
                  >
                    <option value="">Select site</option>
                    {sites?.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {forecastSiteId && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 8px 0', color: theme.textMain }}>
                        ML Model Prediction (Gradient Boosting)
                      </h4>
                      {mlForecastError ? (
                        <p style={{ color: theme.accentDanger, fontSize: '13px', margin: 0 }}>
                          {mlForecastError.data?.detail || 'Model not available. Run train_demand_model.py in the backend.'}
                        </p>
                      ) : mlForecast?.length ? (
                        <ResponsiveContainer width="100%" height={200} debounce={100}>
                          <BarChart data={mlForecast}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="day" tick={{ fontSize: 10, fill: theme.textMuted }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: theme.textMuted }} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: `1px solid ${theme.border}` }} />
                            <Bar dataKey="predicted_demand" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="ML Predicted Staff" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p style={{ color: theme.textMuted, fontSize: '13px', margin: 0 }}>Loading forecast...</p>
                      )}
                    </div>

                    <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: '16px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 8px 0', color: theme.textMain }}>
                        Moving Average Baseline
                      </h4>
                      {forecast?.length ? (
                        <ResponsiveContainer width="100%" height={200} debounce={100}>
                          <BarChart data={forecast}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="day" tick={{ fontSize: 10, fill: theme.textMuted }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: theme.textMuted }} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: `1px solid ${theme.border}` }} />
                            <Bar dataKey="predicted_required_staff" fill={theme.accentBlue} radius={[4, 4, 0, 0]} name="Baseline Predicted Staff" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p style={{ color: theme.textMuted, fontSize: '13px', margin: 0 }}>Loading baseline...</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column Feed & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Recent Incidents Feed */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 10px 0', color: theme.textMain }}>
              Recent Incidents
            </h3>
            <div className="dash-card">
              {recentIncidents.length ? (
                recentIncidents.map((inc) => (
                  <div className="dash-list-item" key={inc.id}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '13.5px', color: theme.textMain }}>{inc.type}</div>
                      <div style={{ color: theme.textMuted, fontSize: '11.5px', marginTop: '2px' }}>{formatDateTime(inc.created_at)}</div>
                    </div>
                    <SeverityBadge severity={inc.severity} />
                  </div>
                ))
              ) : (
                <p style={{ color: theme.textMuted, margin: 0, fontSize: '13.5px' }}>No incidents reported yet.</p>
              )}
              <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: `1px solid ${theme.border}` }}>
                <Link to="/incidents" style={{ fontSize: '13px', fontWeight: '600', color: theme.accentBlue, textDecoration: 'none' }}>
                  Review all incidents →
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 10px 0', color: theme.textMain }}>
              Quick Actions
            </h3>
            <div className="dash-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {isAdmin && (
                <Link to="/sites" className="quick-action-link">
                  <Building2 size={16} style={{ marginRight: '10px', color: theme.textMuted }} />
                  Manage Sites
                </Link>
              )}
              <Link to="/shifts" className="quick-action-link">
                <CalendarClock size={16} style={{ marginRight: '10px', color: theme.textMuted }} />
                Manage Shifts
              </Link>
              <Link to="/swaps" className="quick-action-link">
                <ArrowLeftRight size={16} style={{ marginRight: '10px', color: theme.textMuted }} />
                Swap Requests
              </Link>
              {isAdmin && (
                <Link to="/payroll-adjustments" className="quick-action-link">
                  <Wallet size={16} style={{ marginRight: '10px', color: theme.textMuted }} />
                  Payroll Adjustments
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ STAFF ============ */
function StaffDashboard() {
  const { data: profile } = useGetMyProfileQuery();
  const { data: myShifts, isLoading: shiftsLoading } = useGetMyShiftsQuery(undefined, { pollingInterval: POLL_MS });
  const { data: myAttendance } = useGetMyAttendanceQuery(undefined, { pollingInterval: POLL_MS });
  const { data: myReports } = useGetMyReportsQuery(undefined, { pollingInterval: POLL_MS });
  const { data: mySwaps } = useGetMySwapsQuery(undefined, { pollingInterval: POLL_MS });

  const activeAssignments = (myShifts || []).filter((a) => a.status === 'ASSIGNED');
  const todayRecord = myAttendance?.find((a) => a.check_in_time && new Date(a.check_in_time).toDateString() === new Date().toDateString());
  const pendingReports = myReports?.filter((r) => r.status === 'PENDING').length || 0;

  const attendanceCounts = { ON_TIME: 0, LATE: 0, ABSENT: 0, LEFT_EARLY: 0 };
  (myAttendance || []).forEach((a) => { if (a.status && attendanceCounts[a.status] !== undefined) attendanceCounts[a.status]++; });
  const attendanceChartData = [
    { label: 'On Time', count: attendanceCounts.ON_TIME, fill: theme.accentGreen },
    { label: 'Late', count: attendanceCounts.LATE, fill: theme.accentWarning },
    { label: 'Left Early', count: attendanceCounts.LEFT_EARLY, fill: '#ea580c' },
    { label: 'Absent', count: attendanceCounts.ABSENT, fill: theme.accentDanger },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Stat Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
        }}
      >
        <StatCard icon={ClipboardCheck} label="Active Shifts" value={activeAssignments.length} color={theme.accentBlue} />
        <StatCard
          icon={Clock}
          label="Today's Status"
          value={todayRecord ? (todayRecord.check_out_time ? 'Checked Out' : 'Checked In') : 'Not Checked In'}
          color={todayRecord ? theme.accentGreen : theme.textMuted}
        />
        <StatCard icon={AlertTriangle} label="Pending Incident Reports" value={pendingReports} color={theme.accentWarning} />
        <StatCard icon={FileWarning} label="Total Reports Filed" value={myReports?.length || 0} color={theme.accentPurple} />
      </div>

      {/* Main Staff Dashboard Layout Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Left Column Profile & Overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Staff Profile Card */}
          <div className="dash-card" style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
            {profile?.profile_photo_url ? (
              <img
                src={`/${profile.profile_photo_url}`}
                alt="Me"
                style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${theme.border}` }}
              />
            ) : (
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: theme.primaryLight,
                  color: theme.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <UserCircle size={36} />
              </div>
            )}
            <div>
              <div style={{ fontWeight: '700', fontSize: '15px', color: theme.textMain }}>{profile?.employee_code || 'Employee code not set'}</div>
              <div style={{ fontSize: '13px', color: theme.textMuted, margin: '2px 0 6px 0' }}>{profile?.certification_name || 'No certification on file'}</div>
              <Link to="/profile" style={{ fontSize: '12.5px', fontWeight: '600', color: theme.accentBlue, textDecoration: 'none' }}>
                Update my profile →
              </Link>
            </div>
          </div>

          {/* Attendance Overview Chart */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 10px 0', color: theme.textMain }}>
              My Attendance Overview
            </h3>
            <div className="dash-card">
              <p style={{ fontSize: '13px', color: theme.textMuted, marginTop: 0, marginBottom: '14px' }}>
                How your check-ins have gone across all your shifts so far.
              </p>
              <ResponsiveContainer width="100%" height={200} debounce={100}>
                <BarChart data={attendanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: theme.textMuted }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: theme.textMuted }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: `1px solid ${theme.border}` }} />
                  <Bar dataKey="count" name="Count" radius={[4, 4, 0, 0]}>
                    {attendanceChartData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Shifts Assignment List */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 10px 0', color: theme.textMain }}>
              My Shifts
            </h3>
            <div className="dash-card">
              <p style={{ fontSize: '13px', color: theme.textMuted, marginTop: 0, marginBottom: '12px' }}>
                All shifts you've been assigned to, and their current status.
              </p>
              {shiftsLoading ? (
                <p style={{ color: theme.textMuted, margin: 0, fontSize: '13.5px' }}>Loading...</p>
              ) : myShifts?.length ? (
                myShifts.map((a) => (
                  <div className="dash-list-item" key={a.id}>
                    <div style={{ fontWeight: '600', fontSize: '13.5px', color: theme.textMain }}>
                      Assignment #{a.id} — <span style={{ color: theme.textMuted, fontWeight: 'normal' }}>Shift #{a.shift_id}</span>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                ))
              ) : (
                <p style={{ color: theme.textMuted, margin: 0, fontSize: '13.5px' }}>You have no shift assignments yet.</p>
              )}
              <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: `1px solid ${theme.border}` }}>
                <Link to="/my-shifts" style={{ fontSize: '13px', fontWeight: '600', color: theme.accentBlue, textDecoration: 'none' }}>
                  Go to check-in / check-out →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column Reports & Swaps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Incident Reports Feed */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 10px 0', color: theme.textMain }}>
              My Incident Reports
            </h3>
            <div className="dash-card">
              <p style={{ fontSize: '13px', color: theme.textMuted, marginTop: 0, marginBottom: '12px' }}>
                Status of incidents you've reported — pending ones are still awaiting review.
              </p>
              {myReports?.length ? (
                myReports.slice(0, 8).map((r) => (
                  <div className="dash-list-item" key={r.id}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '13.5px', color: theme.textMain }}>{r.type}</div>
                      <div style={{ color: theme.textMuted, fontSize: '11.5px', marginTop: '2px' }}>{formatDateTime(r.created_at)}</div>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                ))
              ) : (
                <p style={{ color: theme.textMuted, margin: 0, fontSize: '13.5px' }}>You haven't reported any incidents.</p>
              )}
              <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: `1px solid ${theme.border}` }}>
                <Link to="/incidents" style={{ fontSize: '13px', fontWeight: '600', color: theme.accentBlue, textDecoration: 'none' }}>
                  Report a new incident →
                </Link>
              </div>
            </div>
          </div>

          {/* Swap Requests Feed */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 10px 0', color: theme.textMain }}>
              My Swap Requests
            </h3>
            <div className="dash-card">
              <p style={{ fontSize: '13px', color: theme.textMuted, marginTop: 0, marginBottom: '12px' }}>
                Status of your requests to swap out of an assigned shift.
              </p>
              {mySwaps?.length ? (
                mySwaps.slice(0, 8).map((s) => (
                  <div className="dash-list-item" key={s.id}>
                    <div style={{ fontWeight: '600', fontSize: '13.5px', color: theme.textMain }}>
                      Assignment #{s.shift_assignment_id}
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                ))
              ) : (
                <p style={{ color: theme.textMuted, margin: 0, fontSize: '13.5px' }}>No swap requests yet.</p>
              )}
              <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: `1px solid ${theme.border}` }}>
                <Link to="/swaps" style={{ fontSize: '13px', fontWeight: '600', color: theme.accentBlue, textDecoration: 'none' }}>
                  Request a swap →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}