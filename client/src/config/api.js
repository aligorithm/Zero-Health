// Centralized API configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_BASE_URL = API_URL;

// Helper function to build API URLs
export const buildApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

// Helper function to build upload URLs
export const buildUploadUrl = (filePath) => {
  return `${API_BASE_URL}/uploads/${filePath}`;
};
