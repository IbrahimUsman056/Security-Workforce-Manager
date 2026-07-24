import { useState } from 'react';
import { useSelector } from 'react-redux';
import { API_BASE_URL } from '../../config';

// Corporate Theme Definitions
const theme = {
  bg: '#ffffff',
  textMain: '#0f1729',
  textMuted: '#64748b',
  primary: '#991b1b',
  primaryHover: '#7f1d1d',
  border: '#e2e8f0',
  cardBg: '#f8fafc',
};

// Reusable Input & Label Styles
const inputStyle = {
  padding: '8px 12px',
  borderRadius: '6px',
  border: `1px solid ${theme.border}`,
  fontSize: '13px',
  color: theme.textMain,
  backgroundColor: '#ffffff',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s ease',
  minHeight: '38px',
};

const labelStyle = {
  fontSize: '12px',
  fontWeight: '600',
  color: theme.textMain,
  marginBottom: '4px',
  display: 'block',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

function defaultDates() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export default function MyPayslipPage() {
  const { user } = useSelector((state) => state.auth);
  const [{ start, end }, setDates] = useState(defaultDates());

  const handleDownload = () => {
    const token = localStorage.getItem('token');
    const startDate = start;
    const endDate = `${end}T23:59:59`;
    fetch(`${API_BASE_URL}/reports/payslip/${user.id}/pdf?start_date=${startDate}&end_date=${endDate}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('No payslip data found for this period');
        return res.blob();
      })
      .then((blob) => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `payslip_${user.id}.pdf`;
        link.click();
      })
      .catch((err) => alert(err.message));
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
        overflowX: 'hidden',
      }}
    >
      {/* Page Header */}
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
          My Payslip
        </h2>
        <p
          style={{
            margin: '4px 0 0 0',
            fontSize: '14px',
            color: theme.textMuted,
          }}
        >
          Generate and download your official payroll statements for any date range
        </p>
      </div>

      {/* Main Content Card Container */}
      <div
        style={{
          backgroundColor: theme.cardBg,
          border: `1px solid ${theme.border}`,
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* User Summary Header inside Card */}
        {user && (
          <div
            style={{
              paddingBottom: '16px',
              marginBottom: '16px',
              borderBottom: `1px solid ${theme.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Employee
              </span>
              <div style={{ fontSize: '15px', fontWeight: '700', color: theme.textMain }}>
                {user.name || user.email || `User #${user.id}`}
              </div>
            </div>
            <span
              style={{
                padding: '4px 10px',
                backgroundColor: '#ffffff',
                border: `1px solid ${theme.border}`,
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                color: theme.textMuted,
              }}
            >
              ID: #{user.id}
            </span>
          </div>
        )}

        {/* Date Filter & Download Form */}
        <div
          className="inline-form"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            alignItems: 'flex-end',
            width: '100%',
          }}
        >
          {/* Start Date Field */}
          <div style={{ flex: '1 1 200px', minWidth: '160px' }}>
            <label style={labelStyle}>From Date</label>
            <input
              type="date"
              value={start}
              onChange={(e) => setDates((d) => ({ ...d, start: e.target.value }))}
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>

          {/* End Date Field */}
          <div style={{ flex: '1 1 200px', minWidth: '160px' }}>
            <label style={labelStyle}>To Date</label>
            <input
              type="date"
              value={end}
              onChange={(e) => setDates((d) => ({ ...d, end: e.target.value }))}
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>

          {/* Download Action Button */}
          <div style={{ flex: '0 0 auto' }}>
            <button
              onClick={handleDownload}
              style={{
                padding: '0 24px',
                backgroundColor: theme.primary,
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                whiteSpace: 'nowrap',
                height: '38px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = theme.primaryHover;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = theme.primary;
              }}
            >
              <span>📄</span> Download My Payslip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}