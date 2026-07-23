import { useState } from 'react';
import { useGetUsersQuery } from '../users/usersApi';
import { useGetUserDocumentsQuery } from './documentsApi';
import { formatDateTime } from '../../utils/dateHelpers';

// Shared Corporate Theme Definitions
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

// Shared Styles
const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '6px',
  border: `1px solid ${theme.border}`,
  fontSize: '14px',
  color: theme.textMain,
  backgroundColor: '#ffffff',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  minHeight: '40px',
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

// Fetches and renders the document rows for a single staff member.
function StaffDocRows({ user, search }) {
  const { data: documents, isLoading } = useGetUserDocumentsQuery(user.id);

  if (isLoading) {
    return (
      <tr>
        <td style={{ padding: '12px 14px', fontWeight: '600', whiteSpace: 'nowrap' }}>{user.name}</td>
        <td colSpan="4" style={{ padding: '12px 14px', color: theme.textMuted, fontStyle: 'italic' }}>
          Loading documents...
        </td>
      </tr>
    );
  }

  const filtered = documents?.filter((doc) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      user.name.toLowerCase().includes(q) ||
      doc.document_type.toLowerCase().includes(q) ||
      formatDateTime(doc.uploaded_at).toLowerCase().includes(q) ||
      (doc.expiry_date ? formatDateTime(doc.expiry_date).toLowerCase().includes(q) : false)
    );
  });

  if (!filtered?.length) return null;

  return filtered.map((doc) => (
    <tr
      key={doc.id}
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
      <td style={{ padding: '12px 14px', fontWeight: '600', color: theme.textMain, whiteSpace: 'nowrap' }}>
        {user.name}
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
          {doc.document_type}
        </span>
      </td>
      <td style={{ padding: '12px 14px', color: theme.textMuted, fontSize: '13px', whiteSpace: 'nowrap' }}>
        {formatDateTime(doc.uploaded_at)}
      </td>
      <td style={{ padding: '12px 14px', color: theme.textMuted, fontSize: '13px', whiteSpace: 'nowrap' }}>
        {doc.expiry_date ? formatDateTime(doc.expiry_date) : '-'}
      </td>
      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
        <a
          href={`/${doc.file_url}`}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px 14px',
            backgroundColor: 'transparent',
            color: theme.primary,
            border: `1px solid ${theme.primary}`,
            borderRadius: '5px',
            fontSize: '12px',
            fontWeight: '600',
            textDecoration: 'none',
            transition: 'all 0.15s ease',
            minHeight: '32px',
            boxSizing: 'border-box',
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
          View File
        </a>
      </td>
    </tr>
  ));
}

export default function AdminDocumentsPage() {
  const { data: users, isLoading: usersLoading } = useGetUsersQuery();
  const [search, setSearch] = useState('');

  const staffUsers = users?.filter((u) => u.role === 'STAFF');

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
      {/* Dynamic Scrollbar Styling */}
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
          Staff Documents
        </h2>
        <p
          style={{
            margin: '4px 0 0 0',
            fontSize: '14px',
            color: theme.textMuted,
          }}
        >
          Track and manage staff documents, uploads, and expiration dates
        </p>
      </div>

      {/* Filter / Search Card Section */}
      <div
        className="inline-form"
        style={{
          backgroundColor: theme.cardBg,
          border: `1px solid ${theme.border}`,
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div className="form-field" style={{ width: '100%', maxWidth: '480px' }}>
          <label htmlFor="doc-search" style={labelStyle}>
            Search
          </label>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              id="doc-search"
              type="text"
              placeholder="Search by staff name, type, or date..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                ...inputStyle,
                paddingRight: search ? '32px' : '12px',
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: theme.textMuted,
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Documents Table Section */}
      {usersLoading ? (
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
          Loading staff data...
        </div>
      ) : (
        <div
          className="table-wrap custom-scrollbar"
          style={{
            backgroundColor: '#ffffff',
            border: `1px solid ${theme.border}`,
            borderRadius: '8px',
            overflowX: 'auto',
            maxHeight: '600px',
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
                <th style={{ padding: '12px 14px', fontWeight: '600', whiteSpace: 'nowrap' }}>Staff</th>
                <th style={{ padding: '12px 14px', fontWeight: '600', whiteSpace: 'nowrap' }}>Type</th>
                <th style={{ padding: '12px 14px', fontWeight: '600', whiteSpace: 'nowrap' }}>Uploaded</th>
                <th style={{ padding: '12px 14px', fontWeight: '600', whiteSpace: 'nowrap' }}>Expiry</th>
                <th style={{ padding: '12px 14px', fontWeight: '600', whiteSpace: 'nowrap' }}>File</th>
              </tr>
            </thead>
            <tbody>
              {staffUsers?.length ? (
                staffUsers.map((u) => <StaffDocRows key={u.id} user={u} search={search} />)
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    style={{
                      padding: '28px',
                      textAlign: 'center',
                      color: theme.textMuted,
                      fontSize: '14px',
                    }}
                  >
                    No staff members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Internal CSS Rule Support for legacy compatibility */}
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