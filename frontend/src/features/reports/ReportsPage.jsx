import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  useGetPayrollReportQuery,
  useGetNetPayrollReportQuery,
  useGetIncidentsBySiteQuery,
  useGetAttendanceRateQuery,
} from './reportsApi';
import { Download, Filter, FileSpreadsheet, CheckCircle, Clock, AlertCircle, Search } from 'lucide-react';

function defaultDates() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export default function ReportsPage() {
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === 'ADMIN';

  const [{ start, end }, setDates] = useState(defaultDates());
  const [range, setRange] = useState({ startDate: start, endDate: `${end}T23:59:59` });

  // Local state for independent table searches
  const [netPayrollSearch, setNetPayrollSearch] = useState('');
  const [payrollSummarySearch, setPayrollSummarySearch] = useState('');
  const [incidentSearch, setIncidentSearch] = useState('');

  // Fetch financial report data only for Admin roles
  const { data: payroll, isLoading: payrollLoading } = useGetPayrollReportQuery(range, { skip: !isAdmin });
  const { data: netPayroll, isLoading: netPayrollLoading } = useGetNetPayrollReportQuery(range, { skip: !isAdmin });

  const { data: incidentStats, isLoading: incidentLoading } = useGetIncidentsBySiteQuery();
  const { data: attendanceRate, isLoading: attendanceLoading } = useGetAttendanceRateQuery(range);

  const handleFilter = (e) => {
    e.preventDefault();
    setRange({ startDate: start, endDate: `${end}T23:59:59` });
  };

  const downloadWithAuth = (url, filename) => {
    const token = localStorage.getItem('token');
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        link.click();
      });
  };

  const handleExportPayroll = () => {
    downloadWithAuth(
      `http://localhost:8000/reports/payroll/export?start_date=${range.startDate}&end_date=${range.endDate}`,
      'payroll_report.csv'
    );
  };

  const handleExportBank = () => {
    downloadWithAuth(
      `http://localhost:8000/reports/bank-export?start_date=${range.startDate}&end_date=${range.endDate}`,
      'bank_export.csv'
    );
  };

  const handleDownloadPayslip = (userId) => {
    downloadWithAuth(
      `http://localhost:8000/reports/payslip/${userId}/pdf?start_date=${range.startDate}&end_date=${range.endDate}`,
      `payslip_${userId}.pdf`
    );
  };

  // Filtered Lists for Tables
  const filteredNetPayroll = netPayroll?.filter((p) =>
    p.name?.toLowerCase().includes(netPayrollSearch.toLowerCase())
  );

  const filteredPayrollSummary = payroll?.filter((p) =>
    p.name?.toLowerCase().includes(payrollSummarySearch.toLowerCase())
  );

  const filteredIncidents = incidentStats?.filter((s) =>
    s.site_name?.toLowerCase().includes(incidentSearch.toLowerCase())
  );

  // Theme Design System
  const theme = {
    bg: '#ffffff',
    textMain: '#0f1729',
    textMuted: '#64748b',
    primary: '#991b1b',
    primaryHover: '#7f1d1d',
    border: '#e2e8f0',
    cardBg: '#f8fafc',
    scrollbarThumb: '#cbd5e1',
    scrollbarTrack: '#f1f5f9',
    success: '#16a34a',
    warning: '#d97706',
    danger: '#dc2626',
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px 16px',
        backgroundColor: theme.bg,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        color: theme.textMain,
        boxSizing: 'border-box',
      }}
    >
      <style>{`
        .scroll-7::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        .scroll-7::-webkit-scrollbar-track {
          background: ${theme.scrollbarTrack};
          border-radius: 4px;
        }
        .scroll-7::-webkit-scrollbar-thumb {
          background: ${theme.scrollbarThumb};
          border-radius: 4px;
        }
        .scroll-7::-webkit-scrollbar-thumb:hover {
          background: ${theme.primary};
        }
        .scroll-7 {
          max-height: 280px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: ${theme.scrollbarThumb} ${theme.scrollbarTrack};
        }

        .reports-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 13px;
        }
        .reports-table thead th {
          position: sticky;
          top: 0;
          z-index: 10;
          background-color: ${theme.textMain};
          color: #ffffff;
          padding: 10px 12px;
          font-weight: 600;
        }
        .reports-table tbody td {
          padding: 8px 12px;
          border-bottom: 1px solid ${theme.border};
        }
        .reports-table tbody tr:hover {
          background-color: #f1f5f9;
        }

        .filter-input {
          padding: 6px 10px;
          border-radius: 6px;
          border: 1px solid ${theme.border};
          font-size: 13px;
          outline: none;
          background-color: #ffffff;
        }
        .filter-input:focus {
          border-color: ${theme.primary};
        }

        .table-search-input {
          padding: 5px 10px 5px 28px;
          border-radius: 6px;
          border: 1px solid ${theme.border};
          font-size: 12px;
          outline: none;
          background-color: #ffffff;
          width: 160px;
          transition: width 0.2s ease, border-color 0.2s ease;
        }
        .table-search-input:focus {
          width: 200px;
          border-color: ${theme.primary};
        }
      `}</style>

      {/* Header section */}
      <div
        style={{
          marginBottom: '20px',
          borderBottom: `2px solid ${theme.primary}`,
          paddingBottom: '8px',
        }}
      >
        <h2
          style={{
            fontSize: '28px',
            fontWeight: '700',
            color: theme.textMain,
            margin: 0,
            letterSpacing: '-0.5px',
          }}
        >
          Reports & Analytics
        </h2>
        <p
          style={{
            margin: '4px 0 0 0',
            fontSize: '14px',
            color: theme.textMuted,
          }}
        >
          {isAdmin
            ? 'Track payroll details, incident trends, and workforce attendance rates'
            : 'View incident statistics and team attendance performance'}
        </p>
      </div>

      {/* Filter and Export Toolbar Card */}
      <div
        style={{
          backgroundColor: theme.cardBg,
          border: `1px solid ${theme.border}`,
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <form
          onSubmit={handleFilter}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '14px',
            alignItems: 'flex-end',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label
              htmlFor="report-start-date"
              style={{ fontSize: '12px', fontWeight: '600', color: theme.textMain }}
            >
              From Date
            </label>
            <input
              id="report-start-date"
              type="date"
              className="filter-input"
              value={start}
              onChange={(e) => setDates((d) => ({ ...d, start: e.target.value }))}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label
              htmlFor="report-end-date"
              style={{ fontSize: '12px', fontWeight: '600', color: theme.textMain }}
            >
              To Date
            </label>
            <input
              id="report-end-date"
              type="date"
              className="filter-input"
              value={end}
              onChange={(e) => setDates((d) => ({ ...d, end: e.target.value }))}
            />
          </div>

          <button
            type="submit"
            style={{
              height: '33px',
              padding: '0 16px',
              backgroundColor: theme.primary,
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.2s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = theme.primaryHover)}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = theme.primary)}
          >
            <Filter size={14} /> Filter Range
          </button>

          {isAdmin && (
            <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleExportPayroll}
                style={{
                  height: '33px',
                  padding: '0 14px',
                  backgroundColor: '#ffffff',
                  color: theme.textMain,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <FileSpreadsheet size={14} color={theme.success} /> Export Payroll CSV
              </button>

              <button
                type="button"
                onClick={handleExportBank}
                style={{
                  height: '33px',
                  padding: '0 14px',
                  backgroundColor: '#ffffff',
                  color: theme.textMain,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <FileSpreadsheet size={14} color={theme.primary} /> Export Bank CSV
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Admin Financial Reports */}
      {isAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
          {/* Net Payroll Table Card */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div
              style={{
                padding: '12px 18px',
                borderBottom: `1px solid ${theme.border}`,
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: theme.textMain }}>
                Net Payroll (With Bonuses & Deductions)
              </h3>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search
                  size={14}
                  style={{ position: 'absolute', left: '8px', color: theme.textMuted, pointerEvents: 'none' }}
                />
                <input
                  type="text"
                  placeholder="Search name..."
                  value={netPayrollSearch}
                  onChange={(e) => setNetPayrollSearch(e.target.value)}
                  className="table-search-input"
                />
              </div>
            </div>

            {netPayrollLoading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: theme.textMuted }}>
                Loading net payroll details...
              </div>
            ) : (
              <div className="scroll-7">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Hours</th>
                      <th>Rate</th>
                      <th>Base Pay</th>
                      <th>Bonus</th>
                      <th>Deduction</th>
                      <th>Net Pay</th>
                      <th style={{ textAlign: 'right' }}>Payslip</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredNetPayroll?.length ? (
                      filteredNetPayroll.map((p) => (
                        <tr key={p.user_id}>
                          <td style={{ fontWeight: '600' }}>{p.name}</td>
                          <td>{p.total_hours}</td>
                          <td>PKR {p.hourly_rate}</td>
                          <td>PKR {p.base_pay}</td>
                          <td style={{ color: theme.success }}>+PKR {p.bonus_total}</td>
                          <td style={{ color: theme.danger }}>-PKR {p.deduction_total}</td>
                          <td>
                            <strong>PKR {p.net_pay}</strong>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => handleDownloadPayslip(p.user_id)}
                              style={{
                                padding: '4px 10px',
                                backgroundColor: '#ffffff',
                                color: theme.textMain,
                                border: `1px solid ${theme.border}`,
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Download size={12} /> Download
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', color: theme.textMuted, padding: '20px' }}>
                          No matching payroll records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Payroll Summary Table Card */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div
              style={{
                padding: '12px 18px',
                borderBottom: `1px solid ${theme.border}`,
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: theme.textMain }}>
                Payroll Summary (Work Hours & Attendance Count)
              </h3>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search
                  size={14}
                  style={{ position: 'absolute', left: '8px', color: theme.textMuted, pointerEvents: 'none' }}
                />
                <input
                  type="text"
                  placeholder="Search name..."
                  value={payrollSummarySearch}
                  onChange={(e) => setPayrollSummarySearch(e.target.value)}
                  className="table-search-input"
                />
              </div>
            </div>

            {payrollLoading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: theme.textMuted }}>
                Loading payroll summary...
              </div>
            ) : (
              <div className="scroll-7">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Total Hours</th>
                      <th>Overtime</th>
                      <th>Shifts</th>
                      <th>Late</th>
                      <th>Absent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayrollSummary?.length ? (
                      filteredPayrollSummary.map((p) => (
                        <tr key={p.user_id}>
                          <td style={{ fontWeight: '600' }}>{p.name}</td>
                          <td>{p.total_hours} hrs</td>
                          <td style={{ color: p.overtime_hours > 0 ? theme.warning : theme.textMain }}>
                            {p.overtime_hours} hrs
                          </td>
                          <td>{p.shifts_worked}</td>
                          <td style={{ color: p.late_count > 0 ? theme.warning : theme.textMuted }}>
                            {p.late_count}
                          </td>
                          <td style={{ color: p.absent_count > 0 ? theme.danger : theme.textMuted }}>
                            {p.absent_count}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: theme.textMuted, padding: '20px' }}>
                          No matching summary records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Incidents & Attendance Analytics Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
        }}
      >
        {/* Incidents by Site Card */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: `1px solid ${theme.border}`,
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div
            style={{
              padding: '12px 18px',
              borderBottom: `1px solid ${theme.border}`,
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: theme.textMain }}>
              Incidents by Site
            </h3>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search
                size={14}
                style={{ position: 'absolute', left: '8px', color: theme.textMuted, pointerEvents: 'none' }}
              />
              <input
                type="text"
                placeholder="Search site..."
                value={incidentSearch}
                onChange={(e) => setIncidentSearch(e.target.value)}
                className="table-search-input"
              />
            </div>
          </div>

          {incidentLoading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: theme.textMuted }}>
              Loading incident statistics...
            </div>
          ) : (
            <div className="scroll-7">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Site</th>
                    <th>Total</th>
                    <th>Pending</th>
                    <th>Approved</th>
                    <th>Escalated</th>
                    <th>Rejected</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncidents?.length ? (
                    filteredIncidents.map((s) => (
                      <tr key={s.site_id}>
                        <td style={{ fontWeight: '600' }}>{s.site_name}</td>
                        <td>{s.total_incidents}</td>
                        <td style={{ color: theme.warning }}>{s.pending}</td>
                        <td style={{ color: theme.success }}>{s.approved}</td>
                        <td style={{ color: theme.danger }}>{s.escalated}</td>
                        <td style={{ color: theme.textMuted }}>{s.rejected}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: theme.textMuted, padding: '20px' }}>
                        No matching incident data found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Attendance Rate Overview Card */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: `1px solid ${theme.border}`,
            borderRadius: '8px',
            padding: '18px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <h3
            style={{
              fontSize: '16px',
              fontWeight: '600',
              marginTop: 0,
              marginBottom: '16px',
              color: theme.textMain,
            }}
          >
            Attendance Performance Rate
          </h3>

          {attendanceLoading ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: theme.textMuted }}>
              Loading attendance analytics...
            </div>
          ) : attendanceRate ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
              {/* Main Metric Highlight */}
              <div
                style={{
                  backgroundColor: theme.cardBg,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase' }}>
                  On-Time Compliance Rate
                </div>
                <div
                  style={{
                    fontSize: '36px',
                    fontWeight: '800',
                    color: attendanceRate.on_time_rate_percent >= 80 ? theme.success : theme.warning,
                    margin: '4px 0',
                  }}
                >
                  {attendanceRate.on_time_rate_percent}%
                </div>
                <div style={{ fontSize: '12px', color: theme.textMuted }}>
                  Total records processed: <strong>{attendanceRate.total_records}</strong>
                </div>
              </div>

              {/* Stats Breakdown Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  marginTop: 'auto',
                }}
              >
                <div
                  style={{
                    border: `1px solid ${theme.border}`,
                    borderRadius: '6px',
                    padding: '10px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: theme.success, fontSize: '11px', fontWeight: '600' }}>
                    <CheckCircle size={12} /> On Time
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '700', marginTop: '2px' }}>
                    {attendanceRate.on_time}
                  </div>
                </div>

                <div
                  style={{
                    border: `1px solid ${theme.border}`,
                    borderRadius: '6px',
                    padding: '10px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: theme.warning, fontSize: '11px', fontWeight: '600' }}>
                    <Clock size={12} /> Late
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '700', marginTop: '2px' }}>
                    {attendanceRate.late}
                  </div>
                </div>

                <div
                  style={{
                    border: `1px solid ${theme.border}`,
                    borderRadius: '6px',
                    padding: '10px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: theme.danger, fontSize: '11px', fontWeight: '600' }}>
                    <AlertCircle size={12} /> Absent
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '700', marginTop: '2px' }}>
                    {attendanceRate.absent}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: theme.textMuted, fontSize: '13px' }}>
              No attendance data available for this range.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}