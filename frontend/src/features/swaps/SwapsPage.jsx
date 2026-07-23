import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetMyShiftsQuery } from '../assignments/assignmentsApi';
import { useGetUsersQuery } from '../users/usersApi';
import {
  useGetMySwapsQuery,
  useGetAllSwapsQuery,
  useRequestSwapMutation,
  useUpdateSwapStatusMutation,
} from './swapsApi';

export default function SwapsPage() {
  const { user } = useSelector((state) => state.auth);
  const canReview = user?.role === 'ADMIN' || user?.role === 'SUPERVISOR';

  const { data: myShifts } = useGetMyShiftsQuery(undefined, { skip: canReview });
  const { data: users } = useGetUsersQuery(undefined, { skip: !canReview });
  const { data: mySwaps } = useGetMySwapsQuery(undefined, { skip: canReview });
  const { data: allSwaps } = useGetAllSwapsQuery(undefined, { skip: !canReview });
  const [requestSwap, { isLoading: submitting }] = useRequestSwapMutation();
  const [updateStatus] = useUpdateSwapStatusMutation();

  const [form, setForm] = useState({
    shift_assignment_id: '',
    proposed_replacement_id: '',
    reason: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await requestSwap({
      shift_assignment_id: parseInt(form.shift_assignment_id),
      proposed_replacement_id: form.proposed_replacement_id
        ? parseInt(form.proposed_replacement_id)
        : null,
      reason: form.reason,
    });
    setForm({ shift_assignment_id: '', proposed_replacement_id: '', reason: '' });
  };

  const list = canReview ? allSwaps : mySwaps;

  // Color Palette Definitions
  const theme = {
    bg: '#ffffff',
    textMain: '#0f1729',
    textMuted: '#64748b',
    primary: '#991b1b',
    primaryHover: '#7f1d1d',
    border: '#e2e8f0',
    cardBg: '#f8fafc',
    dangerText: '#991b1b',
    dangerBg: '#fef2f2',
    actionSecondaryBg: '#f1f5f9',
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
      {/* Custom Scrollbar Styling */}
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
          Shift Swap Requests
        </h2>
        <p
          style={{
            margin: '4px 0 0 0',
            fontSize: '14px',
            color: theme.textMuted,
          }}
        >
          {canReview
            ? 'Review and manage employee shift exchange requests'
            : 'Trade shifts easily with team members'}
        </p>
      </div>

      {/* Compact & Fluid Request Swap Form Container */}
      {!canReview && (
        <div
          style={{
            backgroundColor: theme.cardBg,
            border: `1px solid ${theme.border}`,
            borderRadius: '8px',
            padding: '14px 16px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            boxSizing: 'border-box',
            width: '100%',
          }}
        >
          <h3
            style={{
              fontSize: '15px',
              fontWeight: '600',
              color: theme.textMain,
              marginTop: 0,
              marginBottom: '10px',
            }}
          >
            Request Shift Swap
          </h3>

          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                alignItems: 'flex-end',
                width: '100%',
              }}
            >
              <div
                style={{
                  flex: '1 1 200px',
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <label htmlFor="swap-shift" style={labelStyle}>
                  Select Shift
                </label>
                <select
                  id="swap-shift"
                  value={form.shift_assignment_id}
                  onChange={(e) =>
                    setForm({ ...form, shift_assignment_id: e.target.value })
                  }
                  required
                  style={inputStyle}
                >
                  <option value="">Select your shift</option>
                  {myShifts?.map((a) => (
                    <option key={a.id} value={a.id}>
                      Assignment #{a.id} (Shift #{a.shift_id})
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  flex: '2 1 260px',
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <label htmlFor="swap-reason" style={labelStyle}>
                  Reason
                </label>
                <input
                  id="swap-reason"
                  placeholder="Reason for swap request..."
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  style={inputStyle}
                />
              </div>

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
                  whiteSpace: 'nowrap',
                  alignSelf: 'flex-end',
                }}
                onMouseOver={(e) => {
                  if (!submitting)
                    e.currentTarget.style.backgroundColor = theme.primaryHover;
                }}
                onMouseOut={(e) => {
                  if (!submitting)
                    e.currentTarget.style.backgroundColor = theme.primary;
                }}
              >
                {submitting ? 'Submitting...' : 'Request Swap'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Swaps Table Card Container with Fluid Containment */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: `1px solid ${theme.border}`,
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          width: '100%',
        }}
      >
        <div
          className="custom-scrollbar"
          style={{
            maxHeight: '480px',
            overflowY: 'auto',
            overflowX: 'auto',
            width: '100%',
            scrollbarWidth: 'thin',
            scrollbarColor: `${theme.scrollbarThumb} ${theme.scrollbarTrack}`,
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '14px',
              color: theme.textMain,
            }}
          >
            <thead
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                backgroundColor: theme.textMain,
              }}
            >
              <tr
                style={{
                  color: '#ffffff',
                  borderBottom: `1px solid ${theme.border}`,
                }}
              >
                <th style={{ padding: '12px 14px', fontWeight: '600', width: '60px' }}>
                  ID
                </th>
                <th style={{ padding: '12px 14px', fontWeight: '600' }}>Assignment</th>
                <th style={{ padding: '12px 14px', fontWeight: '600' }}>Requested By</th>
                <th style={{ padding: '12px 14px', fontWeight: '600' }}>Reason</th>
                <th style={{ padding: '12px 14px', fontWeight: '600' }}>Status</th>
                {canReview && (
                  <th
                    style={{
                      padding: '12px 14px',
                      fontWeight: '600',
                      textAlign: 'right',
                    }}
                  >
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {list?.length ? (
                list.map((swap) => (
                  <tr
                    key={swap.id}
                    style={{
                      borderBottom: `1px solid ${theme.border}`,
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = '#f8fafc')
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = '#ffffff')
                    }
                  >
                    <td style={{ padding: '12px 14px', fontWeight: '600' }}>
                      #{swap.id}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: '500' }}>
                      #{swap.shift_assignment_id}
                    </td>
                    <td style={{ padding: '12px 14px', color: theme.textMuted }}>
                      User #{swap.requested_by}
                    </td>
                    <td
                      style={{
                        padding: '12px 14px',
                        wordBreak: 'break-word',
                        maxWidth: '280px',
                      }}
                    >
                      {swap.reason || '-'}
                    </td>
                    <td
                      style={{
                        padding: '12px 14px',
                        whiteSpace: 'nowrap',
                        fontWeight: '600',
                      }}
                    >
                      {swap.status}
                    </td>
                    {canReview && (
                      <td
                        style={{
                          padding: '12px 14px',
                          textAlign: 'right',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {swap.status === 'PENDING' ? (
                          <div
                            style={{
                              display: 'inline-flex',
                              gap: '6px',
                              justifyContent: 'flex-end',
                            }}
                          >
                            <button
                              onClick={() =>
                                updateStatus({ id: swap.id, status: 'APPROVED' })
                              }
                              style={{
                                padding: '5px 10px',
                                backgroundColor: theme.actionSecondaryBg,
                                color: theme.textMain,
                                border: `1px solid ${theme.border}`,
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseOver={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  theme.border)
                              }
                              onMouseOut={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  theme.actionSecondaryBg)
                              }
                            >
                              Approve
                            </button>

                            <button
                              onClick={() =>
                                updateStatus({ id: swap.id, status: 'REJECTED' })
                              }
                              style={{
                                padding: '5px 10px',
                                backgroundColor: 'transparent',
                                color: theme.dangerText,
                                border: `1px solid ${theme.dangerText}`,
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseOver={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  theme.dangerBg)
                              }
                              onMouseOut={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  'transparent')
                              }
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span
                            style={{
                              fontSize: '12px',
                              color: theme.textMuted,
                              fontStyle: 'italic',
                            }}
                          >
                            Processed
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={canReview ? 6 : 5}
                    style={{
                      padding: '28px',
                      textAlign: 'center',
                      color: theme.textMuted,
                      fontSize: '14px',
                    }}
                  >
                    No swap requests found.
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