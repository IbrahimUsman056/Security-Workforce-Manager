import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetSitesQuery, useCreateSiteMutation, useDeleteSiteMutation } from './sitesApi';
import { useUpdateSiteMutation } from './sitesApi';
import { useGetUsersQuery } from '../users/usersApi';

export default function SitesPage() {
  const { user } = useSelector((state) => state.auth);
  const { data: sites, isLoading } = useGetSitesQuery();
  const [createSite] = useCreateSiteMutation();
  const [deleteSite] = useDeleteSiteMutation();
  const isAdmin = user?.role === 'ADMIN';

  const [form, setForm] = useState({
    name: '', address: '', lat: '', lng: '', geofence_radius_m: 150, required_staff_count: 1,
  });

  const { data: users } = useGetUsersQuery();
  const [updateSite] = useUpdateSiteMutation();
  const supervisors = users?.filter((u) => u.role === 'SUPERVISOR');

  const handleAssignSupervisor = (siteId, supervisorId) => {
    updateSite({ id: siteId, supervisor_id: supervisorId ? parseInt(supervisorId) : null });
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createSite({
      ...form,
      lat: parseFloat(form.lat),
      lng: parseFloat(form.lng),
      geofence_radius_m: parseInt(form.geofence_radius_m),
      required_staff_count: parseInt(form.required_staff_count),
    });
    setForm({ name: '', address: '', lat: '', lng: '', geofence_radius_m: 150, required_staff_count: 1 });
  };

  // Corporate theme palette
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
        Loading sites...
      </div>
    );
  }

  // Common input field styling
  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: `1px solid ${theme.border}`,
    fontSize: '14px',
    color: theme.textMain,
    backgroundColor: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  };

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
          Site Management
        </h2>
        <p style={{
          margin: '4px 0 0 0',
          fontSize: '14px',
          color: theme.textMuted
        }}>
          Add, update, or remove site locations
        </p>
      </div>

      {/* Admin creation form container */}
      {isAdmin && (
        <div style={{
          backgroundColor: theme.cardBg,
          border: `1px solid ${theme.border}`,
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '32px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: theme.textMain,
            marginTop: 0,
            marginBottom: '16px'
          }}>
            Add New Site
          </h3>

          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            gap: '16px'
          }}>
            <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="site-name" style={{ fontSize: '13px', fontWeight: '600', color: theme.textMain }}>
                Name
              </label>
              <input
                id="site-name"
                name="name"
                placeholder="Site Name"
                value={form.name}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ flex: '2 1 260px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="site-address" style={{ fontSize: '13px', fontWeight: '600', color: theme.textMain }}>
                Address
              </label>
              <input
                id="site-address"
                name="address"
                placeholder="Physical Address"
                value={form.address}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ flex: '1 1 130px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="site-lat" style={{ fontSize: '13px', fontWeight: '600', color: theme.textMain }}>
                Latitude
              </label>
              <input
                id="site-lat"
                name="lat"
                placeholder="e.g. 40.7128"
                value={form.lat}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ flex: '1 1 130px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="site-lng" style={{ fontSize: '13px', fontWeight: '600', color: theme.textMain }}>
                Longitude
              </label>
              <input
                id="site-lng"
                name="lng"
                placeholder="e.g. -74.0060"
                value={form.lng}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ flex: '1 1 130px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="site-radius" style={{ fontSize: '13px', fontWeight: '600', color: theme.textMain }}>
                Geofence (m)
              </label>
              <input
                id="site-radius"
                name="geofence_radius_m"
                placeholder="150"
                value={form.geofence_radius_m}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            <div style={{ flex: '1 1 130px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="site-required" style={{ fontSize: '13px', fontWeight: '600', color: theme.textMain }}>
                Required Staff
              </label>
              <input
                id="site-required"
                name="required_staff_count"
                placeholder="1"
                value={form.required_staff_count}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              style={{
                flex: '0 0 auto',
                height: '42px',
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
              Add Site
            </button>
          </form>
        </div>
      )}

      {/* Sites table wrapper with fixed height (~7-8 rows) and scrollbar */}
      <div style={{
        backgroundColor: '#ffffff',
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div 
          className="custom-scrollbar"
          style={{ 
            maxHeight: '460px', // Shows approximately 7-8 rows before vertical scroll triggers
            overflowY: 'auto', 
            overflowX: 'auto', 
            width: '100%',
            scrollbarWidth: 'thin',
            scrollbarColor: `${theme.scrollbarThumb} ${theme.scrollbarTrack}`
          }}
        >
          <table style={{
            width: '100%',
            minWidth: '700px',
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
                <th style={{ padding: '14px 16px', fontWeight: '600', width: '60px' }}>ID</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Name</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Address</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Radius (m)</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Required</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Supervisor</th>
                {isAdmin && <th style={{ padding: '14px 16px', fontWeight: '600', textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {sites?.map((site, index) => (
                <tr
                  key={site.id}
                  style={{
                    borderBottom: index === sites.length - 1 ? 'none' : `1px solid ${theme.border}`,
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f8fafc'}
                >
                  <td style={{ padding: '14px 16px', fontWeight: '500', color: theme.textMuted }}>
                    #{site.id}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: '600', color: theme.textMain }}>
                    {site.name}
                  </td>
                  <td style={{ padding: '14px 16px', color: theme.textMuted }}>
                    {site.address}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: '#f1f5f9',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}>
                      {site.geofence_radius_m} m
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: '500' }}>
                    {site.required_staff_count}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {isAdmin ? (
                      <select
                        value={site.supervisor_id || ''}
                        onChange={(e) => handleAssignSupervisor(site.id, e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: `1px solid ${theme.border}`,
                          fontSize: '13px',
                          backgroundColor: '#ffffff',
                          color: site.supervisor_id ? theme.textMain : theme.textMuted,
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        <option value="">Unassigned</option>
                        {supervisors?.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span style={{
                        color: site.supervisor_id ? theme.textMain : theme.textMuted,
                        fontStyle: site.supervisor_id ? 'normal' : 'italic'
                      }}>
                        {site.supervisor_id ? `User #${site.supervisor_id}` : 'Unassigned'}
                      </span>
                    )}
                  </td>
                  {isAdmin && (
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => deleteSite(site.id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: 'transparent',
                          color: theme.dangerText,
                          border: `1px solid ${theme.dangerText}`,
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = theme.dangerBg;
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {sites?.length === 0 && (
                <tr>
                  <td
                    colSpan={isAdmin ? 7 : 6}
                    style={{
                      padding: '24px',
                      textAlign: 'center',
                      color: theme.textMuted,
                      fontSize: '14px'
                    }}
                  >
                    No sites found.
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