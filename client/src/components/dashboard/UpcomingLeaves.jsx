import { useQuery } from '@tanstack/react-query';
import { leaveService } from '../../services/leaveService';
import { format } from 'date-fns';
import './UpcomingLeaves.css';

export default function UpcomingLeaves() {
  const { data, isLoading } = useQuery({
    queryKey: ['upcomingLeaves'],
    queryFn: () => leaveService.getUpcomingLeaves(30),
  });

  if (isLoading) {
    return <div className="upcoming-leaves-loading">Loading upcoming leaves...</div>;
  }

  const leaves = Array.isArray(data?.data?.data) ? data.data.data : [];

  return (
    <div className="upcoming-leaves">
      <h3>Upcoming Leaves (Next 30 Days)</h3>
      {leaves.length === 0 ? (
        <p className="no-data">No upcoming leaves</p>
      ) : (
        <div className="upcoming-leaves-table">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((leave) => (
                <tr key={leave.id}>
                  <td>
                    {leave.requester.firstName} {leave.requester.lastName}
                  </td>
                  <td>{leave.leaveType.name}</td>
                  <td>{format(new Date(leave.startDate), 'MMM dd, yyyy')}</td>
                  <td>{format(new Date(leave.endDate), 'MMM dd, yyyy')}</td>
                  <td>{leave.totalDays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
