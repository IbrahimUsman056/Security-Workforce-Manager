import { useState } from 'react';
import { useGetAuditLogsQuery } from './auditApi';
import { formatDateTime } from '../../utils/dateHelpers';

const ENTITY_TYPES = ['Site', 'Shift', 'IncidentReport', 'User'];

export default function AuditLogsPage() {
  const [entityType, setEntityType] = useState('');
  const [search, setSearch] = useState('');
  const { data: logs, isLoading } = useGetAuditLogsQuery({ entityType });

  const formatChanges = (changesJson) => {
    if (!changesJson) return '-';
    try {
      const parsed = typeof changesJson === 'string' ? JSON.parse(changesJson) : changesJson;
      return JSON.stringify(parsed, null, 0);
    } catch {
      return String(changesJson);
    }
  };

  const filteredLogs = logs?.filter((log) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const changesStr = formatChanges(log.changes);
    return (
      String(log.user_id).includes(q) ||
      (log.action || '').toLowerCase().includes(q) ||
      (log.entity_type || '').toLowerCase().includes(q) ||
      String(log.entity_id).includes(q) ||
      changesStr.toLowerCase().includes(q) ||
      formatDateTime(log.created_at).toLowerCase().includes(q)
    );
  });

  // Shared Color Palette Definitions
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

  // Shared Fluid Input Styles
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
          Audit Logs
        </h2>
        <p style={{
          margin: '4px 0 0 0',
          fontSize: '14px',
          color: theme.textMuted
        }}>
          Track system actions, user activities, and record modifications
        </p>
      </div>

      {/* Compact & Fluid Filter Controls Container */}
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
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          width: '100%'
        }}>
          <div style={{ flex: '1 1 200px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="audit-entity-type" style={labelStyle}>Entity Type</label>
            <select
              id="audit-entity-type"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              style={inputStyle}
            >
              <option value="">All types</option>
              {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div style={{ flex: '2 1 280px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="audit-search" style={labelStyle}>Search</label>
            <input
              id="audit-search"
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Audit Logs Table Card Container with Fluid Containment */}
      <div style={{
        backgroundColor: '#ffffff',
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        width: '100%'
      }}>
        {isLoading ? (
          <div style={{
            padding: '28px',
            textAlign: 'center',
            color: theme.textMuted,
            fontSize: '14px'
          }}>
            Loading...
          </div>
        ) : (
          <div 
            className="custom-scrollbar"
            style={{ 
              maxHeight: '520px',
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
                  <th style={{ padding: '12px 14px', fontWeight: '600', whiteSpace: 'nowrap' }}>Time</th>
                  <th style={{ padding: '12px 14px', fontWeight: '600', whiteSpace: 'nowrap' }}>User</th>
                  <th style={{ padding: '12px 14px', fontWeight: '600', whiteSpace: 'nowrap' }}>Action</th>
                  <th style={{ padding: '12px 14px', fontWeight: '600', whiteSpace: 'nowrap' }}>Entity</th>
                  <th style={{ padding: '12px 14px', fontWeight: '600', whiteSpace: 'nowrap' }}>Entity ID</th>
                  <th style={{ padding: '12px 14px', fontWeight: '600', whiteSpace: 'nowrap' }}>Changes</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs?.length ? filteredLogs.map((log) => (
                  <tr 
                    key={log.id}
                    style={{
                      borderBottom: `1px solid ${theme.border}`,
                      backgroundColor: '#ffffff',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                    }}
                  >
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: theme.textMuted, fontSize: '12.5px' }}>
                      {formatDateTime(log.created_at)}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                      User #{log.user_id}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        backgroundColor: '#f8fafc',
                        border: `1px solid ${theme.border}`,
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        color: theme.primary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px'
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: '500' }}>
                      {log.entity_type}
                    </td>
                    <td style={{ padding: '12px 14px', color: theme.textMuted, fontFamily: 'monospace', fontSize: '12.5px' }}>
                      #{log.entity_id}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ 
                        fontSize: '12px', 
                        maxWidth: '300px', 
                        maxHeight: '80px',
                        overflowY: 'auto', 
                        fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
                        backgroundColor: '#f8fafc',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        border: `1px solid ${theme.border}`,
                        wordBreak: 'break-all',
                        whiteSpace: 'pre-wrap',
                        color: theme.textMain
                      }}>
                        {formatChanges(log.changes)}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: '28px',
                        textAlign: 'center',
                        color: theme.textMuted,
                        fontSize: '14px'
                      }}
                    >
                      No matching logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}