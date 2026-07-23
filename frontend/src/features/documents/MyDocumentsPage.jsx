import { useState } from 'react';
import { useGetMyDocumentsQuery, useUploadDocumentMutation, useDeleteDocumentMutation } from './documentsApi';
import { formatDateTime } from '../../utils/dateHelpers';

const DOC_TYPES = ['CNIC', 'LICENSE', 'CONTRACT', 'OTHER'];

export default function MyDocumentsPage() {
  const { data: documents, isLoading } = useGetMyDocumentsQuery();
  const [uploadDocument, { isLoading: uploading }] = useUploadDocumentMutation();
  const [deleteDocument] = useDeleteDocumentMutation();

  const [form, setForm] = useState({ document_type: 'CNIC', expiry_date: '', file: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('document_type', form.document_type);
    if (form.expiry_date) fd.append('expiry_date', form.expiry_date);
    fd.append('file', form.file);
    await uploadDocument(fd);
    setForm({ document_type: 'CNIC', expiry_date: '', file: null });
  };

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    return new Date(`${expiryDate}Z`) <= sevenDaysFromNow;
  };

  if (isLoading) return <p>Loading documents...</p>;

  return (
    <div>
      <h2>My Documents</h2>
      <form onSubmit={handleSubmit} className="inline-form">
        <select value={form.document_type} onChange={(e) => setForm({ ...form, document_type: e.target.value })}>
          {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <label>Expiry (optional): <input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} /></label>
        <input type="file" onChange={(e) => setForm({ ...form, file: e.target.files[0] })} required />
        <button type="submit" disabled={uploading}>Upload</button>
      </form>

      <div className="table-wrap">
      <table>
        <thead>
          <tr><th>Type</th><th>Uploaded</th><th>Expiry</th><th>File</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {documents?.map((doc) => (
            <tr key={doc.id} style={isExpiringSoon(doc.expiry_date) ? { background: '#fef9c3' } : {}}>
              <td>{doc.document_type}</td>
              <td>{formatDateTime(doc.uploaded_at)}</td>
              <td>{doc.expiry_date ? formatDateTime(doc.expiry_date) : '-'} {isExpiringSoon(doc.expiry_date) && '⚠️'}</td>
              <td><a href={`/${doc.file_url}`} target="_blank" rel="noreferrer">View</a></td>
              <td><button onClick={() => deleteDocument(doc.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}