import { useEffect, useState } from 'react';
import { leaveTypeService } from '../services/leaveTypeService';
import ConfirmModal from '../components/common/ConfirmModal';
import toast from 'react-hot-toast';
import './AdminPages.css';

export default function AdminLeaveTypesPage() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', defaultDaysPerYear: '', requiresApproval: true });
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await leaveTypeService.getAll();
      setLeaveTypes(res.data.data);
    } catch (err) {
      toast.error('Failed to load leave types');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: '', description: '', defaultDaysPerYear: '', requiresApproval: true });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (lt) => {
    setForm({
      name: lt.name,
      description: lt.description || '',
      defaultDaysPerYear: lt.defaultDaysPerYear.toString(),
      requiresApproval: lt.requiresApproval,
    });
    setEditingId(lt.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      name: form.name,
      description: form.description || undefined,
      defaultDaysPerYear: parseInt(form.defaultDaysPerYear),
      requiresApproval: form.requiresApproval,
    };

    try {
      if (editingId) {
        await leaveTypeService.update(editingId, data);
        toast.success('Leave type updated');
      } else {
        await leaveTypeService.create(data);
        toast.success('Leave type created');
      }
      resetForm();
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save leave type');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await leaveTypeService.delete(deleteTarget);
      toast.success('Leave type deactivated');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete leave type');
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Leave Types</h2>
          <p className="page-subtitle">Manage leave type configurations</p>
        </div>
        <button className="btn-add" onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}>
          {showForm ? 'Cancel' : '+ Add Leave Type'}
        </button>
      </div>

      {showForm && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="form-row-4">
            <input
              placeholder="Leave type name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <input
              type="number"
              placeholder="Days per year"
              value={form.defaultDaysPerYear}
              onChange={(e) => setForm({ ...form, defaultDaysPerYear: e.target.value })}
              required
              min={0}
              max={365}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
              <input
                type="checkbox"
                checked={form.requiresApproval}
                onChange={(e) => setForm({ ...form, requiresApproval: e.target.checked })}
              />
              Requires Approval
            </label>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <button type="submit" className="btn-create">
              {editingId ? 'Update Leave Type' : 'Create Leave Type'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="empty-text">Loading...</p>
      ) : leaveTypes.length === 0 ? (
        <div className="empty-state">
          <p className="empty-text">No leave types configured</p>
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Leave Type</th>
                <th>Description</th>
                <th>Default Days/Year</th>
                <th>Approval Required</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaveTypes.map((lt) => (
                <tr key={lt.id}>
                  <td style={{ fontWeight: 600 }}>{lt.name}</td>
                  <td>{lt.description || '-'}</td>
                  <td>{lt.defaultDaysPerYear}</td>
                  <td>{lt.requiresApproval ? 'Yes' : 'No'}</td>
                  <td>
                    <span className={`status-dot ${lt.isActive ? 'active' : 'inactive'}`}>
                      {lt.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-action btn-edit" onClick={() => handleEdit(lt)}>
                        Edit
                      </button>
                      {lt.isActive && (
                        <button className="btn-action btn-delete" onClick={() => setDeleteTarget(lt.id)}>
                          Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Deactivate Leave Type"
        message="Are you sure you want to deactivate this leave type? It will no longer be available for new leave requests."
        confirmLabel="Deactivate"
        variant="warning"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
