import api from './api';

export const leaveTypeService = {
  getAll: () => api.get('/leave-types'),
  getById: (id) => api.get(`/leave-types/${id}`),
  create: (data) => api.post('/leave-types', data),
  update: (id, data) => api.patch(`/leave-types/${id}`, data),
  delete: (id) => api.delete(`/leave-types/${id}`),
};
