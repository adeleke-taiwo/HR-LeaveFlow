import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MyLeavesPage from './pages/MyLeavesPage';
import NewLeavePage from './pages/NewLeavePage';
import TeamLeavesPage from './pages/TeamLeavesPage';
import LeaveBalancePage from './pages/LeaveBalancePage';
import ProfilePage from './pages/ProfilePage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminDepartmentsPage from './pages/AdminDepartmentsPage';
import AdminLeaveTypesPage from './pages/AdminLeaveTypesPage';
import AdminWorkflowsPage from './pages/AdminWorkflowsPage';
import ReportsPage from './pages/ReportsPage';
import CalendarPage from './pages/CalendarPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter basename="/HR-LeaveFlow">
          <ErrorBoundary>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes with layout */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/leaves/my" element={<MyLeavesPage />} />
              <Route path="/leaves/new" element={<NewLeavePage />} />
              <Route path="/leaves/calendar" element={<CalendarPage />} />
              <Route path="/balances" element={<LeaveBalancePage />} />
              <Route path="/profile" element={<ProfilePage />} />

              {/* Manager & Admin */}
              <Route
                path="/leaves/team"
                element={
                  <ProtectedRoute allowedRoles={['manager', 'admin']}>
                    <TeamLeavesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute allowedRoles={['manager', 'admin']}>
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin only */}
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminUsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/departments"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDepartmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/leave-types"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLeaveTypesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/workflows"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminWorkflowsPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          </ErrorBoundary>
        </BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              fontFamily: "'DM Sans', sans-serif",
              borderRadius: '10px',
              padding: '12px 16px',
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
