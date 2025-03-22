import apiClient from './api';

const PointsService = {
  // Get user points history
  getPointsHistory: async () => {
    try {
      const response = await apiClient.get('/points/history');
      return response.data.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // Add points to user
  addPoints: async (pointsData) => {
    try {
      const response = await apiClient.post('/points/add', pointsData);
      return response.data.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // Record a sustainable action
  recordSustainableAction: async (actionData) => {
    try {
      const response = await apiClient.post('/points/record-action', actionData);
      return response.data.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // Get leaderboard
  getLeaderboard: async (page = 1, timeframe = 'all') => {
    try {
      const response = await apiClient.get(`/leaderboard?page=${page}&timeframe=${timeframe}`);
      return response.data.data;  // Return the data property which contains users and pagination
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  }
};

export default PointsService;