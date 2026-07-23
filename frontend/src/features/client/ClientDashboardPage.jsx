import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Building2 } from 'lucide-react';
import {
  useGetMySitesQuery,
  useGetCoverageQuery,
  useGetClientIncidentsQuery,
  useGetClientInvoicesQuery,
} from './clientApi';
import { formatDateTime } from '../../utils/dateHelpers';

const POLL_MS = 20000;

// Corporate Theme Definitions
const theme = {
  bg: '#ffffff',
  textMain: '#0f1729',
  textMuted: '#64748b',
  primary: '#991b1b',
  primaryHover: '#7f1d1d',
  primaryLight: '#fef2f2',
  border: '#e2e8f0',
  cardBg: '#f8fafc',
  accentSuccess: '#166534',
  accentSuccessBg: '#f0fdf4',
  accentWarning: '#854d0e',
  accentWarningBg: '#fef9c3',
  accentAlert: '#991b1b',
  accentAlertBg: '#fee2e2',
  accentNeutral: '#374151',
  accentNeutralBg: '#f3f4f6',
};

export default function ClientDashboardPage() {
  const { user } = useSelector((state) => state.auth);
  const { data: sites, isLoading: sitesLoading } = useGetMySitesQuery(undefined, { pollingInterval: POLL_MS });
  const [selectedSiteId, setSelectedSiteId] = useState(null);

  const { data: coverage } = useGetCoverageQuery(selectedSiteId, { skip: !selectedSiteId, pollingInterval: POLL_MS });
  const { data: incidents } = useGetClientIncidentsQuery(selectedSiteId, { skip: !selectedSiteId });
  const { data: invoices } = useGetClientInvoicesQuery(selectedSiteId, { skip: !selectedSiteId });

  const selectedSite = sites?.find((s) => s.id === selectedSiteId);

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px 16px 40px 16px',
        backgroundColor: theme.bg,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        color: theme.textMain,
        boxSizing: 'border-box',
      }}
    >
      {/* Keyframe Animations for Live Indicator Pulse */}
      <style>{`
        @keyframes pulseDot {
          0% { transform: scale(0.95); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.6; }
          100% { transform: scale(0.95); opacity: 1; }
        }
        .live-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: ${theme.primary};
          animation: pulseDot 1.8s infinite ease-in-out;
        }
        .site-card-interactive {
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid ${theme.border};
          background-color: ${theme.cardBg};
        }
        .site-card-interactive:hover {
          border-color: ${theme.primary};
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(153, 27, 27, 0.06);
        }
        .site-card-interactive.selected {
          border-color: ${theme.primary};
          background-color: ${theme.primaryLight};
          box-shadow: 0 0 0 1px ${theme.primary};
        }
        .table-row-hover {
          transition: background-color 0.15s ease;
        }
        .table-row-hover:hover {
          background-color: #f1f5f9 !important;
        }
      `}</style>

      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
          borderBottom: `2px solid ${theme.primary}`,
          paddingBottom: '12px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: '700',
              color: theme.textMain,
              margin: 0,
              letterSpacing: '-0.5px',
            }}
          >
            Welcome, {user?.name}
          </h1>
          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: '14px',
              color: theme.textMuted,
            }}
          >
            Client Portal - Real-time read-only summary of security coverage, incident logs, and invoicing
          </p>
        </div>

        {/* Live Indicator Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: theme.primaryLight,
            border: `1px solid ${theme.border}`,
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            color: theme.primary,
          }}
        >
          <span className="live-dot" />
          <span>Live Updates</span>
        </div>
      </div>

      {/* Profile Card */}
      <div
        style={{
          backgroundColor: theme.cardBg,
          border: `1px solid ${theme.border}`,
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: theme.primary,
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700',
            fontSize: '18px',
            flexShrink: 0,
          }}
        >
          {(user?.name || '?').charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: '700', fontSize: '15px', color: theme.textMain }}>{user?.name}</div>
          <div style={{ fontSize: '13px', color: theme.textMuted }}>{user?.email}</div>
        </div>
      </div>

      {/* Site Selector Section */}
      <div style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 4px 0', color: theme.textMain }}>
          Your Sites
        </h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: theme.textMuted }}>
          Select a site location below to view active coverage schedules, security logs, and billing details.
        </p>

        {sitesLoading ? (
          <p style={{ fontSize: '14px', color: theme.textMuted }}>Loading your sites...</p>
        ) : !sites?.length ? (
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: theme.cardBg,
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              color: theme.textMuted,
              fontSize: '14px',
            }}
          >
            No sites are currently linked to your account. Please contact your account manager.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {sites.map((s) => {
              const isSelected = selectedSiteId === s.id;
              return (
                <div
                  key={s.id}
                  className={`site-card-interactive${isSelected ? ' selected' : ''}`}
                  onClick={() => setSelectedSiteId(s.id)}
                  style={{
                    borderRadius: '8px',
                    padding: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        backgroundColor: isSelected ? theme.primary : '#ffffff',
                        border: `1px solid ${isSelected ? theme.primary : theme.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Building2 size={20} color={isSelected ? '#ffffff' : theme.primary} />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div
                        style={{
                          fontWeight: '700',
                          fontSize: '14px',
                          color: theme.textMain,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {s.name}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: theme.textMuted,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginTop: '2px',
                        }}
                      >
                        {s.address}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed Site Panels */}
      {selectedSiteId && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Section 1: Today's Coverage */}
          <div>
            <div style={{ borderBottom: `1px solid ${theme.border}`, paddingBottom: '8px', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: theme.textMain }}>
                Today's Coverage — <span style={{ color: theme.primary }}>{selectedSite?.name}</span>
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: theme.textMuted }}>
                Live guard headcount monitoring today's scheduled shifts.
              </p>
            </div>

            <div
              style={{
                backgroundColor: '#ffffff',
                border: `1px solid ${theme.border}`,
                borderRadius: '8px',
                overflowX: 'auto',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: theme.cardBg, borderBottom: `1px solid ${theme.border}` }}>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: theme.textMuted, letterSpacing: '0.5px' }}>Shift ID</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: theme.textMuted, letterSpacing: '0.5px' }}>Time Window</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: theme.textMuted, letterSpacing: '0.5px' }}>Required Guards</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: theme.textMuted, letterSpacing: '0.5px' }}>Checked In</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: theme.textMuted, letterSpacing: '0.5px', textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {coverage?.length ? (
                    coverage.map((c) => (
                      <tr key={c.shift_id} className="table-row-hover" style={{ borderBottom: `1px solid ${theme.border}` }}>
                        <td style={{ padding: '14px 16px', fontSize: '13.5px', fontWeight: '700', color: theme.textMain }}>#{c.shift_id}</td>
                        <td style={{ padding: '14px 16px', fontSize: '13.5px', color: theme.textMain }}>
                          {formatDateTime(c.start_time)} → {formatDateTime(c.end_time)}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '13.5px', color: theme.textMain }}>{c.required_count}</td>
                        <td style={{ padding: '14px 16px', fontSize: '13.5px', fontWeight: '600', color: theme.textMain }}>{c.checked_in_count}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '700',
                              backgroundColor: c.is_fully_staffed ? theme.accentSuccessBg : theme.accentWarningBg,
                              color: c.is_fully_staffed ? theme.accentSuccess : theme.accentWarning,
                              border: `1px solid ${c.is_fully_staffed ? '#bbf7d0' : '#fef08a'}`,
                            }}
                          >
                            {c.is_fully_staffed ? '✅ Fully Staffed' : '⚠️ Understaffed'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ padding: '20px 16px', fontSize: '13.5px', color: theme.textMuted, textAlign: 'center' }}>
                        No shifts scheduled today at this site.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Incidents */}
          <div>
            <div style={{ borderBottom: `1px solid ${theme.border}`, paddingBottom: '8px', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: theme.textMain }}>
                Incidents — <span style={{ color: theme.primary }}>{selectedSite?.name}</span>
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: theme.textMuted }}>
                Log of security alerts, site disturbances, and operational reports.
              </p>
            </div>

            <div
              style={{
                backgroundColor: '#ffffff',
                border: `1px solid ${theme.border}`,
                borderRadius: '8px',
                overflowX: 'auto',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: theme.cardBg, borderBottom: `1px solid ${theme.border}` }}>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: theme.textMuted, letterSpacing: '0.5px' }}>Type</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: theme.textMuted, letterSpacing: '0.5px' }}>Severity</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: theme.textMuted, letterSpacing: '0.5px' }}>Description</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: theme.textMuted, letterSpacing: '0.5px' }}>Status</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: theme.textMuted, letterSpacing: '0.5px', textAlign: 'right' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents?.length ? (
                    incidents.map((inc) => (
                      <tr key={inc.id} className="table-row-hover" style={{ borderBottom: `1px solid ${theme.border}` }}>
                        <td style={{ padding: '14px 16px', fontSize: '13.5px', fontWeight: '700', color: theme.textMain }}>{inc.type}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 10px',
                              borderRadius: '20px',
                              fontSize: '11px',
                              fontWeight: '700',
                              backgroundColor:
                                inc.severity === 'HIGH'
                                  ? theme.accentAlertBg
                                  : inc.severity === 'MEDIUM'
                                  ? theme.accentWarningBg
                                  : theme.accentNeutralBg,
                              color:
                                inc.severity === 'HIGH'
                                  ? theme.accentAlert
                                  : inc.severity === 'MEDIUM'
                                  ? theme.accentWarning
                                  : theme.accentNeutral,
                              border: `1px solid ${
                                inc.severity === 'HIGH'
                                  ? '#fecaca'
                                  : inc.severity === 'MEDIUM'
                                  ? '#fef08a'
                                  : '#e5e7eb'
                              }`,
                            }}
                          >
                            {inc.severity}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '13.5px', color: theme.textMain }}>{inc.description}</td>
                        <td style={{ padding: '14px 16px', fontSize: '13.5px', fontWeight: '600', color: theme.textMain }}>{inc.status}</td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: theme.textMuted, textAlign: 'right' }}>{formatDateTime(inc.created_at)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ padding: '20px 16px', fontSize: '13.5px', color: theme.textMuted, textAlign: 'center' }}>
                        No incidents reported at this site.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Invoices */}
          <div>
            <div style={{ borderBottom: `1px solid ${theme.border}`, paddingBottom: '8px', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: theme.textMain }}>
                Invoices — <span style={{ color: theme.primary }}>{selectedSite?.name}</span>
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: theme.textMuted }}>
                Contracted vs. actual hours billed per period.
              </p>
            </div>

            <div
              style={{
                backgroundColor: '#ffffff',
                border: `1px solid ${theme.border}`,
                borderRadius: '8px',
                overflowX: 'auto',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: theme.cardBg, borderBottom: `1px solid ${theme.border}` }}>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: theme.textMuted, letterSpacing: '0.5px' }}>Billing Period</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: theme.textMuted, letterSpacing: '0.5px' }}>Contracted</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: theme.textMuted, letterSpacing: '0.5px' }}>Actual</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: theme.textMuted, letterSpacing: '0.5px' }}>Total Amount</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: theme.textMuted, letterSpacing: '0.5px', textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices?.length ? (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="table-row-hover" style={{ borderBottom: `1px solid ${theme.border}` }}>
                        <td style={{ padding: '14px 16px', fontSize: '13.5px', color: theme.textMain }}>
                          {formatDateTime(inv.period_start)} → {formatDateTime(inv.period_end)}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '13.5px', color: theme.textMuted }}>{inv.contracted_hours}h</td>
                        <td style={{ padding: '14px 16px', fontSize: '13.5px', color: theme.textMuted }}>{inv.actual_hours}h</td>
                        <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '700', color: theme.textMain }}>
                          {inv.total_amount} {inv.currency}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 10px',
                              borderRadius: '20px',
                              fontSize: '11px',
                              fontWeight: '700',
                              backgroundColor:
                                inv.status === 'PAID'
                                  ? theme.accentSuccessBg
                                  : inv.status === 'SENT'
                                  ? theme.accentWarningBg
                                  : theme.accentNeutralBg,
                              color:
                                inv.status === 'PAID'
                                  ? theme.accentSuccess
                                  : inv.status === 'SENT'
                                  ? theme.accentWarning
                                  : theme.accentNeutral,
                              border: `1px solid ${
                                inv.status === 'PAID'
                                  ? '#bbf7d0'
                                  : inv.status === 'SENT'
                                  ? '#fef08a'
                                  : '#e5e7eb'
                              }`,
                            }}
                          >
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ padding: '20px 16px', fontSize: '13.5px', color: theme.textMuted, textAlign: 'center' }}>
                        No invoices yet for this site.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}