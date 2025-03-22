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
      return response.data.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // Get available quests
  getAvailableQuests: async () => {
    try {
      const response = await apiClient.get('/quests/available');
      return response.data.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // Assign quest to user
  assignQuest: async (questId) => {
    try {
      const response = await apiClient.post(`/quests/assign/${questId}`);
      return response.data.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // Get active quests
  getActiveQuests: async () => {
    try {
      const response = await apiClient.get('/quests/active');
      return response.data.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // Get completed quests
  getCompletedQuests: async () => {
    try {
      const response = await apiClient.get('/quests/completed');
      return response.data.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // Complete a quest
  completeQuest: async (questId, proofImage, description) => {
    try {
      const formData = new FormData();
      formData.append('file', proofImage);
      formData.append('description', description || '');

      const response = await apiClient.post(`/quests/complete/${questId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // Get environmental impact
  getEnvironmentalImpact: async () => {
    try {
      const response = await apiClient.get('/quests/impact');
      return response.data.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },
};

export default PointsService;