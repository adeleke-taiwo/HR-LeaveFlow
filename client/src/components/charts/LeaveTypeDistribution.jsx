import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function LeaveTypeDistribution({ data }) {
  // Transform data for the chart
  const chartData = Object.entries(data || {}).map(([name, count], index) => ({
    name,
    value: count,
    color: COLORS[index % COLORS.length],
  }));

  if (chartData.length === 0) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>No data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '14px' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
