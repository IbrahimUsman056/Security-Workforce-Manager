import { useState } from 'react';
import { useGetSitesQuery } from '../sites/sitesApi';
import {
  useGetTemplatesQuery,
  useCreateTemplateMutation,
  useGenerateShiftsMutation,
  useDeleteTemplateMutation,
} from './templatesApi';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export default function TemplatesPage() {
  const { data: sites } = useGetSitesQuery();
  const { data: templates, isLoading } = useGetTemplatesQuery();
  const [createTemplate] = useCreateTemplateMutation();
  const [generateShifts] = useGenerateShiftsMutation();
  const [deleteTemplate] = useDeleteTemplateMutation();
  const [rowErrors, setRowErrors] = useState({}); // { [templateId]: message }

  const handleGenerate = async (id) => {
    try {
      const res = await generateShifts(id).unwrap();
      setRowErrors((prev) => ({ ...prev, [id]: { type: 'success', msg: res.detail } }));
    } catch (err) {
      setRowErrors((prev) => ({ ...prev, [id]: { type: 'error', msg: err?.data?.detail || 'Failed to generate shifts' } }));
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await deleteTemplate(id).unwrap();
      setRowErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      setRowErrors((prev) => ({ ...prev, [id]: { type: 'error', msg: err?.data?.detail || 'Failed to deactivate template' } }));
    }
  };

  const [form, setForm] = useState({
    site_id: '',
    name: '',
    start_time_of_day: '09:00',
    end_time_of_day: '17:00',
    required_count: 1,
    days_of_week: [],
    start_date: '',
    end_date: '',
  });

  const toggleDay = (day) => {
    setForm((f) => ({
      ...f,
      days_of_week: f.days_of_week.includes(day)
        ? f.days_of_week.filter((d) => d !== day)
        : [...f.days_of_week, day],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createTemplate({
      ...form,
      site_id: parseInt(form.site_id),
      required_count: parseInt(form.required_count),
      days_of_week: form.days_of_week.join(','),
    });
    setForm({
      site_id: '',
      name: '',
      start_time_of_day: '09:00',
      end_time_of_day: '17:00',
      required_count: 1,
      days_of_week: [],
      start_date: '',
      end_date: '',
    });
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
        Loading templates...
      </div>
    );
  }

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

      {/* Header section */}
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
          Shift Templates
        </h2>
        <p style={{
          margin: '4px 0 0 0',
          fontSize: '14px',
          color: theme.textMuted
        }}>
          Set up repeating schedules and create shifts in bulk
        </p>
      </div>

      {/* Fully Fluid Template Creation Form Container */}
      <div style={{
        backgroundColor: theme.cardBg,
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        padding: '14px 16px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        boxSizing: 'border-box',
        width: '100%'
      }}>
        <h3 style={{
          fontSize: '15px',
          fontWeight: '600',
          color: theme.textMain,
          marginTop: 0,
          marginBottom: '10px'
        }}>
          Create Shift Template
        </h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            width: '100%'
          }}>
            <div style={{ flex: '1 1 140px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <label htmlFor="tpl-site" style={labelStyle}>Site</label>
              <select
                id="tpl-site"
                value={form.site_id}
                onChange={(e) => setForm({ ...form, site_id: e.target.value })}
                required
                style={inputStyle}
              >
                <option value="">Select site</option>
                {sites?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div style={{ flex: '1 1 150px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <label htmlFor="tpl-name" style={labelStyle}>Template Name</label>
              <input
                id="tpl-name"
                placeholder="e.g. Night Guard"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ flex: '1 1 100px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <label htmlFor="tpl-start-time" style={labelStyle}>Start Time</label>
              <input
                id="tpl-start-time"
                type="time"
                value={form.start_time_of_day}
                onChange={(e) => setForm({ ...form, start_time_of_day: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={{ flex: '1 1 100px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <label htmlFor="tpl-end-time" style={labelStyle}>End Time</label>
              <input
                id="tpl-end-time"
                type="time"
                value={form.end_time_of_day}
                onChange={(e) => setForm({ ...form, end_time_of_day: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={{ flex: '1 1 80px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <label htmlFor="tpl-required" style={labelStyle}>Required</label>
              <input
                id="tpl-required"
                type="number"
                min="1"
                value={form.required_count}
                onChange={(e) => setForm({ ...form, required_count: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={{ flex: '1 1 120px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <label htmlFor="tpl-start-date" style={labelStyle}>From</label>
              <input
                id="tpl-start-date"
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ flex: '1 1 120px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <label htmlFor="tpl-end-date" style={labelStyle}>To</label>
              <input
                id="tpl-end-date"
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                required
                style={inputStyle}
              />
            </div>
          </div>

          {/* Days Selection Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', width: '100%' }}>
            <span style={{ ...labelStyle, marginBottom: 0 }}>Days:</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {DAYS.map((day) => {
                const isSelected = form.days_of_week.includes(day);
                return (
                  <label
                    key={day}
                    htmlFor={`tpl-day-${day}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: isSelected ? theme.primary : '#ffffff',
                      color: isSelected ? '#ffffff' : theme.textMain,
                      border: `1px solid ${isSelected ? theme.primary : theme.border}`,
                      fontSize: '11.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      userSelect: 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <input
                      id={`tpl-day-${day}`}
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleDay(day)}
                      style={{ display: 'none' }}
                    />
                    {day}
                  </label>
                );
              })}
            </div>

            <button
              type="submit"
              style={{
                marginLeft: 'auto',
                height: '34px',
                padding: '0 18px',
                backgroundColor: theme.primary,
                color: '#ffffff',
                border: 'none',
                borderRadius: '5px',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme.primaryHover}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = theme.primary}
            >
              Create Template
            </button>
          </div>
        </form>
      </div>

      {/* Templates Table Card Container with Fluid Containment */}
      <div style={{
        backgroundColor: '#ffffff',
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        width: '100%'
      }}>
        <div 
          className="custom-scrollbar"
          style={{ 
            maxHeight: '460px',
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
                <th style={{ padding: '12px 14px', fontWeight: '600', textAlign: 'center'  }}>Name</th>
                <th style={{ padding: '12px 14px', fontWeight: '600', textAlign: 'center'  }}>Site</th>
                <th style={{ padding: '12px 14px', fontWeight: '600', textAlign: 'center'  }}>Time</th>
                <th style={{ padding: '12px 14px', fontWeight: '600', textAlign: 'center'  }}>Days</th>
                <th style={{ padding: '12px 14px', fontWeight: '600', textAlign: 'center'  }}>Range</th>
                <th style={{ padding: '12px 14px', fontWeight: '600', textAlign: 'center'  }}>Status</th>
                <th style={{ padding: '12px 14px', fontWeight: '600', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates?.length ? templates.map((t) => (
                <tr 
                  key={t.id}
                  style={{
                    borderBottom: `1px solid ${theme.border}`,
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                >
                  <td style={{ padding: '12px 14px', fontWeight: '600', color: theme.textMain, wordBreak: 'break-word' }}>
                    {t.name}
                  </td>
                  <td style={{ padding: '12px 14px', color: theme.textMuted, wordBreak: 'break-word' }}>
                    {sites?.find((s) => s.id === t.site_id)?.name || `Site #${t.site_id}`}
                  </td>
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                    {t.start_time_of_day} - {t.end_time_of_day}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      backgroundColor: theme.cardBg,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      wordBreak: 'break-word'
                    }}>
                      {t.days_of_week}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: theme.textMuted }}>
                    {t.start_date} &rarr; {t.end_date}
                  </td>
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: theme.textMuted }}>
                    <span className={`badge ${t.is_active ? 'badge-approved' : 'badge-neutral'}`}>
                      {t.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <div>
                        <button
                          onClick={() => handleGenerate(t.id)}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: theme.actionSecondaryBg,
                            color: theme.textMain,
                            border: `1px solid ${theme.border}`,
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme.border}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = theme.actionSecondaryBg}
                        >
                          Generate Shifts
                        </button>

                        <button
                          onClick={() => handleDeactivate(t.id)}
                          disabled={!t.is_active}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: 'transparent',
                            color: theme.dangerText,
                            border: `1px solid ${theme.dangerText}`,
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme.dangerBg}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          {t.is_active ? 'Deactivate' : 'Deactivated'}
                        </button>
                      </div>
                      {rowErrors[t.id] && (
                        <span style={{ fontSize: 11, color: rowErrors[t.id].type === 'success' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {rowErrors[t.id].msg}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
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
                    No shift templates available.
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