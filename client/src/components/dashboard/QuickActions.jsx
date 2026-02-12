import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveService } from '../../services/leaveService';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import './QuickActions.css';

export default function QuickActions() {
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['pendingLeaves'],
    queryFn: () => leaveService.getTeamLeaves({ status: 'pending', limit: 10 }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, reviewComment }) =>
      leaveService.updateStatus(id, { status, reviewComment }),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries(['pendingLeaves']);
      queryClient.invalidateQueries(['teamLeaves']);
      queryClient.invalidateQueries(['leaveStats']);
      setSelectedLeave(null);
      setReviewComment('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update leave status');
    },
  });

  const handleApprove = (leave) => {
    if (window.confirm(`Approve leave for ${leave.requester.firstName} ${leave.requester.lastName}?`)) {
      updateStatusMutation.mutate({
        id: leave.id,
        status: 'approved',
        reviewComment: reviewComment || 'Approved',
      });
    }
  };

  const handleReject = (leave) => {
    if (!reviewComment.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    if (window.confirm(`Reject leave for ${leave.requester.firstName} ${leave.requester.lastName}?`)) {
      updateStatusMutation.mutate({
        id: leave.id,
        status: 'rejected',
        reviewComment,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="loading">Loading pending leaves...</div>
      </div>
    );
  }

  const leaves = Array.isArray(data?.data?.data) ? data.data.data : [];

  return (
    <div className="quick-actions">
      <h3>Quick Actions - Pending Approvals</h3>
      {leaves.length === 0 ? (
        <p className="no-data">No pending leaves to review</p>
      ) : (
        <div className="pending-leaves-list">
          {leaves.map((leave) => (
            <div key={leave.id} className="leave-item">
              <div className="leave-info">
                <div className="employee-name">
                  {leave.requester.firstName} {leave.requester.lastName}
                </div>
                <div className="leave-details">
                  <span className="leave-type">{leave.leaveType.name}</span>
                  <span className="leave-dates">
                    {format(new Date(leave.startDate), 'MMM dd')} -{' '}
                    {format(new Date(leave.endDate), 'MMM dd, yyyy')}
                  </span>
                  <span className="leave-days">{leave.totalDays} days</span>
                </div>
                {leave.reason && (
                  <div className="leave-reason">
                    <strong>Reason:</strong> {leave.reason}
                  </div>
                )}
              </div>
              <div className="leave-actions">
                <button
                  className="btn-view"
                  onClick={() => setSelectedLeave(selectedLeave?.id === leave.id ? null : leave)}
                >
                  {selectedLeave?.id === leave.id ? 'Hide' : 'Review'}
                </button>
              </div>
              {selectedLeave?.id === leave.id && (
                <div className="review-panel">
                  <textarea
                    placeholder="Add a comment (optional for approval, required for rejection)"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows="3"
                  />
                  <div className="review-actions">
                    <button
                      className="btn-approve"
                      onClick={() => handleApprove(leave)}
                      disabled={updateStatusMutation.isPending}
                    >
                      Approve
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => handleReject(leave)}
                      disabled={updateStatusMutation.isPending}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
