import axios from 'axios';

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return '/api';
  return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('medilink_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for centralized error response handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred. Please try again.';

    // If 401 Unauthorized occurs on protected routes, purge token
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('medilink_token');
      localStorage.removeItem('medilink_user');
      // Dispatch custom event for AuthContext to pick up immediately
      window.dispatchEvent(new Event('medilink-auth-logout'));
    }

    const enhancedError = new Error(customMessage);
    enhancedError.statusCode = error.response?.status;
    enhancedError.response = error.response;
    enhancedError.data = error.response?.data;
    return Promise.reject(enhancedError);
  }
);

export default api;
