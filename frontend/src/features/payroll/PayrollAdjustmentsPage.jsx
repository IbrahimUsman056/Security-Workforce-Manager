import { useState } from 'react';
import { useGetUsersQuery } from '../users/usersApi';
import { useGetAdjustmentsQuery, useCreateAdjustmentMutation, useDeleteAdjustmentMutation } from './payrollAdjustmentsApi';

export default function PayrollAdjustmentsPage() {
  const { data: users } = useGetUsersQuery();
  const { data: adjustments, isLoading } = useGetAdjustmentsQuery();
  const [createAdjustment] = useCreateAdjustmentMutation();
  const [deleteAdjustment] = useDeleteAdjustmentMutation();

  const [form, setForm] = useState({
    user_id: '', type: 'BONUS', label: '', amount: '', period_start: '', period_end: '',
  });

  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createAdjustment({
      ...form,
      user_id: parseInt(form.user_id),
      amount: parseFloat(form.amount),
    });
    setForm({ user_id: '', type: 'BONUS', label: '', amount: '', period_start: '', period_end: '' });
  };

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

  // Helper function to resolve staff user name by user_id
  const getUserName = (userId) => {
    const foundUser = users?.find((u) => u.id === userId);
    return foundUser ? foundUser.name : `User #${userId}`;
  };

  // Filter adjustments based on search input
  const filteredAdjustments = adjustments?.filter((a) => {
    const userName = getUserName(a.user_id).toLowerCase();
    const label = (a.label || '').toLowerCase();
    const type = (a.type || '').toLowerCase();
    const amount = String(a.amount);
    const q = searchQuery.toLowerCase().trim();

    return userName.includes(q) || label.includes(q) || type.includes(q) || amount.includes(q);
  });

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

      {/* Header Section */}
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
          Payroll Adjustments
        </h2>
        <p style={{
          margin: '4px 0 0 0',
          fontSize: '14px',
          color: theme.textMuted
        }}>
          Manage staff bonuses, deductions, and custom payroll entries
        </p>
      </div>

      {/* Form Card Container */}
      <div style={{
        backgroundColor: theme.cardBg,
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        boxSizing: 'border-box',
        width: '100%'
      }}>
        <form onSubmit={handleSubmit}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'flex-end',
            width: '100%'
          }}>
            <div style={{ flex: '1 1 180px', minWidth: '150px' }}>
              <label htmlFor="adj-user" style={labelStyle}>Staff</label>
              <select
                id="adj-user"
                value={form.user_id}
                onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                required
                style={inputStyle}
              >
                <option value="">Select staff</option>
                {users?.filter((u) => u.role === 'STAFF').map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: '0 1 130px', minWidth: '120px' }}>
              <label htmlFor="adj-type" style={labelStyle}>Type</label>
              <select
                id="adj-type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                style={inputStyle}
              >
                <option value="BONUS">BONUS</option>
                <option value="DEDUCTION">DEDUCTION</option>
              </select>
            </div>

            <div style={{ flex: '2 1 200px', minWidth: '160px' }}>
              <label htmlFor="adj-label" style={labelStyle}>Label</label>
              <input
                id="adj-label"
                placeholder="e.g. Performance bonus"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ flex: '1 1 130px', minWidth: '120px' }}>
              <label htmlFor="adj-amount" style={labelStyle}>Amount (PKR)</label>
              <input
                id="adj-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ flex: '1 1 140px', minWidth: '130px' }}>
              <label htmlFor="adj-period-start" style={labelStyle}>Period From</label>
              <input
                id="adj-period-start"
                type="date"
                value={form.period_start}
                onChange={(e) => setForm({ ...form, period_start: e.target.value })}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ flex: '1 1 140px', minWidth: '130px' }}>
              <label htmlFor="adj-period-end" style={labelStyle}>Period To</label>
              <input
                id="adj-period-end"
                type="date"
                value={form.period_end}
                onChange={(e) => setForm({ ...form, period_end: e.target.value })}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ flex: '0 0 auto' }}>
              <button
                type="submit"
                style={{
                  padding: '7px 16px',
                  backgroundColor: theme.primary,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  whiteSpace: 'nowrap',
                  height: '32px'
                }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = theme.primaryHover; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = theme.primary; }}
              >
                Add Adjustment
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Adjustments Table Card Container */}
      <div style={{
        backgroundColor: '#ffffff',
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        width: '100%'
      }}>
        {/* Table Toolbar / Search Header */}
        <div style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${theme.border}`,
          backgroundColor: theme.cardBg,
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: theme.textMuted }}>
            {filteredAdjustments ? `${filteredAdjustments.length} Record(s) Found` : 'Adjustments List'}
          </span>
          <div style={{ position: 'relative', minWidth: '240px', flex: '0 1 300px' }}>
            <input
              type="text"
              placeholder="Search by staff, label, type, amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                ...inputStyle,
                paddingRight: searchQuery ? '28px' : '10px',
                backgroundColor: '#ffffff',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: theme.textMuted,
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: 0,
                  lineHeight: 1
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div style={{
            padding: '28px',
            textAlign: 'center',
            color: theme.textMuted,
            fontSize: '14px'
          }}>
            Loading adjustments...
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
                  <th style={{ padding: '12px 14px', fontWeight: '600', whiteSpace: 'nowrap' }}>User</th>
                  <th style={{ padding: '12px 14px', fontWeight: '600', whiteSpace: 'nowrap' }}>Type</th>
                  <th style={{ padding: '12px 14px', fontWeight: '600', whiteSpace: 'nowrap' }}>Label</th>
                  <th style={{ padding: '12px 14px', fontWeight: '600', whiteSpace: 'nowrap' }}>Amount</th>
                  <th style={{ padding: '12px 14px', fontWeight: '600', whiteSpace: 'nowrap' }}>Period</th>
                  <th style={{ padding: '12px 14px', fontWeight: '600', whiteSpace: 'nowrap', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdjustments?.length ? (
                  filteredAdjustments.map((a) => (
                    <tr
                      key={a.id}
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
                      <td style={{ padding: '12px 14px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                        {getUserName(a.user_id)}
                      </td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          backgroundColor: a.type === 'BONUS' ? '#f0fdf4' : '#fef2f2',
                          border: `1px solid ${a.type === 'BONUS' ? '#bbf7d0' : '#fecaca'}`,
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700',
                          color: a.type === 'BONUS' ? '#166534' : '#991b1b',
                          letterSpacing: '0.3px'
                        }}>
                          {a.type}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: '500' }}>
                        {a.label}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: '600', fontFamily: 'monospace', fontSize: '13px' }}>
                        Rs. {typeof a.amount === 'number' ? a.amount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : a.amount}
                      </td>
                      <td style={{ padding: '12px 14px', color: theme.textMuted, fontSize: '12.5px', whiteSpace: 'nowrap' }}>
                        {new Date(a.period_start).toLocaleDateString()} → {new Date(a.period_end).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => deleteAdjustment(a.id)}
                          style={{
                            padding: '4px 10px',
                            backgroundColor: 'transparent',
                            color: theme.primary,
                            border: `1px solid ${theme.primary}`,
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = theme.primary;
                            e.currentTarget.style.color = '#ffffff';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = theme.primary;
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
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
                      {searchQuery ? `No adjustments match "${searchQuery}"` : 'No adjustments found.'}
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