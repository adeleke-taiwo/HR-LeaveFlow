export default function StatCard({ label, value, icon, colorClass }) {
  const colorMap = {
    blue: { bg: '#dbeafe', color: '#3b82f6' },
    orange: { bg: '#fef3c7', color: '#f59e0b' },
    green: { bg: '#d1fae5', color: '#10b981' },
    red: { bg: '#fee2e2', color: '#ef4444' },
  };

  const colors = colorMap[colorClass] || colorMap.blue;

  return (
    <div className="stat-card">
      <div className="stat-header">
        <span className="stat-label">{label}</span>
        <div className="stat-icon" style={{ background: colors.bg, color: colors.color }}>
          {icon}
        </div>
      </div>
      <div className="stat-value">{value}</div>
    </div>
  );
}
