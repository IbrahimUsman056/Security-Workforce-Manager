import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetMyProfileQuery, useUpsertProfileMutation } from './profileApi';
import { useGetMyDocumentsQuery, useUploadDocumentMutation, useDeleteDocumentMutation } from '../documents/documentsApi';
import { formatDateTime } from '../../utils/dateHelpers';
import { UserCircle } from 'lucide-react';

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

  if (profileLoading) return <p>Loading profile...</p>;

  return (
    <div>
      <h2>My Profile</h2>

      <div className="section-block" style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        {profile?.profile_photo_url ? (
          <img src={profile.profile_photo_url} alt="Profile" className="profile-photo-circle" />
        ) : (
          <div className="profile-photo-placeholder"><UserCircle size={36} /></div>
        )}
        <div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>{user?.name}</div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
            {isStaff
              ? (profile?.employee_code || 'No employee code set')
              : user?.role}
          </div>
        </div>
      </div>

      <h3>Profile Details</h3>
      <form onSubmit={handleProfileSubmit} className="inline-form" style={{ flexDirection: 'column', alignItems: 'flex-start', maxWidth: 420 }}>
        {isStaff ? (
          <>
            <input placeholder="Employee Code" defaultValue={profile?.employee_code} onChange={(e) => setProfileForm({ ...profileForm, employee_code: e.target.value })} required />
            <input placeholder="Certification (optional)" defaultValue={profile?.certification_name} onChange={(e) => setProfileForm({ ...profileForm, certification_name: e.target.value })} />
            <input type="number" placeholder="Hourly rate (optional)" defaultValue={profile?.hourly_rate} onChange={(e) => setProfileForm({ ...profileForm, hourly_rate: e.target.value })} />
            <input placeholder="Bank account number (optional)" defaultValue={profile?.bank_account_number} onChange={(e) => setProfileForm({ ...profileForm, bank_account_number: e.target.value })} />
            <label>
              Profile photo (used for face verification at check-in):
              <input type="file" accept="image/*" capture="user" onChange={(e) => setProfileForm({ ...profileForm, photo: e.target.files[0] })} required={!profile?.profile_photo_url} />
            </label>
          </>
        ) : (
          <label>
            Profile photo:
            <input type="file" accept="image/*" onChange={(e) => setProfileForm({ ...profileForm, photo: e.target.files[0] })} required={!profile?.profile_photo_url} />
          </label>
        )}
        <button type="submit" disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Save Profile'}</button>
      </form>

      <h3>My Documents</h3>
      <form onSubmit={handleDocSubmit} className="inline-form">
        <select value={docForm.document_type} onChange={(e) => setDocForm({ ...docForm, document_type: e.target.value })}>
          {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <label>Expiry (optional): <input type="date" value={docForm.expiry_date} onChange={(e) => setDocForm({ ...docForm, expiry_date: e.target.value })} /></label>
        <input type="file" onChange={(e) => setDocForm({ ...docForm, file: e.target.files[0] })} required />
        <button type="submit" disabled={uploadingDoc}>Upload</button>
      </form>

      {docsLoading ? <p>Loading documents...</p> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Type</th><th>Uploaded</th><th>Expiry</th><th>File</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {documents?.length ? documents.map((doc) => (
                <tr key={doc.id} style={isExpiringSoon(doc.expiry_date) ? { background: '#fef9c3' } : {}}>
                  <td>{doc.document_type}</td>
                  <td>{formatDateTime(doc.uploaded_at)}</td>
                  <td>{doc.expiry_date ? formatDateTime(doc.expiry_date) : '-'} {isExpiringSoon(doc.expiry_date) && '⚠️'}</td>
                  <td><a href={doc.file_url} target="_blank" rel="noreferrer">View</a></td>
                  <td><button onClick={() => deleteDocument(doc.id)}>Delete</button></td>
                </tr>
              )) : <tr><td colSpan="5">No documents uploaded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}