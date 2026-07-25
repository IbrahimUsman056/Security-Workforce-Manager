import { useState, useEffect, useCallback } from 'react';
import { useGetUsersQuery } from '../users/usersApi';
import { useGetSitesQuery } from '../sites/sitesApi';
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
  scrollbarThumb: '#cbd5e1',
  scrollbarTrack: '#f1f5f9',
};

// Reusable Input & Label Styles
const inputStyle = {
  width: '100%',
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

export default function ManageClientAccessPage() {
  const { data: users } = useGetUsersQuery();
  const { data: sites } = useGetSitesQuery();

  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [accessList, setAccessList] = useState([]);
  const [loadingAccess, setLoadingAccess] = useState(false);

  const clientUsers = users?.filter((u) => u.role === 'CLIENT');

  // Builds a name/site lookup so the access table can show readable
  // names instead of raw ids.
  const clientName = (id) => users?.find((u) => u.id === id)?.name || `User #${id}`;
  const clientEmail = (id) => users?.find((u) => u.id === id)?.email || '';
  const siteName = (id) => sites?.find((s) => s.id === id)?.name || `Site #${id}`;

  const fetchAccessList = useCallback(async () => {
    setLoadingAccess(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/users/client-site-access/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAccessList(data);
      }
    } catch {
      // silently ignore; table will just stay empty if endpoint unavailable
    }
    setLoadingAccess(false);
  }, []);

  useEffect(() => {
    fetchAccessList();
  }, [fetchAccessList]);

  const handleGrant = async () => {
    if (!selectedClientId || !selectedSiteId) return;
    const token = localStorage.getItem('token');
    const res = await fetch(
      `${API_BASE_URL}/users/${selectedClientId}/grant-site-access?site_id=${selectedSiteId}`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    setStatusMsg(res.ok ? 'Access granted successfully' : data.detail || 'Failed to grant access');
    if (res.ok) fetchAccessList();
  };

  const handleRevoke = async (clientId, siteId) => {
    const token = localStorage.getItem('token');
    const res = await fetch(
      `${API_BASE_URL}/users/${clientId}/revoke-site-access?site_id=${siteId}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json().catch(() => ({}));
    setStatusMsg(res.ok ? 'Access removed successfully' : data.detail || 'Failed to remove access');
    if (res.ok) fetchAccessList();
  };

  const isSuccessMsg = statusMsg.toLowerCase().includes('successfully');

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
      {/* Scrollbar Customization */}
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
          Manage Client Site Access
        </h2>
        <p
          style={{
            margin: '4px 0 0 0',
            fontSize: '14px',
            color: theme.textMuted,
          }}
        >
          Control which sites each client account can view and access
        </p>
      </div>

      {/* Alert Status Banner */}
      {statusMsg && (
        <p
          className="card"
          style={{
            padding: '12px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '16px',
            backgroundColor: isSuccessMsg ? '#f0fdf4' : '#fef2f2',
            color: isSuccessMsg ? '#166534' : theme.primary,
            border: `1px solid ${isSuccessMsg ? '#bbf7d0' : '#fecaca'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{statusMsg}</span>
          <button
            type="button"
            onClick={() => setStatusMsg('')}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '14px',
            }}
          >
            ✕
          </button>
        </p>
      )}

      {/* Grant Access Form Box */}
      <div
        style={{
          backgroundColor: theme.cardBg,
          border: `1px solid ${theme.border}`,
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        <div
          className="inline-form"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'flex-end',
            width: '100%',
          }}
        >
          {/* Client Account Select */}
          <div className="form-field" style={{ flex: '1 1 240px', minWidth: '200px' }}>
            <label htmlFor="access-client" style={labelStyle}>
              Client Account
            </label>
            <select
              id="access-client"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              style={inputStyle}
            >
              <option value="">Select client account</option>
              {clientUsers?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          {/* Site Select */}
          <div className="form-field" style={{ flex: '1 1 200px', minWidth: '180px' }}>
            <label htmlFor="access-site" style={labelStyle}>
              Site
            </label>
            <select
              id="access-site"
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              style={inputStyle}
            >
              <option value="">Select site</option>
              {sites?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Grant Action Button */}
          <div style={{ flex: '0 0 auto' }}>
            <button
              onClick={handleGrant}
              style={{
                padding: '0 20px',
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
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = theme.primaryHover;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = theme.primary;
              }}
            >
              Grant Access
            </button>
          </div>
        </div>
      </div>

      {/* Helpful Admin Note Card */}
      <div
        style={{
          padding: '10px 14px',
          backgroundColor: '#ffffff',
          border: `1px solid ${theme.border}`,
          borderRadius: '6px',
          marginBottom: '24px',
          fontSize: '12px',
          color: theme.textMuted,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span style={{ fontSize: '14px' }}>ℹ️</span>
        <span>
          <strong>Note:</strong> Create a CLIENT-role account first via "Create Privileged User" in Swagger, then link them to a site here.
        </span>
      </div>

      {/* Access Records Table Header */}
      <h3
        style={{
          fontSize: '18px',
          fontWeight: '700',
          color: theme.textMain,
          margin: '0 0 12px 0',
        }}
      >
        Current Client Site Access
      </h3>

      {/* Access Records Table Container */}
      {loadingAccess ? (
        <div
          style={{
            padding: '32px',
            textAlign: 'center',
            backgroundColor: theme.cardBg,
            borderRadius: '8px',
            border: `1px solid ${theme.border}`,
            color: theme.textMuted,
            fontSize: '14px',
          }}
        >
          Loading access records...
        </div>
      ) : (
        <div
          className="table-wrap custom-scrollbar"
          style={{
            backgroundColor: '#ffffff',
            border: `1px solid ${theme.border}`,
            borderRadius: '8px',
            overflowX: 'auto',
            maxHeight: '500px',
            overflowY: 'auto',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            width: '100%',
          }}
        >
          <table
            style={{
              width: '100%',
              minWidth: '650px',
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
              <tr style={{ color: '#ffffff' }}>
                <th style={{ padding: '12px 14px', fontWeight: '600', whiteSpace: 'nowrap' }}>Client</th>
                <th style={{ padding: '12px 14px', fontWeight: '600', whiteSpace: 'nowrap' }}>Email</th>
                <th style={{ padding: '12px 14px', fontWeight: '600', whiteSpace: 'nowrap' }}>Site</th>
                <th style={{ padding: '12px 14px', fontWeight: '600', whiteSpace: 'nowrap', textAlign: 'right' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {accessList.length ? (
                accessList.map((a) => (
                  <tr
                    key={`${a.client_id}-${a.site_id}`}
                    style={{
                      borderBottom: `1px solid ${theme.border}`,
                      backgroundColor: '#ffffff',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                    }}
                  >
                    <td style={{ padding: '12px 14px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                      {clientName(a.client_id)}
                    </td>
                    <td style={{ padding: '12px 14px', color: theme.textMuted, fontSize: '13px', whiteSpace: 'nowrap' }}>
                      {clientEmail(a.client_id)}
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          backgroundColor: '#f1f5f9',
                          border: `1px solid ${theme.border}`,
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: theme.textMain,
                        }}
                      >
                        {siteName(a.site_id)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => handleRevoke(a.client_id, a.site_id)}
                        style={{
                          padding: '4px 10px',
                          backgroundColor: 'transparent',
                          color: theme.primary,
                          border: `1px solid ${theme.primary}`,
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
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
                        Remove Access
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    style={{
                      padding: '28px',
                      textAlign: 'center',
                      color: theme.textMuted,
                      fontSize: '14px',
                    }}
                  >
                    No client site access records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Inline Fallback Styling */}
      <style>{`
        .form-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
      `}</style>
    </div>
  );
}