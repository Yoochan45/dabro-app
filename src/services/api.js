import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('🚨 API Error:', error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      console.log('🔒 401 Unauthorized - Redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // MASALAH DI SINI! window.location.href menyebabkan reload
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/login', credentials),
  register: (data) => {
    const registerApi = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return registerApi.post('/register', data);
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};

// Berita API
export const beritaAPI = {
  getAll: (params = {}) => api.get('/berita', { params }),
  create: (data) => api.post('/berita', data),
  update: (id, data) => api.put(`/berita/${id}`, data),
  delete: (id) => api.delete(`/berita/${id}`),
};

// Santri API
export const santriAPI = {
  getAll: () => api.get('/santri'),
  create: (data) => api.post('/santri', data),
  update: (id, data) => api.put(`/santri/${id}`, data),
  delete: (id) => api.delete(`/santri/${id}`),
};

// Pembayaran API
export const pembayaranAPI = {
  getAll: (params = {}) => api.get('/pembayaran', { params }),
  verify: (id, status) => api.put(`/pembayaran/${id}/verify`, { status }),
};

// Keaktifan API
export const keaktifanAPI = {
  getAll: (params = {}) => api.get('/keaktifan', { params }),
  create: (data) => api.post('/keaktifan', data),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export default api;