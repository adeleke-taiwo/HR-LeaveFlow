import { useEffect, useState } from 'react';
import { leaveBalanceService } from '../services/userService';
import './LeaveBalancePage.css';

export default function LeaveBalancePage() {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    leaveBalanceService.getMyBalances()
      .then((res) => { setBalances(res.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const currentYear = new Date().getFullYear();

  return (
    <div className="balance-page">
      <h2 className="page-title">Leave Balance</h2>
      <p className="page-subtitle">Your leave allocation for {currentYear}</p>

      {loading ? (
        <p className="empty-text">Loading...</p>
      ) : (
        <div className="balance-grid">
          {balances.map((b) => {
            const usedPercent = b.allocated > 0 ? (b.used / b.allocated) * 100 : 0;
            const pendingPercent = b.allocated > 0 ? (b.pending / b.allocated) * 100 : 0;

            return (
              <div key={b.id} className="balance-card">
                <h3>{b.leaveType?.name}</h3>
                <div className="balance-numbers">
                  <div className="balance-stat">
                    <span className="balance-stat-value">{b.allocated}</span>
                    <span className="balance-stat-label">Allocated</span>
                  </div>
                  <div className="balance-stat">
                    <span className="balance-stat-value" style={{ color: 'var(--accent-blue)' }}>{b.used}</span>
                    <span className="balance-stat-label">Used</span>
                  </div>
                  <div className="balance-stat">
                    <span className="balance-stat-value" style={{ color: 'var(--accent-orange)' }}>{b.pending}</span>
                    <span className="balance-stat-label">Pending</span>
                  </div>
                  <div className="balance-stat">
                    <span className="balance-stat-value" style={{ color: 'var(--accent-green)' }}>{b.remaining}</span>
                    <span className="balance-stat-label">Remaining</span>
                  </div>
                </div>
                <div className="balance-progress">
                  <div className="balance-progress-used" style={{ width: `${usedPercent}%` }} />
                  <div className="balance-progress-pending" style={{ width: `${pendingPercent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
