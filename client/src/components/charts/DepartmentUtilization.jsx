import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DepartmentUtilization({ data }) {
  // Transform data for the chart
  const chartData = Object.entries(data || {}).map(([name, values]) => ({
    name: name.length > 15 ? name.substring(0, 15) + '...' : name,
    approved: values.approved || 0,
    pending: values.pending || 0,
    rejected: values.rejected || 0,
  }));

  if (chartData.length === 0) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>No data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
        <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '14px' }} />
        <Bar dataKey="approved" fill="#10b981" name="Approved Days" />
        <Bar dataKey="pending" fill="#f59e0b" name="Pending Days" />
        <Bar dataKey="rejected" fill="#ef4444" name="Rejected Days" />
      </BarChart>
    </ResponsiveContainer>
  );
}
