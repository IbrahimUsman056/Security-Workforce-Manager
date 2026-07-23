import { useState, useEffect } from 'react';
import { useGetMyProfileQuery, useUpsertProfileMutation } from './profileApi';
import {
  useGetMyDocumentsQuery,
  useUploadDocumentMutation,
  useDeleteDocumentMutation,
} from '../documents/documentsApi';
import { formatDateTime } from '../../utils/dateHelpers';
import { UserCircle, Upload, Trash2, FileText, AlertTriangle } from 'lucide-react';

const DOC_TYPES = ['CNIC', 'LICENSE', 'CONTRACT', 'OTHER'];

export default function ProfilePage() {
  const { data: profile, isLoading: profileLoading } = useGetMyProfileQuery();
  const [upsertProfile, { isLoading: savingProfile }] = useUpsertProfileMutation();

  const { data: documents, isLoading: docsLoading } = useGetMyDocumentsQuery();
  const [uploadDocument, { isLoading: uploadingDoc }] = useUploadDocumentMutation();
  const [deleteDocument] = useDeleteDocumentMutation();

  const [profileForm, setProfileForm] = useState({
    employee_code: '',
    certification_name: '',
    hourly_rate: '',
    bank_account_number: '',
    photo: null,
  });

  const [docForm, setDocForm] = useState({
    document_type: 'CNIC',
    expiry_date: '',
    file: null,
  });

  // Sync profile data into form state when loaded
  useEffect(() => {
    if (profile) {
      setProfileForm({
        employee_code: profile.employee_code || '',
        certification_name: profile.certification_name || '',
        hourly_rate: profile.hourly_rate || '',
        bank_account_number: profile.bank_account_number || '',
        photo: null,
      });
    }
  }, [profile]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('employee_code', profileForm.employee_code);
    if (profileForm.certification_name)
      fd.append('certification_name', profileForm.certification_name);
    if (profileForm.hourly_rate)
      fd.append('hourly_rate', profileForm.hourly_rate);
    if (profileForm.bank_account_number)
      fd.append('bank_account_number', profileForm.bank_account_number);
    if (profileForm.photo) fd.append('photo', profileForm.photo);

    await upsertProfile(fd);
  };

  const handleDocSubmit = async (e) => {
    e.preventDefault();
    if (!docForm.file) return;

    const fd = new FormData();
    fd.append('document_type', docForm.document_type);
    if (docForm.expiry_date) fd.append('expiry_date', docForm.expiry_date);
    fd.append('file', docForm.file);

    await uploadDocument(fd);
    setDocForm({ document_type: 'CNIC', expiry_date: '', file: null });
  };

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    return new Date(`${expiryDate}Z`) <= sevenDaysFromNow;
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
    dangerText: '#991b1b',
    dangerBg: '#fef2f2',
    warningBg: '#fef9c3',
    warningText: '#854d0e',
    scrollbarThumb: '#cbd5e1',
    scrollbarTrack: '#f1f5f9',
  };

  if (profileLoading) {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          color: theme.textMuted,
          fontSize: '14px',
        }}
      >
        Loading profile...
      </div>
    );
  }

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
        
        .profile-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        
        @media (min-width: 900px) {
          .profile-grid {
            grid-template-columns: 380px 1fr;
          }
        }
        
        .input-control {
          width: 100%;
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid ${theme.border};
          font-size: 13px;
          color: ${theme.textMain};
          background-color: #ffffff;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s ease;
        }
        .input-control:focus {
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
          My Profile
        </h2>
        <p
          style={{
            margin: '4px 0 0 0',
            fontSize: '14px',
            color: theme.textMuted,
          }}
        >
          Manage your personal details and compliance documents
        </p>
      </div>

      {/* Main Content Layout */}
      <div className="profile-grid">
        {/* Left Column: Summary Card & Profile Details Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Identity Header Card */}
          <div
            style={{
              backgroundColor: theme.cardBg,
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            {profile?.profile_photo_url ? (
              <img
                src={`/${profile.profile_photo_url}`}
                alt="Profile"
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: `2px solid ${theme.primary}`,
                }}
              />
            ) : (
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: theme.textMuted,
                }}
              >
                <UserCircle size={44} />
              </div>
            )}
            <div>
              <div
                style={{
                  fontWeight: '700',
                  fontSize: '16px',
                  color: theme.textMain,
                }}
              >
                {profile?.employee_code
                  ? `Emp ID: ${profile.employee_code}`
                  : 'No employee code set'}
              </div>
              <div
                style={{
                  color: theme.textMuted,
                  fontSize: '13px',
                  marginTop: '2px',
                }}
              >
                {profile?.certification_name || 'No certification on file'}
              </div>
            </div>
          </div>

          {/* Profile Form Card */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <h3
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: theme.textMain,
                marginTop: 0,
                marginBottom: '16px',
                borderBottom: `1px solid ${theme.border}`,
                paddingBottom: '8px',
              }}
            >
              Update Profile Details
            </h3>

            <form
              onSubmit={handleProfileSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              <div>
                <label
                  htmlFor="profile-employee-code"
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    marginBottom: '4px',
                  }}
                >
                  Employee Code *
                </label>
                <input
                  id="profile-employee-code"
                  className="input-control"
                  placeholder="e.g. EMP-102"
                  value={profileForm.employee_code}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      employee_code: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="profile-certification"
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    marginBottom: '4px',
                  }}
                >
                  Certification (optional)
                </label>
                <input
                  id="profile-certification"
                  className="input-control"
                  placeholder="e.g. Basic First Aid"
                  value={profileForm.certification_name}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      certification_name: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="profile-hourly-rate"
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    marginBottom: '4px',
                  }}
                >
                  Hourly Rate (optional)
                </label>
                <input
                  id="profile-hourly-rate"
                  type="number"
                  step="0.01"
                  className="input-control"
                  placeholder="0.00"
                  value={profileForm.hourly_rate}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      hourly_rate: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="profile-bank-account"
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    marginBottom: '4px',
                  }}
                >
                  Bank Account Number (optional)
                </label>
                <input
                  id="profile-bank-account"
                  className="input-control"
                  placeholder="Account / IBAN"
                  value={profileForm.bank_account_number}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      bank_account_number: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="profile-photo"
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    marginBottom: '4px',
                  }}
                >
                  Profile Photo{' '}
                  <span
                    style={{
                      fontWeight: 'normal',
                      color: theme.textMuted,
                      fontSize: '11px',
                    }}
                  >
                    (used for face check-in)
                  </span>
                </label>
                <input
                  id="profile-photo"
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="input-control"
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      photo: e.target.files[0],
                    })
                  }
                  required={!profile?.profile_photo_url}
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                style={{
                  marginTop: '6px',
                  height: '36px',
                  backgroundColor: theme.primary,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: savingProfile ? 'not-allowed' : 'pointer',
                  opacity: savingProfile ? 0.7 : 1,
                  transition: 'background-color 0.2s ease',
                }}
                onMouseOver={(e) => {
                  if (!savingProfile)
                    e.currentTarget.style.backgroundColor = theme.primaryHover;
                }}
                onMouseOut={(e) => {
                  if (!savingProfile)
                    e.currentTarget.style.backgroundColor = theme.primary;
                }}
              >
                {savingProfile ? 'Saving Changes...' : 'Save Profile'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Documents Upload & Management */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Upload Document Card */}
          <div
            style={{
              backgroundColor: theme.cardBg,
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              padding: '16px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <h3
              style={{
                fontSize: '15px',
                fontWeight: '600',
                color: theme.textMain,
                marginTop: 0,
                marginBottom: '12px',
              }}
            >
              Upload New Document
            </h3>

            <form
              onSubmit={handleDocSubmit}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                alignItems: 'end',
              }}
            >
              <div>
                <label
                  htmlFor="doc-type"
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    marginBottom: '4px',
                  }}
                >
                  Document Type
                </label>
                <select
                  id="doc-type"
                  value={docForm.document_type}
                  onChange={(e) =>
                    setDocForm({ ...docForm, document_type: e.target.value })
                  }
                  className="input-control"
                >
                  {DOC_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="doc-expiry"
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    marginBottom: '4px',
                  }}
                >
                  Expiry Date (optional)
                </label>
                <input
                  id="doc-expiry"
                  type="date"
                  value={docForm.expiry_date}
                  onChange={(e) =>
                    setDocForm({ ...docForm, expiry_date: e.target.value })
                  }
                  className="input-control"
                />
              </div>

              <div>
                <label
                  htmlFor="doc-file"
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    marginBottom: '4px',
                  }}
                >
                  File
                </label>
                <input
                  id="doc-file"
                  type="file"
                  onChange={(e) =>
                    setDocForm({ ...docForm, file: e.target.files[0] })
                  }
                  required
                  className="input-control"
                />
              </div>

              <button
                type="submit"
                disabled={uploadingDoc}
                style={{
                  height: '35px',
                  backgroundColor: theme.primary,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: uploadingDoc ? 'not-allowed' : 'pointer',
                  opacity: uploadingDoc ? 0.7 : 1,
                  transition: 'background-color 0.2s ease',
                }}
                onMouseOver={(e) => {
                  if (!uploadingDoc)
                    e.currentTarget.style.backgroundColor = theme.primaryHover;
                }}
                onMouseOut={(e) => {
                  if (!uploadingDoc)
                    e.currentTarget.style.backgroundColor = theme.primary;
                }}
              >
                <Upload size={14} />
                {uploadingDoc ? 'Uploading...' : 'Upload'}
              </button>
            </form>
          </div>

          {/* Documents Table Container */}
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
                padding: '14px 18px',
                borderBottom: `1px solid ${theme.border}`,
                backgroundColor: '#ffffff',
              }}
            >
              <h3
                style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  margin: 0,
                  color: theme.textMain,
                }}
              >
                My Documents
              </h3>
            </div>

            {docsLoading ? (
              <div
                style={{
                  padding: '24px',
                  textAlign: 'center',
                  color: theme.textMuted,
                  fontSize: '13px',
                }}
              >
                Loading documents...
              </div>
            ) : (
              <div
                className="custom-scrollbar"
                style={{
                  maxHeight: '440px',
                  overflowY: 'auto',
                  overflowX: 'auto',
                }}
              >
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    textAlign: 'left',
                    fontSize: '13px',
                  }}
                >
                  <thead
                    style={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                      backgroundColor: theme.textMain,
                      color: '#ffffff',
                    }}
                  >
                    <tr>
                      <th style={{ padding: '10px 14px', fontWeight: '600' }}>
                        Type
                      </th>
                      <th style={{ padding: '10px 14px', fontWeight: '600' }}>
                        Uploaded
                      </th>
                      <th style={{ padding: '10px 14px', fontWeight: '600' }}>
                        Expiry
                      </th>
                      <th style={{ padding: '10px 14px', fontWeight: '600' }}>
                        File
                      </th>
                      <th
                        style={{
                          padding: '10px 14px',
                          fontWeight: '600',
                          textAlign: 'right',
                        }}
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents?.length ? (
                      documents.map((doc) => {
                        const expiring = isExpiringSoon(doc.expiry_date);
                        return (
                          <tr
                            key={doc.id}
                            style={{
                              borderBottom: `1px solid ${theme.border}`,
                              backgroundColor: expiring
                                ? theme.warningBg
                                : 'transparent',
                              transition: 'background-color 0.15s ease',
                            }}
                          >
                            <td
                              style={{
                                padding: '10px 14px',
                                fontWeight: '600',
                              }}
                            >
                              {doc.document_type}
                            </td>
                            <td
                              style={{
                                padding: '10px 14px',
                                color: theme.textMuted,
                              }}
                            >
                              {formatDateTime(doc.uploaded_at)}
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              {doc.expiry_date ? (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontWeight: expiring ? '600' : 'normal',
                                    color: expiring
                                      ? theme.warningText
                                      : theme.textMain,
                                  }}
                                >
                                  {formatDateTime(doc.expiry_date)}
                                  {expiring && <AlertTriangle size={14} />}
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <a
                                href={`/${doc.file_url}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  color: theme.primary,
                                  textDecoration: 'none',
                                  fontWeight: '500',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <FileText size={14} /> View
                              </a>
                            </td>
                            <td
                              style={{
                                padding: '10px 14px',
                                textAlign: 'right',
                              }}
                            >
                              <button
                                onClick={() => deleteDocument(doc.id)}
                                title="Delete document"
                                style={{
                                  padding: '4px 8px',
                                  backgroundColor: 'transparent',
                                  color: theme.dangerText,
                                  border: `1px solid ${theme.dangerText}`,
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
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
                                <Trash2 size={13} /> Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          style={{
                            padding: '24px',
                            textAlign: 'center',
                            color: theme.textMuted,
                          }}
                        >
                          No documents uploaded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}