import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import './AuthPages.css';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const DEMO_ACCOUNTS = [
  { label: 'Employee', email: 'employee@company.com', password: 'Employee123!', color: '#3b82f6', bg: '#eff6ff', desc: 'Submit & track leave requests' },
  { label: 'Manager', email: 'manager@company.com', password: 'Manager123!', color: '#f59e0b', bg: '#fffbeb', desc: 'Approve team leave requests' },
  { label: 'Admin', email: 'admin@company.com', password: 'Admin123!', color: '#ef4444', bg: '#fef2f2', desc: 'Full system administration' },
];

export default function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await login(data);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillCredentials = (acct) => {
    setValue('email', acct.email);
    setValue('password', acct.password);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left branding panel */}
        <div className="auth-brand">
          <div className="auth-brand-content">
            <div className="auth-brand-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
                <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
                <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
              </svg>
            </div>
            <h1>HR LeaveFlow</h1>
            <p className="auth-brand-tagline">Streamlined leave management for modern teams</p>
            <div className="auth-brand-features">
              <div className="auth-brand-feature">
                <span className="feature-dot"></span>
                Multi-level approval workflows
              </div>
              <div className="auth-brand-feature">
                <span className="feature-dot"></span>
                Real-time team calendar
              </div>
              <div className="auth-brand-feature">
                <span className="feature-dot"></span>
                Analytics & reporting
              </div>
            </div>
          </div>
        </div>

        {/* Right login panel */}
        <div className="auth-card">
          <div className="auth-header">
            <h2>Welcome back</h2>
            <p>Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                {...register('email')}
                placeholder="you@company.com"
              />
              {errors.email && <span className="field-error">{errors.email.message}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                {...register('password')}
                placeholder="Enter your password"
              />
              {errors.password && <span className="field-error">{errors.password.message}</span>}
            </div>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="btn-loading">
                  <span className="spinner"></span>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>Demo Accounts</span>
          </div>

          <div className="demo-accounts">
            {DEMO_ACCOUNTS.map((acct) => (
              <button
                key={acct.label}
                type="button"
                className="demo-account-btn"
                onClick={() => fillCredentials(acct)}
                style={{ '--accent': acct.color, '--accent-bg': acct.bg }}
              >
                <span className="demo-role">{acct.label}</span>
                <span className="demo-desc">{acct.desc}</span>
              </button>
            ))}
          </div>

          <p className="auth-footer">
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
