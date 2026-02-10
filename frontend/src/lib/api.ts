import axios from 'axios';
import { config } from './env';
const API_BASE_URL = config.apiUrl;
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for handling 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth state and redirect to login
      window.dispatchEvent(new CustomEvent('auth:logout'));
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
};

// User API
export const userApi = {
  getMe: () => api.get('/user/me'),
  updateProfile: (data: { name?: string; email?: string; password?: string }) =>
    api.patch('/user/me', data), 
  getAllUsers: () => api.get('/user/all'), 
}
// Task API
export const taskApi = {
  getAll: () => api.get('/tasks'),
  getAssigned: () => api.get('/tasks/me'),
  getCreated: () => api.get('/tasks/created'),
  getFiltered: (params: { status?: string; priority?: string; sort?: string }) =>
    api.get('/tasks/filtered', { params }),
  create: (data: {
    title: string;
    description?: string;
    dueDate: string;
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    status: 'ToDo' | 'InProgress' | 'Review' | 'Completed';
    assignedToId?: string;
  }) => api.post('/tasks', data),
  update: (id: string, data: Partial<{
    title: string;
    description: string;
    dueDate: string;
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    status: 'ToDo' | 'InProgress' | 'Review' | 'Completed';
    assignedToId: string;
  }>) => api.patch(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
};

export default api;