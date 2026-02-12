import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { authService } from '../services/authService';
import { departmentService } from '../services/userService';
import toast from 'react-hot-toast';
import './AuthPages.css';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Please enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a digit'),
  departmentId: z.string().optional(),
});

export default function RegisterPage() {
  const [departments, setDepartments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      departmentId: '',
    },
  });

  useEffect(() => {
    departmentService.getAll()
      .then((res) => setDepartments(res.data.data))
      .catch(() => toast.error('Failed to load departments'));
  }, []);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = { ...data };
      if (!payload.departmentId) delete payload.departmentId;
      await authService.register(payload);
      toast.success('Registration successful! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Join HR LeaveFlow</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                {...register('firstName')}
                placeholder="First name"
              />
              {errors.firstName && <span className="field-error">{errors.firstName.message}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                {...register('lastName')}
                placeholder="Last name"
              />
              {errors.lastName && <span className="field-error">{errors.lastName.message}</span>}
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              {...register('email')}
              placeholder="Enter your email"
            />
            {errors.email && <span className="field-error">{errors.email.message}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              {...register('password')}
              placeholder="Min 8 chars, uppercase, lowercase, digit"
            />
            {errors.password && <span className="field-error">{errors.password.message}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="departmentId">Department</label>
            <select id="departmentId" {...register('departmentId')}>
              <option value="">Select department (optional)</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
