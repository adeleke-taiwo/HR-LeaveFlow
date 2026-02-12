import api from './api';

export const workflowService = {
  getAll: () => api.get('/workflows'),
  getByLeaveType: (leaveTypeId) => api.get(`/workflows/leave-type/${leaveTypeId}`),
  create: (data) => api.post('/workflows', data),
  update: (id, data) => api.patch(`/workflows/${id}`, data),
  delete: (id) => api.delete(`/workflows/${id}`),
};
