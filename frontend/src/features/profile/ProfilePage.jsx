import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useGetMyProfileQuery, useUpsertProfileMutation } from './profileApi';
import { useGetMyDocumentsQuery, useUploadDocumentMutation, useDeleteDocumentMutation } from '../documents/documentsApi';
import { formatDateTime } from '../../utils/dateHelpers';
import { 
  UserCircle, 
  ShieldCheck, 
  Award, 
  CreditCard, 
  DollarSign, 
  BadgeCheck, 
  Upload, 
  Trash2, 
  ExternalLink, 
  AlertTriangle, 
  FileText,
  Mail,
  User,
  Save
} from 'lucide-react';

const DOC_TYPES = ['CNIC', 'LICENSE', 'CONTRACT', 'OTHER'];

export default function ProfilePage() {
  const { user } = useSelector((state) => state.auth);
  const isStaff = user?.role === 'STAFF';

  const { data: profile, isLoading: profileLoading } = useGetMyProfileQuery();
  const [upsertProfile, { isLoading: savingProfile }] = useUpsertProfileMutation();

  const { data: documents, isLoading: docsLoading } = useGetMyDocumentsQuery();
  const [uploadDocument, { isLoading: uploadingDoc }] = useUploadDocumentMutation();
  const [deleteDocument] = useDeleteDocumentMutation();

  const [profileForm, setProfileForm] = useState({ employee_code: '', certification_name: '', hourly_rate: '', bank_account_number: '', photo: null });
  useEffect(() => {
    if (profile) {
      setProfileForm((f) => ({
        ...f,
        employee_code: f.employee_code || profile.employee_code || '',
        certification_name: f.certification_name || profile.certification_name || '',
        hourly_rate: f.hourly_rate || profile.hourly_rate || '',
        bank_account_number: f.bank_account_number || profile.bank_account_number || '',
      }));
    }
  }, [profile]);
  
  const [docForm, setDocForm] = useState({ document_type: 'CNIC', expiry_date: '', file: null });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    // Non-staff roles don't have an employee code — send a placeholder so the
    // backend's required field is satisfied without exposing that field in their UI.
    fd.append('employee_code', isStaff ? profileForm.employee_code : (profile?.employee_code || `${user?.role}-${user?.id}`));
    if (isStaff && profileForm.certification_name) fd.append('certification_name', profileForm.certification_name);
    if (isStaff && profileForm.hourly_rate) fd.append('hourly_rate', profileForm.hourly_rate);
    if (isStaff && profileForm.bank_account_number) fd.append('bank_account_number', profileForm.bank_account_number);
    if (profileForm.photo) fd.append('photo', profileForm.photo);
    await upsertProfile(fd);
  };

  const handleDocSubmit = async (e) => {
    e.preventDefault();
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

  if (profileLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', color: '#0f1729', fontWeight: 600 }}>
        Loading profile details...
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '16px', boxSizing: 'border-box' }}>
      
      {/* Header Banner */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f1729', margin: 0, letterSpacing: '-0.02em' }}>
          My Profile
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px', margin: 0 }}>
          Manage your personal credentials, employment details, and verified documents.
        </p>
      </div>

      {/* Corporate Profile Header Card */}
      <div 
        className="section-block" 
        style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '12px', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 4px 6px -1px rgba(15, 23, 41, 0.05)',
          padding: '24px', 
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          {profile?.profile_photo_url ? (
            <img 
              src={profile.profile_photo_url} 
              alt="Profile" 
              className="profile-photo-circle" 
              style={{ width: '88px', height: '88px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #991b1b' }}
            />
          ) : (
            <div 
              className="profile-photo-placeholder"
              style={{ 
                width: '88px', 
                height: '88px', 
                borderRadius: '50%', 
                backgroundColor: '#f1f5f9', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#0f1729',
                border: '3px solid #0f1729'
              }}
            >
              <UserCircle size={48} />
            </div>
          )}

          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.35rem', color: '#0f1729', margin: 0 }}>
                {user?.name || 'User Profile'}
              </h3>
              <span 
                style={{ 
                  backgroundColor: '#991b1b', 
                  color: '#ffffff', 
                  fontSize: '0.75rem', 
                  fontWeight: 700, 
                  padding: '3px 10px', 
                  borderRadius: '9999px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase'
                }}
              >
                {user?.role}
              </span>
            </div>

            <div style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '6px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={14} color="#991b1b" /> {user?.email || 'N/A'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BadgeCheck size={14} color="#0f1729" /> 
                {isStaff ? (profile?.employee_code ? `Code: ${profile.employee_code}` : 'No employee code set') : `ID: ${user?.id}`}
              </span>
            </div>
          </div>
        </div>

        {/* User Details Grid */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '12px', 
            borderTop: '1px solid #f1f5f9', 
            paddingTop: '16px' 
          }}
        >
          <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={14} color="#0f1729" /> Employee Code
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f1729' }}>
              {profile?.employee_code || 'Not Set'}
            </div>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Award size={14} color="#991b1b" /> Certification
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f1729' }}>
              {profile?.certification_name || 'None Listed'}
            </div>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <DollarSign size={14} color="#0f1729" /> Hourly Rate
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f1729' }}>
              {profile?.hourly_rate ? `Rs ${profile.hourly_rate}/hr` : 'N/A'}
            </div>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CreditCard size={14} color="#991b1b" /> Bank Account
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f1729' }}>
              {profile?.bank_account_number || 'Not Configured'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Profile Edit Form Card */}
        <div 
          style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '12px', 
            border: '1px solid #e2e8f0', 
            boxShadow: '0 4px 6px -1px rgba(15, 23, 41, 0.05)',
            padding: '24px' 
          }}
        >
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f1729', marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} color="#991b1b" /> Edit Profile Details
          </h3>

          <form onSubmit={handleProfileSubmit} className="inline-form" style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
            {isStaff ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f1729' }}>Employee Code</label>
                  <input 
                    placeholder="Employee Code" 
                    value={profileForm.employee_code} 
                    onChange={(e) => setProfileForm({ ...profileForm, employee_code: e.target.value })} 
                    required 
                    style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f1729' }}>Certification</label>
                  <input 
                    placeholder="Certification (optional)" 
                    value={profileForm.certification_name} 
                    onChange={(e) => setProfileForm({ ...profileForm, certification_name: e.target.value })} 
                    style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f1729' }}>Hourly Rate (Rs)</label>
                  <input 
                    type="number" 
                    placeholder="Hourly rate (optional)" 
                    value={profileForm.hourly_rate} 
                    onChange={(e) => setProfileForm({ ...profileForm, hourly_rate: e.target.value })} 
                    style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f1729' }}>Bank Account Number</label>
                  <input 
                    placeholder="Bank account number (optional)" 
                    value={profileForm.bank_account_number} 
                    onChange={(e) => setProfileForm({ ...profileForm, bank_account_number: e.target.value })} 
                    style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f1729' }}>
                    Profile photo <span style={{ color: '#64748b', fontWeight: 400 }}>(Face verification)</span>
                  </label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="user" 
                    onChange={(e) => setProfileForm({ ...profileForm, photo: e.target.files[0] })} 
                    required={!profile?.profile_photo_url} 
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f1729' }}>
                  Profile photo
                </label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setProfileForm({ ...profileForm, photo: e.target.files[0] })} 
                  required={!profile?.profile_photo_url} 
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
            )}

            <button 
              type="submit" 
              disabled={savingProfile}
              style={{
                backgroundColor: '#0f1729',
                color: '#ffffff',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: savingProfile ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '8px',
                opacity: savingProfile ? 0.7 : 1,
                boxShadow: '0 2px 4px rgba(15, 23, 41, 0.1)'
              }}
            >
              <Save size={16} color="#ffffff" />
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Documents Management Card */}
        <div 
          style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '12px', 
            border: '1px solid #e2e8f0', 
            boxShadow: '0 4px 6px -1px rgba(15, 23, 41, 0.05)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f1729', marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="#991b1b" /> Upload Document
            </h3>

            {/* Document Upload Form */}
            <form onSubmit={handleDocSubmit} className="inline-form" style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f1729' }}>Type</label>
                  <select 
                    value={docForm.document_type} 
                    onChange={(e) => setDocForm({ ...docForm, document_type: e.target.value })}
                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#ffffff' }}
                  >
                    {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f1729' }}>Expiry (optional)</label>
                  <input 
                    type="date" 
                    value={docForm.expiry_date} 
                    onChange={(e) => setDocForm({ ...docForm, expiry_date: e.target.value })} 
                    style={{ padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f1729' }}>Document File</label>
                <input 
                  type="file" 
                  onChange={(e) => setDocForm({ ...docForm, file: e.target.files[0] })} 
                  required 
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <button 
                type="submit" 
                disabled={uploadingDoc}
                style={{
                  backgroundColor: '#991b1b',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: uploadingDoc ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: '4px',
                  opacity: uploadingDoc ? 0.7 : 1
                }}
              >
                <Upload size={14} />
                {uploadingDoc ? 'Uploading...' : 'Upload Document'}
              </button>
            </form>
          </div>

          {/* Document List Table */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f1729', marginBottom: '12px' }}>
              Uploaded Documents ({documents?.length || 0})
            </h4>

            {docsLoading ? (
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Loading documents...</p>
            ) : (
              <div className="table-wrap" style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0f1729', color: '#ffffff' }}>
                      <th style={{ padding: '10px 12px', fontWeight: 700 }}>Type</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700 }}>Uploaded</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700 }}>Expiry</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700 }}>File</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents?.length ? documents.map((doc) => {
                      const expiring = isExpiringSoon(doc.expiry_date);
                      return (
                        <tr 
                          key={doc.id} 
                          style={{ 
                            borderBottom: '1px solid #f1f5f9',
                            backgroundColor: expiring ? '#fef2f2' : '#ffffff' 
                          }}
                        >
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f1729' }}>
                            {doc.document_type}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#64748b' }}>
                            {formatDateTime(doc.uploaded_at)}
                          </td>
                          <td style={{ padding: '10px 12px', color: expiring ? '#991b1b' : '#64748b', fontWeight: expiring ? 700 : 400 }}>
                            {doc.expiry_date ? formatDateTime(doc.expiry_date) : '-'}
                            {expiring && (
                              <span style={{ marginLeft: '4px', display: 'inline-flex', verticalAlign: 'middle' }}>
                                <AlertTriangle size={14} color="#991b1b" />
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <a 
                              href={doc.file_url} 
                              target="_blank" 
                              rel="noreferrer"
                              style={{ color: '#0f1729', fontWeight: 700, textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              View <ExternalLink size={12} />
                            </a>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                            <button 
                              onClick={() => deleteDocument(doc.id)}
                              style={{
                                backgroundColor: '#fee2e2',
                                color: '#991b1b',
                                border: '1px solid #fecaca',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
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