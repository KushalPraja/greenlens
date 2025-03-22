import apiClient from './api';

const ImageService = {
  // Upload and analyze an image
  analyzeImage: async (formData) => {
    try {
      const response = await apiClient.post('/image/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data || !response.data.success) {
        throw new Error(response.data?.detail || 'Failed to analyze image');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Image analysis error:', error);
      throw error.response?.data || { detail: error.message };
    }
  },

  // Identify what's in an image
  identifyImage: async (formData) => {
    try {
      const response = await apiClient.post('/image/identify', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data || !response.data.success) {
        throw new Error(response.data?.detail || 'Failed to identify image');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Image identification error:', error);
      throw error.response?.data || { detail: error.message };
    }
  },

  // Find eco-friendly products based on location and query
  findLocalProducts: async (searchData) => {
    try {
      const response = await apiClient.post('/image/find-products', searchData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.detail || 'Failed to find products');
      }
      
      return response.data;
    } catch (error) {
      console.error('Product search error:', error);
      throw error.response?.data || { detail: error.message };
    }
  }
};

export default ImageService;