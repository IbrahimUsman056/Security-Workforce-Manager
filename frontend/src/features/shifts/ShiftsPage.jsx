import { useState } from 'react';
import { useSelector } from 'react-redux';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useGetSitesQuery } from '../sites/sitesApi';
import { useGetShiftsQuery, useCreateShiftMutation, useDeleteShiftMutation, useGetSuggestedStaffQuery } from './shiftsApi';
import { useGetAssignmentsQuery, useCreateAssignmentMutation, useCancelAssignmentMutation } from '../assignments/assignmentsApi';
import { useGetUsersQuery } from '../users/usersApi';
import { formatDateTime } from '../../utils/dateHelpers';

export default function ShiftsPage() {
  const { user } = useSelector((state) => state.auth);
  const canManage = user?.role === 'ADMIN' || user?.role === 'SUPERVISOR';

  const { data: sites } = useGetSitesQuery();
  const [createShift] = useCreateShiftMutation();
  const [deleteShift] = useDeleteShiftMutation();
  const handleDelete = async (shiftId) => {
    try {
      await deleteShift(shiftId).unwrap();
      setStatusMsg('Shift deleted.');
    } catch (err) {
      setStatusMsg(err?.data?.detail || 'Failed to delete shift.');
    }
  };

  const [filters, setFilters] = useState({ siteId: '', startDate: '', endDate: '', page: 1, pageSize: 50 });
  const { data, isLoading, isFetching } = useGetShiftsQuery(filters);

  const [form, setForm] = useState({ site_id: '', start_time: '', end_time: '', required_count: 1 });
  const [expandedShiftId, setExpandedShiftId] = useState(null);

  const handleFilterChange = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createShift({ ...form, site_id: parseInt(form.site_id), required_count: parseInt(form.required_count) });
    setForm({ site_id: '', start_time: '', end_time: '', required_count: 1 });
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Theme Palette Definitions
  const theme = {
    bg: '#ffffff',
    textMain: '#0f1729',
    textMuted: '#64748b',
    primary: '#991b1b',
    primaryHover: '#7f1d1d',
    border: '#e2e8f0',
    cardBg: '#f8fafc',
    dangerBg: '#fef2f2',
    dangerText: '#991b1b',
    scrollbarThumb: '#cbd5e1',
    scrollbarTrack: '#f1f5f9',
    badgeUnderstaffedBg: '#fef2f2',
    badgeUnderstaffedText: '#991b1b',
    badgeStaffedBg: '#f0fdf4',
    badgeStaffedText: '#166534',
  };

  // Reusable input and label styles
  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '6px',
    border: `1px solid ${theme.border}`,
    fontSize: '14px',
    color: theme.textMain,
    backgroundColor: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  };

  const labelStyle = {
    fontSize: '13px',
    fontWeight: '600',
    color: theme.textMain,
    marginBottom: '2px',
    display: 'block'
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px',
        color: theme.textMuted,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        fontSize: '15px'
      }}>
        Loading shifts...
      </div>
    );
  }

  const shifts = data?.items || [];
  const totalPages = data?.total_pages || 1;

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '24px 16px',
      backgroundColor: theme.bg,
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      color: theme.textMain,
      boxSizing: 'border-box'
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
        marginBottom: '24px',
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
          Shifts
        </h2>
        {statusMsg && <p className="card">{statusMsg}</p>}
        <p style={{
          margin: '4px 0 0 0',
          fontSize: '14px',
          color: theme.textMuted
        }}>
          View and manage shift schedules
        </p>
      </div>

      {/* Create Shift Form Container */}
      {canManage && (
        <div style={{
          backgroundColor: theme.cardBg,
          border: `1px solid ${theme.border}`,
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '28px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: theme.textMain,
            marginTop: 0,
            marginBottom: '16px'
          }}>
            Create New Shift
          </h3>

          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            gap: '16px'
          }}>
            <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="shift-site" style={labelStyle}>Site</label>
              <select
                id="shift-site"
                name="site_id"
                value={form.site_id}
                onChange={handleChange}
                required
                style={inputStyle}
              >
                <option value="">Select site</option>
                {sites?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="shift-start" style={labelStyle}>Start Time</label>
              <input
                id="shift-start"
                type="datetime-local"
                name="start_time"
                value={form.start_time}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="shift-end" style={labelStyle}>End Time</label>
              <input
                id="shift-end"
                type="datetime-local"
                name="end_time"
                value={form.end_time}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="shift-required" style={labelStyle}>Required Staff</label>
              <input
                id="shift-required"
                type="number"
                name="required_count"
                value={form.required_count}
                onChange={handleChange}
                min="1"
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              style={{
                flex: '0 0 auto',
                height: '40px',
                padding: '0 24px',
                backgroundColor: theme.primary,
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme.primaryHover}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = theme.primary}
            >
              Create Shift
            </button>
          </form>
        </div>
      )}

      {/* Filter Section Container */}
      <div style={{
        backgroundColor: '#ffffff',
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        padding: '16px 20px',
        marginBottom: '24px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}>
        <h3 style={{
          fontSize: '15px',
          fontWeight: '600',
          color: theme.textMain,
          margin: '0 0 12px 0'
        }}>
          Filter Shifts
        </h3>
        
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="filter-site" style={labelStyle}>Site</label>
            <select
              id="filter-site"
              value={filters.siteId}
              onChange={(e) => handleFilterChange('siteId', e.target.value)}
              style={inputStyle}
            >
              <option value="">All sites</option>
              {sites?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="filter-start-date" style={labelStyle}>From</label>
            <input
              id="filter-start-date"
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="filter-end-date" style={labelStyle}>To</label>
            <input
              id="filter-end-date"
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value ? `${e.target.value}T23:59:59` : '')}
              style={inputStyle}
            />
          </div>

          <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="filter-page-size" style={labelStyle}>Page Size</label>
            <select
              id="filter-page-size"
              value={filters.pageSize}
              onChange={(e) => setFilters((f) => ({ ...f, pageSize: parseInt(e.target.value), page: 1 }))}
              style={inputStyle}
            >
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
              <option value="200">200 per page</option>
            </select>
          </div>

          {isFetching && (
            <span style={{
              alignSelf: 'flex-end',
              marginBottom: '10px',
              fontSize: '13px',
              fontWeight: '500',
              color: theme.primary
            }}>
              Updating...
            </span>
          )}
        </div>
      </div>

      {/* Shifts Table Card Wrapper with fixed height (~7-8 rows visible) */}
      <div style={{
        backgroundColor: '#ffffff',
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        marginBottom: '20px'
      }}>
        <div 
          className="custom-scrollbar"
          style={{ 
            maxHeight: '460px',
            overflowY: 'auto', 
            overflowX: 'auto', 
            width: '100%',
            scrollbarWidth: 'thin',
            scrollbarColor: `${theme.scrollbarThumb} ${theme.scrollbarTrack}`
          }}
        >
          <table style={{
            width: '100%',
            minWidth: '800px',
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
                <th style={{ padding: '14px 12px', width: '40px' }}></th>
                <th style={{ padding: '14px 16px', fontWeight: '600', width: '60px' }}>ID</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Site</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Start</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>End</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Required</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Assigned</th>
                {canManage && <th style={{ padding: '14px 16px', fontWeight: '600', textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {shifts.length ? shifts.map((shift) => (
                <ShiftRow
                  key={shift.id}
                  shift={shift}
                  canManage={canManage}
                  sites={sites}
                  expanded={expandedShiftId === shift.id}
                  onToggle={() => setExpandedShiftId(expandedShiftId === shift.id ? null : shift.id)}
                  onDelete={() => deleteShift(shift.id)}
                  theme={theme}
                  userRole={user?.role}
                />
              )) : (
                <tr>
                  <td
                    colSpan={canManage ? 8 : 7}
                    style={{
                      padding: '28px',
                      textAlign: 'center',
                      color: theme.textMuted,
                      fontSize: '14px'
                    }}
                  >
                    No shifts match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Container */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '12px 16px',
        backgroundColor: theme.cardBg,
        border: `1px solid ${theme.border}`,
        borderRadius: '8px'
      }}>
        <button
          disabled={filters.page <= 1}
          onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: `1px solid ${theme.border}`,
            backgroundColor: filters.page <= 1 ? '#f1f5f9' : '#ffffff',
            color: filters.page <= 1 ? theme.textMuted : theme.textMain,
            fontWeight: '600',
            fontSize: '13px',
            cursor: filters.page <= 1 ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s ease'
          }}
        >
          Previous
        </button>

        <span style={{ fontSize: '13px', fontWeight: '500', color: theme.textMain }}>
          Page <strong>{filters.page}</strong> of <strong>{totalPages}</strong> ({data?.total || 0} total shifts)
        </span>

        <button
          disabled={filters.page >= totalPages}
          onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: `1px solid ${theme.border}`,
            backgroundColor: filters.page >= totalPages ? '#f1f5f9' : '#ffffff',
            color: filters.page >= totalPages ? theme.textMuted : theme.textMain,
            fontWeight: '600',
            fontSize: '13px',
            cursor: filters.page >= totalPages ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s ease'
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function ShiftRow({ shift, canManage, sites, expanded, onToggle, onDelete, theme, userRole }) {
  const siteName = sites?.find((s) => s.id === shift.site_id)?.name || `Site #${shift.site_id}`;
  const isUnderstaffed = shift.assigned_count < shift.required_count;
  const isSupervisorBlocked = userRole === 'SUPERVISOR' && shift.assigned_count > 0;

  return (
    <>
      <tr style={{
        borderBottom: `1px solid ${theme.border}`,
        backgroundColor: expanded ? '#f8fafc' : '#ffffff',
        transition: 'background-color 0.15s ease'
      }}>
        <td style={{ padding: '12px 12px', textAlign: 'center' }}>
          <button
            onClick={onToggle}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              padding: 0,
              backgroundColor: expanded ? theme.primary : '#f1f5f9',
              color: expanded ? '#ffffff' : theme.textMain,
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </td>
        <td style={{ padding: '12px 16px', fontWeight: '500', color: theme.textMuted }}>
          #{shift.id}
        </td>
        <td style={{ padding: '12px 16px', fontWeight: '600', color: theme.textMain }}>
          {siteName}
        </td>
        <td style={{ padding: '12px 16px', color: theme.textMain }}>
          {formatDateTime(shift.start_time)}
        </td>
        <td style={{ padding: '12px 16px', color: theme.textMain }}>
          {formatDateTime(shift.end_time)}
        </td>
        <td style={{ padding: '12px 16px', fontWeight: '500' }}>
          {shift.required_count}
        </td>
        <td style={{ padding: '12px 16px' }}>
          <span style={{
            display: 'inline-block',
            padding: '3px 10px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
            backgroundColor: isUnderstaffed ? theme.badgeUnderstaffedBg : theme.badgeStaffedBg,
            color: isUnderstaffed ? theme.badgeUnderstaffedText : theme.badgeStaffedText,
            border: `1px solid ${isUnderstaffed ? '#fecaca' : '#bbf7d0'}`
          }}>
            {shift.assigned_count} / {shift.required_count}
          </span>
        </td>
        {canManage && (
          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
            <button
              onClick={onDelete}
              disabled={isSupervisorBlocked}
              title={isSupervisorBlocked ? 'Supervisors cannot delete shifts with staff assigned' : ''}
              style={{
                padding: '5px 12px',
                backgroundColor: 'transparent',
                color: theme.dangerText,
                border: `1px solid ${theme.dangerText}`,
                borderRadius: '6px',
                fontSize: '12.5px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme.dangerBg}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Delete
            </button>
          </td>
        )}
      </tr>

      {/* Expanded Row Details */}
      {expanded && (
        <tr>
          <td
            colSpan={canManage ? 8 : 7}
            style={{
              padding: '16px 20px',
              backgroundColor: '#f8fafc',
              borderBottom: `1px solid ${theme.border}`
            }}
          >
            <ShiftDetail shiftId={shift.id} canManage={canManage} theme={theme} />
          </td>
        </tr>
      )}
    </>
  );
}

function ShiftDetail({ shiftId, canManage, theme }) {
  const { data: assignments, isLoading } = useGetAssignmentsQuery(shiftId);
  const { data: users } = useGetUsersQuery(undefined, { skip: !canManage });
  const [createAssignment] = useCreateAssignmentMutation();
  const [cancelAssignment] = useCancelAssignmentMutation();
  const [selectedUser, setSelectedUser] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { data: suggestions } = useGetSuggestedStaffQuery(shiftId, { skip: !showSuggestions });

  const handleAssign = async () => {
    if (!selectedUser) return;
    await createAssignment({ shift_id: shiftId, user_id: parseInt(selectedUser) });
    setSelectedUser('');
  };

  const inputStyle = {
    padding: '8px 12px',
    borderRadius: '6px',
    border: `1px solid ${theme?.border || '#e2e8f0'}`,
    fontSize: '13px',
    color: theme?.textMain || '#0f1729',
    backgroundColor: '#ffffff',
    outline: 'none',
  };

  if (isLoading) return <p style={{ margin: '10px 0', fontSize: '13px', color: theme?.textMuted || '#64748b' }}>Loading assignment details...</p>;

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: `1px solid ${theme?.border || '#e2e8f0'}`,
      borderRadius: '6px',
      padding: '16px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
    }}>
      <strong style={{ fontSize: '13px', color: theme?.textMain || '#0f1729', display: 'block', marginBottom: '8px' }}>
        Assigned Staff
      </strong>

      <ul style={{ margin: '0 0 16px 0', paddingLeft: 0, listStyle: 'none' }}>
        {assignments?.length ? assignments.map((a) => (
          <li
            key={a.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              marginBottom: '6px',
              backgroundColor: '#f8fafc',
              borderRadius: '6px',
              border: `1px solid ${theme?.border || '#e2e8f0'}`,
              fontSize: '13px'
            }}
          >
            <span>
              User <strong>#{a.user_id}</strong> &mdash; <span style={{ color: theme?.textMuted || '#64748b' }}>{a.status}</span>
            </span>
            {canManage && a.status === 'ASSIGNED' && (
              <button
                onClick={() => cancelAssignment(a.id)}
                style={{
                  padding: '4px 10px',
                  backgroundColor: 'transparent',
                  color: theme?.dangerText || '#991b1b',
                  border: `1px solid ${theme?.dangerText || '#991b1b'}`,
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            )}
          </li>
        )) : (
          <li style={{ fontSize: '13px', color: theme?.textMuted || '#64748b', fontStyle: 'italic' }}>
            No staff assigned yet.
          </li>
        )}
      </ul>

      {canManage && (
        <div style={{ borderTop: `1px solid ${theme?.border || '#e2e8f0'}`, paddingTop: '12px' }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            gap: '12px',
            marginBottom: '12px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 200px' }}>
              <label htmlFor={`assign-user-${shiftId}`} style={{ fontSize: '12px', fontWeight: '600', color: theme?.textMain || '#0f1729' }}>
                Assign Staff Member
              </label>
              <select
                id={`assign-user-${shiftId}`}
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                style={inputStyle}
              >
                <option value="">Select staff</option>
                {users?.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
              </select>
            </div>
            <button
              onClick={handleAssign}
              style={{
                height: '35px',
                padding: '0 18px',
                backgroundColor: theme?.primary || '#991b1b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Assign
            </button>
          </div>

          <div>
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#f1f5f9',
                color: theme?.textMain || '#0f1729',
                border: `1px solid ${theme?.border || '#e2e8f0'}`,
                borderRadius: '6px',
                fontSize: '12.5px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {showSuggestions ? 'Hide' : 'Show'} Suggested Staff
            </button>

            {showSuggestions && (
              <div style={{
                marginTop: '10px',
                padding: '12px',
                backgroundColor: '#f8fafc',
                borderRadius: '6px',
                border: `1px solid ${theme?.border || '#e2e8f0'}`
              }}>
                <strong style={{ fontSize: '12px', color: theme?.textMain || '#0f1729', display: 'block', marginBottom: '6px' }}>
                  Recommendations:
                </strong>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  {suggestions?.length ? suggestions.map((s) => (
                    <li key={s.user_id} style={{ fontSize: '12.5px', color: theme?.textMain || '#0f1729', marginBottom: '4px' }}>
                      <strong>{s.name}</strong> &mdash; {s.current_week_hours}h this week
                    </li>
                  )) : (
                    <li style={{ fontSize: '12.5px', color: theme?.textMuted || '#64748b' }}>
                      No eligible candidates found
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}