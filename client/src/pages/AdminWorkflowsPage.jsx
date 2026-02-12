import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowService } from '../services/workflowService';
import { leaveTypeService } from '../services/leaveTypeService';
import toast from 'react-hot-toast';
import './AdminWorkflowsPage.css';

export default function AdminWorkflowsPage() {
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    leaveTypeId: '',
    requiresHR: false,
    minDaysForHR: '',
  });
  const queryClient = useQueryClient();

  const { data: workflows, isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: workflowService.getAll,
  });

  const { data: leaveTypes } = useQuery({
    queryKey: ['leaveTypes'],
    queryFn: leaveTypeService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: workflowService.create,
    onSuccess: () => {
      toast.success('Workflow created successfully');
      queryClient.invalidateQueries(['workflows']);
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create workflow');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => workflowService.update(id, data),
    onSuccess: () => {
      toast.success('Workflow updated successfully');
      queryClient.invalidateQueries(['workflows']);
      setEditingWorkflow(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update workflow');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: workflowService.delete,
    onSuccess: () => {
      toast.success('Workflow deleted successfully');
      queryClient.invalidateQueries(['workflows']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete workflow');
    },
  });

  const resetForm = () => {
    setFormData({
      leaveTypeId: '',
      requiresHR: false,
      minDaysForHR: '',
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      minDaysForHR: formData.minDaysForHR ? parseInt(formData.minDaysForHR) : null,
    };

    if (editingWorkflow) {
      updateMutation.mutate({ id: editingWorkflow.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (workflow) => {
    setEditingWorkflow(workflow);
    setFormData({
      leaveTypeId: workflow.leaveTypeId,
      requiresHR: workflow.requiresHR,
      minDaysForHR: workflow.minDaysForHR || '',
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this workflow?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading workflows...</div>;
  }

  const workflowList = Array.isArray(workflows?.data?.data) ? workflows.data.data : [];
  const leaveTypeList = Array.isArray(leaveTypes?.data?.data) ? leaveTypes.data.data : [];
  const existingLeaveTypeIds = workflowList.map((w) => w.leaveTypeId);
  const availableLeaveTypes = leaveTypeList.filter((lt) => !existingLeaveTypeIds.includes(lt.id));

  return (
    <div className="workflows-page">
      <div className="workflows-header">
        <div>
          <h1>Approval Workflows</h1>
          <p>Configure multi-level approval settings for leave types</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + Create Workflow
        </button>
      </div>

      <div className="workflows-list">
        {workflowList.length === 0 ? (
          <div className="empty-state">
            <p>No workflows configured yet. Click "+ Create Workflow" above to get started.</p>
          </div>
        ) : (
          <div className="workflows-grid">
            {workflowList.map((workflow) => (
              <div key={workflow.id} className="workflow-card">
                <div className="workflow-header">
                  <h3>{workflow.leaveType.name}</h3>
                  <div className="workflow-actions">
                    <button className="btn-icon" onClick={() => handleEdit(workflow)} title="Edit">
                      ✏️
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => handleDelete(workflow.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="workflow-details">
                  <div className="detail-item">
                    <span className="label">Requires HR Approval:</span>
                    <span className={`badge ${workflow.requiresHR ? 'badge-yes' : 'badge-no'}`}>
                      {workflow.requiresHR ? 'Yes' : 'No'}
                    </span>
                  </div>
                  {workflow.minDaysForHR && (
                    <div className="detail-item">
                      <span className="label">HR Required if ≥</span>
                      <span className="value">{workflow.minDaysForHR} days</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(showCreateModal || editingWorkflow) && (
        <div className="modal-overlay" onClick={() => {
          setShowCreateModal(false);
          setEditingWorkflow(null);
          resetForm();
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingWorkflow ? 'Edit Workflow' : 'Create Workflow'}</h2>
              <button
                className="modal-close"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingWorkflow(null);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="workflow-form">
              <div className="form-group">
                <label>Leave Type *</label>
                <select
                  value={formData.leaveTypeId}
                  onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
                  required
                  disabled={!!editingWorkflow}
                >
                  <option value="">Select Leave Type</option>
                  {editingWorkflow ? (
                    <option value={editingWorkflow.leaveTypeId}>
                      {editingWorkflow.leaveType.name}
                    </option>
                  ) : (
                    availableLeaveTypes.map((lt) => (
                      <option key={lt.id} value={lt.id}>
                        {lt.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.requiresHR}
                    onChange={(e) => setFormData({ ...formData, requiresHR: e.target.checked })}
                  />
                  <span>Always Requires HR Approval</span>
                </label>
                <p className="help-text">
                  If enabled, all leaves of this type will require HR approval after manager approval
                </p>
              </div>

              <div className="form-group">
                <label>Minimum Days for HR Approval</label>
                <input
                  type="number"
                  min="1"
                  value={formData.minDaysForHR}
                  onChange={(e) => setFormData({ ...formData, minDaysForHR: e.target.value })}
                  placeholder="e.g., 5"
                />
                <p className="help-text">
                  Require HR approval if leave duration is equal to or greater than this number of days
                </p>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingWorkflow(null);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingWorkflow
                    ? 'Update'
                    : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
