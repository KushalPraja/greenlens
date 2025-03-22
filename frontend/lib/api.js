import axios from 'axios';

const API_URL = 'https://green.wittyhill-45f93eb6.canadaeast.azurecontainerapps.io/';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach token to requests
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage (browser) or session storage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    
    // Handle authentication errors (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Redirect to login page
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/auth/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;