import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
}

// Complaints
export const complaintsAPI = {
  create: (formData) =>
    api.post('/complaints', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  list: (params) => api.get('/complaints', { params }),
  getById: (id) => api.get(`/complaints/${id}`),
  updateStatus: (id, data) => api.put(`/complaints/${id}/status`, data),
  addResponse: (id, data) => api.post(`/complaints/${id}/response`, data),
  addNote: (id, data) => api.post(`/complaints/${id}/notes`, data),
  submitFeedback: (id, data) => api.post(`/complaints/${id}/feedback`, data),
  assign: (id, data) => api.put(`/complaints/${id}/assign`, data),
  myComplaints: (params) => api.get('/complaints/my', { params }),
}

// Appeals
export const appealsAPI = {
  create: (data) => api.post('/appeals', data),
  list: (params) => api.get('/appeals', { params }),
  getById: (id) => api.get(`/appeals/${id}`),
  resolve: (id, data) => api.put(`/appeals/${id}/resolve`, data),
  myAppeals: (params) => api.get('/appeals/my', { params }),
}

// Analytics
export const analyticsAPI = {
  getStats: (params) => api.get('/analytics/stats', { params }),
  getPerformance: (params) => api.get('/analytics/performance', { params }),
  getTrends: (params) => api.get('/analytics/trends', { params }),
  exportReport: (params) => api.get('/analytics/export', { params, responseType: 'blob' }),
  getDepartmentStats: (params) => api.get('/analytics/department-stats', { params }),
}

// Admin
export const adminAPI = {
  getUsers: (params) => api.get('/admin/users', { params }),
  getDepartments: (params) => api.get('/admin/departments', { params }),
  assignComplaint: (id, data) => api.put(`/admin/complaints/${id}/assign`, data),
  getSystemStats: () => api.get('/admin/stats'),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
}

// Departments
export const departmentsAPI = {
  getComplaints: (params) => api.get('/department/complaints', { params }),
  getStats: () => api.get('/department/stats'),
  updateComplaint: (id, data) => api.put(`/department/complaints/${id}`, data),
  getList: () => api.get('/departments'),
}

export default api
