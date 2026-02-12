import { useQuery } from '@tanstack/react-query';
import { leaveService } from '../../services/leaveService';
import LeavesTrendChart from '../charts/LeavesTrendChart';
import './LeaveTrendsChart.css';

export default function LeaveTrendsChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['leaveStats'],
    queryFn: () => leaveService.getLeaveStats(),
  });

  if (isLoading) {
    return (
      <div className="leave-trends-chart">
        <h3>Leave Trends (Last 6 Months)</h3>
        <div className="loading">Loading chart data...</div>
      </div>
    );
  }

  const stats = data?.data?.data || {};

  return (
    <div className="leave-trends-chart">
      <h3>Leave Trends (Last 6 Months)</h3>
      <div className="chart-container">
        <LeavesTrendChart data={stats.byMonth || []} />
      </div>
    </div>
  );
}
