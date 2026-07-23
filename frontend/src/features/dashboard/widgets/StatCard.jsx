export default function StatCard({ icon: Icon, label, value, color = 'var(--color-primary)' }) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ background: `${color}15`, color }}>
        <Icon size={20} />
      </div>
      <div>
        <div className="stat-card-value">{value}</div>
        <div className="stat-card-label">{label}</div>
      </div>
    </div>
  );
}