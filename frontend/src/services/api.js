import axios from 'axios';

// Base Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiry / unauth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('admin_token');
      // Redirect to login only if in admin dashboard context
      if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.success && response.data.token) {
      localStorage.setItem('admin_token', response.data.token);
    }
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('admin_token');
  },
  isAuthenticated: () => {
    return !!localStorage.getItem('admin_token');
  },
};

export const jobService = {
  getActiveJobs: async () => {
    const response = await api.get('/jobs');
    return response.data;
  },
  getAllJobs: async () => {
    const response = await api.get('/jobs/all/list');
    return response.data;
  },
  getJobById: async (id) => {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
  },
  createJob: async (jobData) => {
    const response = await api.post('/jobs', jobData);
    return response.data;
  },
  updateJob: async (id, jobData) => {
    const response = await api.put(`/jobs/${id}`, jobData);
    return response.data;
  },
  deleteJob: async (id) => {
    const response = await api.delete(`/jobs/${id}`);
    return response.data;
  },
};

export const applicationService = {
  createApplication: async (formData) => {
    // Note: Content-Type is overridden automatically by browser for FormData
    const response = await api.post('/applications', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  getApplications: async (params = {}) => {
    const response = await api.get('/applications', { params });
    return response.data;
  },
  getApplicationById: async (id) => {
    const response = await api.get(`/applications/${id}`);
    return response.data;
  },
  updateApplicationStatus: async (id, status) => {
    const response = await api.put(`/applications/${id}/status`, { status });
    return response.data;
  },
  deleteApplication: async (id) => {
    const response = await api.delete(`/applications/${id}`);
    return response.data;
  },
  
  // HR Notes
  addNote: async (id, content) => {
    const response = await api.post(`/applications/${id}/notes`, { content });
    return response.data;
  },
  editNote: async (id, noteId, content) => {
    const response = await api.put(`/applications/${id}/notes/${noteId}`, { content });
    return response.data;
  },
  deleteNote: async (id, noteId) => {
    const response = await api.delete(`/applications/${id}/notes/${noteId}`);
    return response.data;
  },

  // Excel/CSV Exports (returns file as blob)
  exportApplications: async (params = {}, format = 'xlsx') => {
    const response = await api.get('/applications/export', {
      params: { ...params, format },
      responseType: 'blob',
    });
    return response.data;
  },
};

export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard');
    return response.data;
  },
};

export default api;
