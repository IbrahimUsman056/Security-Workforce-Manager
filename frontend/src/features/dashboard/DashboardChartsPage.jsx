import { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useGetSitesQuery } from '../sites/sitesApi';
import {
  useGetAttendanceTrendQuery, useGetIncidentHeatmapQuery, useGetStaffHoursQuery, useGetForecastQuery,
} from './dashboardApi';
import { useGetMlForecastQuery } from './dashboardApi';

export default function DashboardChartsPage() {
  const { data: sites } = useGetSitesQuery();
  const [forecastSiteId, setForecastSiteId] = useState('');

  const { data: attendanceTrend, isLoading: trendLoading } = useGetAttendanceTrendQuery(30);
  const { data: incidentHeatmap, isLoading: heatmapLoading } = useGetIncidentHeatmapQuery();
  const { data: staffHours, isLoading: hoursLoading } = useGetStaffHoursQuery(30);
  const { data: forecast } = useGetForecastQuery(forecastSiteId, { skip: !forecastSiteId });
  const { data: mlForecast, error: mlForecastError } = useGetMlForecastQuery(forecastSiteId, { skip: !forecastSiteId });
  return (
    <div>
      <h2>Dashboard</h2>

      <h3>Attendance Trend (Last 30 Days)</h3>
      {trendLoading ? <p>Loading...</p> : attendanceTrend?.length ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={attendanceTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="on_time" stroke="#22c55e" name="On Time" />
            <Line type="monotone" dataKey="late" stroke="#eab308" name="Late" />
            <Line type="monotone" dataKey="absent" stroke="#ef4444" name="Absent" />
          </LineChart>
        </ResponsiveContainer>
      ) : <p>No attendance data in this period.</p>}

      <h3>Incidents by Site (Severity Breakdown)</h3>
      {heatmapLoading ? <p>Loading...</p> : incidentHeatmap?.length ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={incidentHeatmap}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="site_name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="low" stackId="a" fill="#22c55e" name="Low" />
            <Bar dataKey="medium" stackId="a" fill="#eab308" name="Medium" />
            <Bar dataKey="high" stackId="a" fill="#f97316" name="High" />
            <Bar dataKey="critical" stackId="a" fill="#ef4444" name="Critical" />
          </BarChart>
        </ResponsiveContainer>
      ) : <p>No incident data yet.</p>}

      <h3>Staff Hours Distribution (Last 30 Days)</h3>
      {hoursLoading ? <p>Loading...</p> : staffHours?.length ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={staffHours}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="total_hours" fill="#0f172a" name="Hours Worked" />
          </BarChart>
        </ResponsiveContainer>
      ) : <p>No hours data in this period.</p>}

      <h3>Next Week Staffing Forecast</h3>
      <div className="inline-form">
        <select value={forecastSiteId} onChange={(e) => setForecastSiteId(e.target.value)}>
          <option value="">Select site</option>
          {sites?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {forecastSiteId && (
        <>
          <h4>ML Model Prediction (Gradient Boosting)</h4>
          <p style={{ fontSize: '13px', color: '#666' }}>
            Trained on 6 months of historical shift data, factoring in day-of-week patterns, seasonality, and recent trend.
          </p>
          {mlForecastError ? (
            <p style={{ color: '#ef4444' }}>
              {mlForecastError.data?.detail || 'Model not available. Run train_demand_model.py in the backend.'}
            </p>
          ) : mlForecast && (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={mlForecast}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="predicted_demand" fill="#8b5cf6" name="ML Predicted Staff Needed" />
              </BarChart>
            </ResponsiveContainer>
          )}

          <h4>Moving Average Baseline (for comparison)</h4>
          {forecast && (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={forecast}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="predicted_required_staff" fill="#3b82f6" name="Baseline Predicted Staff" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </>
      )}
    </div>
  );
}