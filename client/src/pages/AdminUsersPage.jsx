import { useEffect, useState } from 'react';
import { userService, departmentService } from '../services/userService';
import ConfirmModal from '../components/common/ConfirmModal';
import toast from 'react-hot-toast';
import './AdminPages.css';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '', role: 'employee', departmentId: '',
  });
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => { loadData(); }, [page]);

  const loadData = async () => {
    try {
      const [usersRes, deptsRes] = await Promise.all([
        userService.getUsers({ page, limit: 20 }),
        departmentService.getAll(),
      ]);
      setUsers(usersRes.data.data);
      setPagination(usersRes.data.pagination);
      setDepartments(deptsRes.data.data);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const data = { ...form };
      if (!data.departmentId) delete data.departmentId;
      await userService.create(data);
      toast.success('User created');
      setShowForm(false);
      setForm({ email: '', password: '', firstName: '', lastName: '', role: 'employee', departmentId: '' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await userService.updateRole(userId, { role });
      toast.success('Role updated');
      loadData();
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await userService.deactivate(deactivateTarget);
      toast.success('User deactivated');
      setDeactivateTarget(null);
      loadData();
    } catch (err) {
      toast.error('Failed to deactivate user');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await userService.deleteUser(deleteTarget);
      toast.success('User deleted');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">User Management</h2>
          <p className="page-subtitle">Manage system users</p>
        </div>
        <button className="btn-add" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add User'}
        </button>
      </div>

      {showForm && (
        <form className="admin-form" onSubmit={handleCreate}>
          <div className="form-row-4">
            <input placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            <input placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
            <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
          </div>
          <div className="form-row-3">
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
              <option value="">No department</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <button type="submit" className="btn-create">Create User</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="empty-text">Loading...</p>
      ) : (
        <>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.firstName} {u.lastName}</td>
                    <td>{u.email}</td>
                    <td>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="role-select"
                      >
                        <option value="employee">Employee</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>{u.department?.name || '-'}</td>
                    <td>
                      <span className={`status-dot ${u.isActive ? 'active' : 'inactive'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {u.isActive && (
                          <button className="btn-action btn-deactivate" onClick={() => setDeactivateTarget(u.id)}>
                            Deactivate
                          </button>
                        )}
                        <button className="btn-action btn-delete" onClick={() => setDeleteTarget(u.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
        isOpen={!!deactivateTarget}
        title="Deactivate User"
        message="Are you sure you want to deactivate this user? They will no longer be able to log in."
        confirmLabel="Deactivate"
        variant="warning"
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateTarget(null)}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete User"
        message="Are you sure you want to delete this user? Their leave balances will be removed. This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
