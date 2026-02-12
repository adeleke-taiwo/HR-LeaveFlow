import { useEffect, useState } from 'react';
import { leaveService } from '../services/leaveService';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmModal from '../components/common/ConfirmModal';
import { formatDate } from '../utils/dateUtils';
import toast from 'react-hot-toast';
import './LeavesPage.css';

export default function TeamLeavesPage() {
  const [leaves, setLeaves] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [actionModal, setActionModal] = useState({ isOpen: false, leaveId: null, action: null, comment: '' });

  useEffect(() => { setPage(1); }, [filter]);
  useEffect(() => { loadLeaves(); }, [filter, page]);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (filter) params.status = filter;
      const res = await leaveService.getTeamLeaves(params);
      setLeaves(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load team leaves');
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = (leaveId, action) => {
    setActionModal({ isOpen: true, leaveId, action, comment: '' });
  };

  const handleAction = async () => {
    const { leaveId, action, comment } = actionModal;
    try {
      await leaveService.updateStatus(leaveId, { status: action, reviewComment: comment });
      toast.success(`Leave ${action}`);
      setActionModal({ isOpen: false, leaveId: null, action: null, comment: '' });
      loadLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div className="leaves-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Team Leaves</h2>
          <p className="page-subtitle">Review and manage team leave requests</p>
        </div>
      </div>

      <div className="filter-bar">
        {['', 'pending', 'pending_hr', 'approved', 'rejected', 'cancelled'].map((s) => (
          <button
            key={s}
            className={`filter-btn ${filter === s ? 'active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s === 'pending_hr' ? 'Awaiting HR' : (s || 'All')}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="empty-text">Loading...</p>
      ) : leaves.length === 0 ? (
        <div className="empty-state">
          <p>No team leave requests found</p>
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
                <div className="leave-card-name">
                  {leave.requester?.firstName} {leave.requester?.lastName}
                  {leave.requester?.department && (
                    <span style={{ fontWeight: 400, color: 'var(--text-secondary)', marginLeft: '0.5rem', fontSize: '0.85rem' }}>
                      ({leave.requester.department.name})
                    </span>
                  )}
                </div>
                <div className="leave-card-dates">
                  {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                  <span className="leave-card-days">{leave.totalDays} {leave.totalDays === 1 ? 'day' : 'days'}</span>
                </div>
                <div className="leave-card-reason">{leave.reason}</div>

                {/* Multi-level approval info */}
                {(leave.managerReviewer || leave.hrReviewer) && (
                  <div className="approval-info">
                    {leave.managerReviewer && (
                      <div className="approval-step">
                        <strong>Manager:</strong> Approved by {leave.managerReviewer.firstName} {leave.managerReviewer.lastName}
                        {leave.managerComment && <div className="approval-comment">"{leave.managerComment}"</div>}
                      </div>
                    )}
                    {leave.hrReviewer && (
                      <div className="approval-step">
                        <strong>HR:</strong> {leave.status === 'approved' ? 'Approved' : 'Reviewed'} by {leave.hrReviewer.firstName} {leave.hrReviewer.lastName}
                        {leave.hrComment && <div className="approval-comment">"{leave.hrComment}"</div>}
                      </div>
                    )}
                  </div>
                )}

                {(leave.status === 'pending' || leave.status === 'pending_hr') && (
                  <div className="leave-card-actions">
                    <button className="btn-action btn-approve" onClick={() => openActionModal(leave.id, 'approved')}>
                      Approve
                    </button>
                    <button className="btn-action btn-reject" onClick={() => openActionModal(leave.id, 'rejected')}>
                      Reject
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
        isOpen={actionModal.isOpen}
        title={actionModal.action === 'approved' ? 'Approve Leave' : 'Reject Leave'}
        message={
          actionModal.action === 'approved'
            ? 'Are you sure you want to approve this leave request?'
            : 'Are you sure you want to reject this leave request?'
        }
        confirmLabel={actionModal.action === 'approved' ? 'Approve' : 'Reject'}
        variant={actionModal.action === 'approved' ? 'primary' : 'danger'}
        showInput={actionModal.action === 'rejected'}
        inputLabel="Reason for rejection (optional)"
        inputValue={actionModal.comment}
        onInputChange={(val) => setActionModal({ ...actionModal, comment: val })}
        onConfirm={handleAction}
        onCancel={() => setActionModal({ isOpen: false, leaveId: null, action: null, comment: '' })}
      />
    </div>
  );
}
