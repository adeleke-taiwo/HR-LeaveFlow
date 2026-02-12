import api from './api';

export const leaveService = {
  create: (data) => api.post('/leaves', data),
  getMyLeaves: (params) => api.get('/leaves/my', { params }),
  getTeamLeaves: (params) => api.get('/leaves/team', { params }),
  getAllLeaves: (params) => api.get('/leaves', { params }),
  getCalendarLeaves: (params) => api.get('/leaves/calendar', { params }),
  getById: (id) => api.get(`/leaves/${id}`),
  updateStatus: (id, data) => api.patch(`/leaves/${id}/status`, data),
  cancel: (id) => api.patch(`/leaves/${id}/cancel`),
  delete: (id) => api.delete(`/leaves/${id}`),

  // Reports & Analytics
  exportLeaves: (params, format) =>
    api.get(`/leaves/export`, {
      params: { ...params, format },
      responseType: 'blob'
    }),
  getAnnualReport: (userId, year) =>
    api.get(`/leaves/reports/annual/${userId}/${year}`),
  getDepartmentAnalytics: (deptId, params) =>
    api.get(`/leaves/reports/department/${deptId}`, { params }),
  getUpcomingLeaves: (days) =>
    api.get(`/leaves/upcoming`, { params: { days } }),
  getLeaveStats: (params) =>
    api.get(`/leaves/stats`, { params }),
};
