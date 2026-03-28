// Environment-specific Vite configuration
// This file helps configure the API URL for different environments

export const getApiUrl = () => {
  // In production (AWS Amplify), use the environment variable
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || '';
  }
  
  // In development, use localhost
  return 'http://localhost:3001';
};
