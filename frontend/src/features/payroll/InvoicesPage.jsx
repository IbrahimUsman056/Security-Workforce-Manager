import { useState } from 'react';
import { useGetSitesQuery } from '../sites/sitesApi';
import { useGetInvoicesQuery, useCreateInvoiceMutation, useUpdateInvoiceStatusMutation } from './invoicesApi';

export default function InvoicesPage() {
  const { data: sites } = useGetSitesQuery();
  const { data: invoices, isLoading } = useGetInvoicesQuery();
  const [createInvoice, { isLoading: creating }] = useCreateInvoiceMutation();
  const [updateStatus] = useUpdateInvoiceStatusMutation();

  const [form, setForm] = useState({
    site_id: '',
    period_start: '',
    period_end: '',
    contracted_hours: '',
    rate_per_hour: '',
    currency: 'PKR',
  });

  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createInvoice({
      site_id: parseInt(form.site_id),
      period_start: form.period_start,
      period_end: `${form.period_end}T23:59:59`,
      contracted_hours: parseFloat(form.contracted_hours),
      rate_per_hour: parseFloat(form.rate_per_hour),
      currency: form.currency,
    });
    setForm({ site_id: '', period_start: '', period_end: '', contracted_hours: '', rate_per_hour: '', currency: 'PKR' });
  };

  const downloadPdf = (invoiceId) => {
    const token = localStorage.getItem('token');
    fetch(`http://localhost:8000/invoices/${invoiceId}/pdf`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `invoice_${invoiceId}.pdf`;
        link.click();
      });
  };

  // Shared Theme Palette Definitions
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

  // Shared Form Input Style
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

  // Helper function to get site name from ID
  const getSiteName = (siteId) => {
    const found = sites?.find((s) => s.id === siteId);
    return found ? found.name : `Site #${siteId}`;
  };

  // Live filter for search input
  const filteredInvoices = invoices?.filter((inv) => {
    const siteName = getSiteName(inv.site_id).toLowerCase();
    const status = (inv.status || '').toLowerCase();
    const totalAmount = String(inv.total_amount || '');
    const currency = (inv.currency || '').toLowerCase();
    const q = searchQuery.toLowerCase().trim();

    return siteName.includes(q) || status.includes(q) || totalAmount.includes(q) || currency.includes(q);
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
      {/* Custom Scrollbar Styles */}
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
          Invoices
        </h2>
        <p style={{
          margin: '4px 0 0 0',
          fontSize: '14px',
          color: theme.textMuted
        }}>
          Generate, track, and manage client site billing invoices
        </p>
      </div>

      {/* Creation Form Container */}
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
              <label htmlFor="inv-site" style={labelStyle}>Site</label>
              <select
                id="inv-site"
                value={form.site_id}
                onChange={(e) => setForm({ ...form, site_id: e.target.value })}
                required
                style={inputStyle}
              >
                <option value="">Select site</option>
                {sites?.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: '1 1 140px', minWidth: '130px' }}>
              <label htmlFor="inv-period-start" style={labelStyle}>Period From</label>
              <input
                id="inv-period-start"
                type="date"
                value={form.period_start}
                onChange={(e) => setForm({ ...form, period_start: e.target.value })}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ flex: '1 1 140px', minWidth: '130px' }}>
              <label htmlFor="inv-period-end" style={labelStyle}>Period To</label>
              <input
                id="inv-period-end"
                type="date"
                value={form.period_end}
                onChange={(e) => setForm({ ...form, period_end: e.target.value })}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ flex: '1 1 120px', minWidth: '110px' }}>
              <label htmlFor="inv-hours" style={labelStyle}>Contracted Hours</label>
              <input
                id="inv-hours"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.contracted_hours}
                onChange={(e) => setForm({ ...form, contracted_hours: e.target.value })}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ flex: '1 1 120px', minWidth: '110px' }}>
              <label htmlFor="inv-rate" style={labelStyle}>Rate / Hour</label>
              <input
                id="inv-rate"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.rate_per_hour}
                onChange={(e) => setForm({ ...form, rate_per_hour: e.target.value })}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ flex: '0 1 100px', minWidth: '90px' }}>
              <label htmlFor="inv-currency" style={labelStyle}>Currency</label>
              <input
                id="inv-currency"
                placeholder="PKR"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={{ flex: '0 0 auto' }}>
              <button
                type="submit"
                disabled={creating}
                style={{
                  padding: '7px 16px',
                  backgroundColor: theme.primary,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  opacity: creating ? 0.7 : 1,
                  transition: 'background-color 0.2s ease',
                  whiteSpace: 'nowrap',
                  height: '32px'
                }}
                onMouseOver={(e) => { if (!creating) e.currentTarget.style.backgroundColor = theme.primaryHover; }}
                onMouseOut={(e) => { if (!creating) e.currentTarget.style.backgroundColor = theme.primary; }}
              >
                {creating ? 'Generating...' : 'Generate Invoice'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Table Card Container */}
      <div style={{
        backgroundColor: '#ffffff',
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        width: '100%'
      }}>
        {/* Table Search Header */}
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
            {filteredInvoices ? `${filteredInvoices.length} Invoice(s) Found` : 'Invoices List'}
          </span>
          <div style={{ position: 'relative', minWidth: '240px', flex: '0 1 300px' }}>
            <input
              type="text"
              placeholder="Search by site, status, amount..."
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
            Loading invoices...
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
                  <th style={{ padding: '12px 14px', fontWeight: '600', whiteSpace: 'nowrap' }}>Site</th>
                  <th style={{ padding: '12px 14px', fontWeight: '600', whiteSpace: 'nowrap' }}>Period</th>
                  <th style={{ padding: '12px 14px', fontWeight: '600', whiteSpace: 'nowrap' }}>Contracted</th>
                  <th style={{ padding: '12px 14px', fontWeight: '600', whiteSpace: 'nowrap' }}>Actual</th>
                  <th style={{ padding: '12px 14px', fontWeight: '600', whiteSpace: 'nowrap' }}>Total</th>
                  <th style={{ padding: '12px 14px', fontWeight: '600', whiteSpace: 'nowrap' }}>Status</th>
                  <th style={{ padding: '12px 14px', fontWeight: '600', whiteSpace: 'nowrap', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices?.length ? (
                  filteredInvoices.map((inv) => (
                    <tr
                      key={inv.id}
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
                        {getSiteName(inv.site_id)}
                      </td>
                      <td style={{ padding: '12px 14px', color: theme.textMuted, fontSize: '12.5px', whiteSpace: 'nowrap' }}>
                        {new Date(inv.period_start).toLocaleDateString()} → {new Date(inv.period_end).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        {inv.contracted_hours}h
                      </td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        {inv.actual_hours}h
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: '600', fontFamily: 'monospace', fontSize: '13px', whiteSpace: 'nowrap' }}>
                        {typeof inv.total_amount === 'number' ? inv.total_amount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : inv.total_amount} {inv.currency || 'PKR'}
                      </td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <select
                          value={inv.status}
                          onChange={(e) => updateStatus({ id: inv.id, status: e.target.value })}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '700',
                            border: `1px solid ${inv.status === 'PAID' ? '#bbf7d0' : inv.status === 'SENT' ? '#bfdbfe' : '#e2e8f0'}`,
                            backgroundColor: inv.status === 'PAID' ? '#f0fdf4' : inv.status === 'SENT' ? '#eff6ff' : '#f8fafc',
                            color: inv.status === 'PAID' ? '#166534' : inv.status === 'SENT' ? '#1e40af' : '#475569',
                            outline: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="DRAFT">DRAFT</option>
                          <option value="SENT">SENT</option>
                          <option value="PAID">PAID</option>
                        </select>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => downloadPdf(inv.id)}
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
                          Download PDF
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        padding: '28px',
                        textAlign: 'center',
                        color: theme.textMuted,
                        fontSize: '14px'
                      }}
                    >
                      {searchQuery ? `No invoices match "${searchQuery}"` : 'No invoices found.'}
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