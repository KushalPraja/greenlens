import apiClient from './api';

const AuthService = {
  // Register new user
  register: async (userData) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        // Fetch full user data after registration
        try {
          const userData = await AuthService.getCurrentUser();
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', credentials.email);
      formData.append('password', credentials.password);

      const response = await apiClient.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        // Fetch full user data after login
        try {
          const userData = await AuthService.getCurrentUser();
          localStorage.setItem('user', JSON.stringify(userData));
          return { ...response.data, user: userData };
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // Logout user
  logout: async () => {
    try {
      await apiClient.get('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    }
  },

  // Get current user profile
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/auth/me');
      if (response.data) {
        // Store the updated user data
        localStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
      }
      throw new Error('No user data received');
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (userData) => {
    try {
      const response = await apiClient.put('/auth/updatedetails', userData);
      if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // Update password
  updatePassword: async (passwordData) => {
    try {
      const response = await apiClient.put('/auth/updatepassword', passwordData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // Check if user is logged in
  isLoggedIn: () => {
    if (typeof window === 'undefined') return false;
    return Boolean(localStorage.getItem('token'));
  },

  // Get current user data from localStorage
  getUser: () => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

export default AuthService;