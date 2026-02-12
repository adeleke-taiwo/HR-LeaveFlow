import { useEffect, useState } from 'react';
import { leaveService } from '../services/leaveService';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmModal from '../components/common/ConfirmModal';
import { formatDate } from '../utils/dateUtils';
import toast from 'react-hot-toast';
import './LeavesPage.css';

export default function MyLeavesPage() {
  const [leaves, setLeaves] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [cancelTarget, setCancelTarget] = useState(null);

  useEffect(() => { setPage(1); }, [filter]);
  useEffect(() => { loadLeaves(); }, [filter, page]);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (filter) params.status = filter;
      const res = await leaveService.getMyLeaves(params);
      setLeaves(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load leaves');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    try {
      await leaveService.cancel(cancelTarget);
      toast.success('Leave cancelled');
      setCancelTarget(null);
      loadLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    }
  };

  return (
    <div className="leaves-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">My Leaves</h2>
          <p className="page-subtitle">View and manage your leave requests</p>
        </div>
      </div>

      <div className="filter-bar">
        {['', 'pending', 'approved', 'rejected', 'cancelled'].map((s) => (
          <button
            key={s}
            className={`filter-btn ${filter === s ? 'active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="empty-text">Loading...</p>
      ) : leaves.length === 0 ? (
        <div className="empty-state">
          <p>No leave requests found</p>
        </div>
      ) : (
        <>
          <div className="leaves-list">
            {leaves.map((leave) => (
              <div key={leave.id} className="leave-card">
                <div className="leave-card-header">
                  <span className="leave-card-type">{leave.leaveType?.name}</span>
                  <StatusBadge status={leave.status} />
                </div>
                <div className="leave-card-dates">
                  {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                  <span className="leave-card-days">{leave.totalDays} {leave.totalDays === 1 ? 'day' : 'days'}</span>
                </div>
                <div className="leave-card-reason">{leave.reason}</div>
                {leave.reviewComment && (
                  <div className="leave-card-review">
                    Review: {leave.reviewComment}
                  </div>
                )}
                {leave.status === 'pending' && (
                  <div className="leave-card-actions">
                    <button className="btn-action btn-cancel" onClick={() => setCancelTarget(leave.id)}>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                className="pagination-btn"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      <ConfirmModal
        isOpen={!!cancelTarget}
        title="Cancel Leave Request"
        message="Are you sure you want to cancel this leave request? This action cannot be undone."
        confirmLabel="Cancel Leave"
        cancelLabel="Keep"
        variant="warning"
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}
