import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetMyShiftsQuery } from '../assignments/assignmentsApi';
import {
  useGetMyReportsQuery,
  useGetAllIncidentsQuery,
  useCreateIncidentMutation,
  useUpdateIncidentStatusMutation,
} from './incidentsApi';
import { toLocalTime, formatDateTime } from '../../utils/dateHelpers';

const INCIDENT_TYPES = ['THEFT', 'BREACH', 'DISTURBANCE', 'EQUIPMENT', 'OTHER'];
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const SEVERITY_COLORS = {
  LOW: '#22c55e',
  MEDIUM: '#eab308',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

export default function IncidentsPage() {
  const { user } = useSelector((state) => state.auth);
  const canReview = user?.role === 'ADMIN' || user?.role === 'SUPERVISOR';

  const { data: myShifts } = useGetMyShiftsQuery(undefined, { skip: canReview });
  const { data: myReports } = useGetMyReportsQuery(undefined, { skip: canReview });
  const { data: allIncidents } = useGetAllIncidentsQuery(undefined, { skip: !canReview });
  const [createIncident, { isLoading: submitting }] = useCreateIncidentMutation();
  const [updateStatus] = useUpdateIncidentStatusMutation();

  const [form, setForm] = useState({
    shift_assignment_id: '',
    type: 'OTHER',
    severity: 'MEDIUM',
    description: '',
    photo: null,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('shift_assignment_id', form.shift_assignment_id);
    fd.append('type', form.type);
    fd.append('severity', form.severity);
    fd.append('description', form.description);
    if (form.photo) fd.append('photo', form.photo);
    await createIncident(fd);
    setForm({ shift_assignment_id: '', type: 'OTHER', severity: 'MEDIUM', description: '', photo: null });
  };

  const list = canReview ? allIncidents : myReports;

  const isOverdue = (incident) => {
    if (!incident.sla_deadline || incident.status !== 'PENDING') return false;
    return toLocalTime(incident.sla_deadline) < new Date();
  };

  // Color Palette Definitions
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
  };

  // Fluid Input Styles
  const inputStyle = {
    width: '100%',
    padding: '6px 10px',
    borderRadius: '5px',
    border: `1px solid ${theme.border}`,
    fontSize: '13px',
    color: theme.textMain,
    backgroundColor: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
  };

  const labelStyle = {
    fontSize: '12px',
    fontWeight: '600',
    color: theme.textMain,
    marginBottom: '2px',
    display: 'block',
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '24px 16px',
      backgroundColor: theme.bg,
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      color: theme.textMain,
      boxSizing: 'border-box',
      overflowX: 'hidden'
    }}>
      {/* Scrollbar Customization Injection */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${theme.scrollbarTrack};
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${theme.scrollbarThumb};
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${theme.primary};
        }
      `}</style>

      {/* Header section */}
      <div style={{
        marginBottom: '20px',
        borderBottom: `2px solid ${theme.primary}`,
        paddingBottom: '8px'
      }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: theme.textMain,
          margin: 0,
          letterSpacing: '-0.5px'
        }}>
          Incidents
        </h2>
        <p style={{
          margin: '4px 0 0 0',
          fontSize: '14px',
          color: theme.textMuted
        }}>
          {canReview ? 'Review and manage reported incident logs' : 'Report and track security incidents'}
        </p>
      </div>

      {/* Compact & Fluid Incident Form Container */}
      {!canReview && (
        <div style={{
          backgroundColor: theme.cardBg,
          border: `1px solid ${theme.border}`,
          borderRadius: '8px',
          padding: '14px 16px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          boxSizing: 'border-box',
          width: '100%'
        }}>
          <h3 style={{
            fontSize: '15px',
            fontWeight: '600',
            color: theme.textMain,
            marginTop: 0,
            marginBottom: '10px'
          }}>
            Report New Incident
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              width: '100%'
            }}>
              <div style={{ flex: '1 1 200px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <label htmlFor="inc-assignment" style={labelStyle}>Assignment</label>
                <select
                  id="inc-assignment"
                  value={form.shift_assignment_id}
                  onChange={(e) => setForm({ ...form, shift_assignment_id: e.target.value })}
                  required
                  style={inputStyle}
                >
                  <option value="">Select shift assignment</option>
                  {myShifts?.map((a) => (
                    <option key={a.id} value={a.id}>
                      Assignment #{a.id} (Shift #{a.shift_id})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ flex: '1 1 120px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <label htmlFor="inc-type" style={labelStyle}>Type</label>
                <select
                  id="inc-type"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  style={inputStyle}
                >
                  {INCIDENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div style={{ flex: '1 1 120px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <label htmlFor="inc-severity" style={labelStyle}>Severity</label>
                <select
                  id="inc-severity"
                  value={form.severity}
                  onChange={(e) => setForm({ ...form, severity: e.target.value })}
                  style={inputStyle}
                >
                  {SEVERITIES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div style={{ flex: '1 1 180px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <label htmlFor="inc-photo" style={labelStyle}>Photo Attachment</label>
                <input
                  id="inc-photo"
                  type="file"
                  onChange={(e) => setForm({ ...form, photo: e.target.files[0] })}
                  style={{
                    ...inputStyle,
                    padding: '4px 8px',
                    fontSize: '12px'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
              <label htmlFor="inc-desc" style={labelStyle}>Description</label>
              <textarea
                id="inc-desc"
                placeholder="Detailed explanation of the incident..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
                style={{
                  ...inputStyle,
                  minHeight: '52px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  height: '34px',
                  padding: '0 18px',
                  backgroundColor: theme.primary,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '5px',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                  transition: 'background-color 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseOver={(e) => {
                  if (!submitting) e.currentTarget.style.backgroundColor = theme.primaryHover;
                }}
                onMouseOut={(e) => {
                  if (!submitting) e.currentTarget.style.backgroundColor = theme.primary;
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Incidents Table Card Container with Fluid Containment */}
      <div style={{
        backgroundColor: '#ffffff',
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        width: '100%'
      }}>
        <div 
          className="custom-scrollbar"
          style={{ 
            maxHeight: '480px',
            overflowY: 'auto', 
            overflowX: 'auto', 
            width: '100%',
            scrollbarWidth: 'thin',
            scrollbarColor: `${theme.scrollbarThumb} ${theme.scrollbarTrack}`
          }}
        >
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: '14px',
            color: theme.textMain
          }}>
            <thead style={{
              position: 'sticky',
              top: 0,
              zIndex: 10,
              backgroundColor: theme.textMain
            }}>
              <tr style={{
                color: '#ffffff',
                borderBottom: `1px solid ${theme.border}`
              }}>
                <th style={{ padding: '12px 14px', fontWeight: '600', width: '60px' }}>ID</th>
                <th style={{ padding: '12px 14px', fontWeight: '600' }}>Type</th>
                <th style={{ padding: '12px 14px', fontWeight: '600' }}>Severity</th>
                <th style={{ padding: '12px 14px', fontWeight: '600' }}>Description</th>
                <th style={{ padding: '12px 14px', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '12px 14px', fontWeight: '600' }}>SLA Deadline</th>
                {canReview && <th style={{ padding: '12px 14px', fontWeight: '600', textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {list?.length ? list.map((incident) => {
                const overdue = isOverdue(incident);
                return (
                  <tr 
                    key={incident.id}
                    style={{
                      borderBottom: `1px solid ${theme.border}`,
                      backgroundColor: overdue ? '#fee2e2' : '#ffffff',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseOver={(e) => {
                      if (!overdue) e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseOut={(e) => {
                      if (!overdue) e.currentTarget.style.backgroundColor = '#ffffff';
                    }}
                  >
                    <td style={{ padding: '12px 14px', fontWeight: '600' }}>
                      #{incident.id}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: '500' }}>
                      {incident.type}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ 
                        color: SEVERITY_COLORS[incident.severity] || theme.textMain, 
                        fontWeight: '700',
                        fontSize: '12.5px'
                      }}>
                        {incident.severity}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', wordBreak: 'break-word', maxWidth: '280px' }}>
                      {incident.description}
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', fontWeight: '500' }}>
                      {incident.status}
                      {overdue && (
                        <span style={{ color: '#dc2626', fontWeight: '700', marginLeft: '6px' }}>
                          ⚠️ OVERDUE
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: theme.textMuted }}>
                      {formatDateTime(incident.sla_deadline)}
                    </td>
                    {canReview && (
                      <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <select 
                          value={incident.status} 
                          onChange={(e) => updateStatus({ id: incident.id, status: e.target.value })}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: `1px solid ${theme.border}`,
                            fontSize: '12.5px',
                            color: theme.textMain,
                            backgroundColor: '#ffffff',
                            outline: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="APPROVED">APPROVED</option>
                          <option value="ESCALATED">ESCALATED</option>
                          <option value="REJECTED">REJECTED</option>
                        </select>
                      </td>
                    )}
                  </tr>
                );
              }) : (
                <tr>
                  <td
                    colSpan={canReview ? 7 : 6}
                    style={{
                      padding: '28px',
                      textAlign: 'center',
                      color: theme.textMuted,
                      fontSize: '14px'
                    }}
                  >
                    No incidents found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}