import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';
import './ProfilePage.css';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[0-9]/, 'Must contain a digit'),
});

export default function ProfilePage() {
  const { user } = useAuth();
  const [changing, setChanging] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  const onSubmit = async (data) => {
    setChanging(true);
    try {
      await authService.changePassword(data);
      toast.success('Password changed successfully');
      reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="profile-page">
      <h2 className="page-title">Profile</h2>
      <p className="page-subtitle">Your account information</p>

      <div className="profile-grid">
        <div className="profile-card">
          <h3>Account Details</h3>
          <div className="profile-fields">
            <div className="profile-field">
              <span className="field-label">Name</span>
              <span className="field-value">{user?.firstName} {user?.lastName}</span>
            </div>
            <div className="profile-field">
              <span className="field-label">Email</span>
              <span className="field-value">{user?.email}</span>
            </div>
            <div className="profile-field">
              <span className="field-label">Role</span>
              <span className="field-value" style={{ textTransform: 'capitalize' }}>{user?.role}</span>
            </div>
            <div className="profile-field">
              <span className="field-label">Department</span>
              <span className="field-value">{user?.department?.name || 'Not assigned'}</span>
            </div>
          </div>
        </div>

        <div className="profile-card">
          <h3>Change Password</h3>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                {...register('currentPassword')}
              />
              {errors.currentPassword && <span className="field-error">{errors.currentPassword.message}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                {...register('newPassword')}
                placeholder="Min 8 chars, uppercase, lowercase, digit"
              />
              {errors.newPassword && <span className="field-error">{errors.newPassword.message}</span>}
            </div>
            <button type="submit" className="submit-btn" disabled={changing}>
              {changing ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
