import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const ACCESS_TOKEN_KEY = 'uqo_access_token';
const REFRESH_TOKEN_KEY = 'uqo_refresh_token';

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

export const setAuthTokens = ({ access, refresh }) => {
  if (access) localStorage.setItem(ACCESS_TOKEN_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
};

export const clearAuthTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;

    if (
      status === 401 &&
      !originalRequest?._retry &&
      !originalRequest?.url?.includes('/auth/login/') &&
      !originalRequest?.url?.includes('/auth/register/') &&
      !originalRequest?.url?.includes('/auth/refresh/')
    ) {
      const refresh = getRefreshToken();
      if (!refresh) {
        clearAuthTokens();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh/`, { refresh });
        const newAccess = refreshResponse.data?.access;
        if (!newAccess) throw new Error('Refresh token invalide');

        setAuthTokens({ access: newAccess, refresh });
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearAuthTokens();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  register: (payload) => api.post('/auth/register/', payload),
  login: (payload) => api.post('/auth/login/', payload),
  me: () => api.get('/auth/me/')
};

export const requestApi = {
  list: () => api.get('/requests/'),
  retrieve: (id) => api.get(`/requests/${id}/`),
  create: (payload) => api.post('/requests/', payload),
  update: (id, payload) => api.patch(`/requests/${id}/`, payload),
  remove: (id) => api.delete(`/requests/${id}/`),
  changeStatus: (id, payload) => api.post(`/requests/${id}/change-status/`, payload),
  listComments: (id) => api.get(`/requests/${id}/comments/`),
  addComment: (id, payload) => api.post(`/requests/${id}/comments/`, payload)
};

export default api;
