import api from './api';

export const userService = {
  getAll: (params) => api.get('/users', { params }),
  getUsers: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.patch(`/users/${id}`, data),
  updateRole: (id, data) => api.patch(`/users/${id}/role`, data),
  deactivate: (id) => api.patch(`/users/${id}/deactivate`),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

export const departmentService = {
  getAll: () => api.get('/departments'),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.patch(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

export const leaveBalanceService = {
  getMyBalances: () => api.get('/leave-balances/my'),
  getUserBalances: (userId) => api.get(`/leave-balances/user/${userId}`),
  allocate: (data) => api.post('/leave-balances/allocate', data),
  adjust: (id, data) => api.patch(`/leave-balances/${id}`, data),
};
