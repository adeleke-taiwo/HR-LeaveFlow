import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export default function LeavesTrendChart({ data }) {
  // Transform data for the chart
  const chartData = Object.entries(data || {}).map(([month, values]) => ({
    month: format(new Date(month + '-01'), 'MMM yyyy'),
    approved: values.approved || 0,
    pending: values.pending || 0,
    rejected: values.rejected || 0,
  })).sort((a, b) => new Date(a.month) - new Date(b.month));

  if (chartData.length === 0) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>No data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
        <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '14px' }} />
        <Line type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={2} name="Approved" />
        <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} name="Pending" />
        <Line type="monotone" dataKey="rejected" stroke="#ef4444" strokeWidth={2} name="Rejected" />
      </LineChart>
    </ResponsiveContainer>
  );
}
