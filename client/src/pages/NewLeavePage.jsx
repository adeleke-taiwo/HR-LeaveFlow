import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { leaveService } from '../services/leaveService';
import { leaveBalanceService } from '../services/userService';
import { calculateDays } from '../utils/dateUtils';
import toast from 'react-hot-toast';
import './LeavesPage.css';

const leaveSchema = z.object({
  leaveTypeId: z.string().min(1, 'Please select a leave type'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason must be under 500 characters'),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, { message: 'End date must be on or after start date', path: ['endDate'] });

export default function NewLeavePage() {
  const [balances, setBalances] = useState([]);
  const [days, setDays] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(leaveSchema),
    defaultValues: {
      leaveTypeId: '',
      startDate: '',
      endDate: '',
      reason: '',
    },
  });

  const watchStartDate = watch('startDate');
  const watchEndDate = watch('endDate');
  const watchLeaveTypeId = watch('leaveTypeId');

  useEffect(() => {
    leaveBalanceService.getMyBalances()
      .then((res) => setBalances(res.data.data))
      .catch(() => toast.error('Failed to load leave balances'));
  }, []);

  useEffect(() => {
    if (watchStartDate && watchEndDate) {
      const selectedType = balances.find((b) => b.leaveType?.id === watchLeaveTypeId);
      const d = calculateDays(watchStartDate, watchEndDate, selectedType?.leaveType?.name);
      setDays(d > 0 ? d : 0);
    } else {
      setDays(0);
    }
  }, [watchStartDate, watchEndDate, watchLeaveTypeId, balances]);

  const selectedBalance = balances.find((b) => b.leaveType?.id === watchLeaveTypeId);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await leaveService.create(data);
      toast.success('Leave request submitted!');
      navigate('/leaves/my');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="leaves-page">
      <h2 className="page-title">New Leave Request</h2>
      <p className="page-subtitle">Submit a new leave request</p>

      <div className="leave-form-card" style={{ marginTop: '1.5rem' }}>
        {days > 0 && (
          <div className="days-indicator">
            <div className="days-indicator-label">Total Days</div>
            <div className="days-indicator-value">{days}</div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label htmlFor="leaveTypeId">Leave Type</label>
            <select id="leaveTypeId" {...register('leaveTypeId')}>
              <option value="">Select leave type</option>
              {balances.map((b) => (
                <option key={b.leaveType.id} value={b.leaveType.id}>
                  {b.leaveType.name} ({b.remaining} days remaining)
                </option>
              ))}
            </select>
            {errors.leaveTypeId && <span className="field-error">{errors.leaveTypeId.message}</span>}
          </div>

          {selectedBalance && (
            <div style={{
              padding: '0.5rem 1rem',
              background: '#f0fdf4',
              borderRadius: '8px',
              fontSize: '0.813rem',
              color: '#065f46',
              marginBottom: '1.25rem',
            }}>
              Balance: {selectedBalance.allocated} allocated, {selectedBalance.used} used, {selectedBalance.pending} pending, <strong>{selectedBalance.remaining} remaining</strong>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">Start Date</label>
              <input type="date" id="startDate" {...register('startDate')} />
              {errors.startDate && <span className="field-error">{errors.startDate.message}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="endDate">End Date</label>
              <input type="date" id="endDate" {...register('endDate')} min={watchStartDate} />
              {errors.endDate && <span className="field-error">{errors.endDate.message}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reason">Reason</label>
            <textarea
              id="reason"
              {...register('reason')}
              placeholder="Enter reason for leave request"
            />
            {errors.reason && <span className="field-error">{errors.reason.message}</span>}
          </div>

          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
}
