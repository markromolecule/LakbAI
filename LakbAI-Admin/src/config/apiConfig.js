/**
 * API Configuration for LakbAI Admin Panel
 * Handles dynamic IP addresses for different developers and networks
 */

// Developer configurations - each developer should update their IP here
const DEVELOPER_CONFIGS = {
  joseph: '192.168.254.110',
  jiro: '192.168.254.111',
  localhost: 'localhost'
};

// Current developer - change this to your name
const CURRENT_DEVELOPER = 'localhost';

// Get the current developer's IP
const getCurrentDeveloperIP = () => {
  return DEVELOPER_CONFIGS[CURRENT_DEVELOPER] || DEVELOPER_CONFIGS.joseph;
};

// Build the complete API base URL
const buildApiUrl = () => {
  const ip = getCurrentDeveloperIP();
  return `http://${ip}/LakbAI/LakbAI-API/routes/api.php`;
};

// Get the base URL for the project
const getBaseUrl = () => {
  const ip = getCurrentDeveloperIP();
  return `http://${ip}/LakbAI/LakbAI-API/routes/api.php`;
};

// Helper to log current configuration
const logCurrentConfig = () => {
  console.log('Admin Panel API Configuration:');
  console.log('Developer:', CURRENT_DEVELOPER);
  console.log('IP:', getCurrentDeveloperIP());
  console.log('API URL:', buildApiUrl());
  console.log('Base URL:', getBaseUrl());
  console.log('Make sure your XAMPP server is running on this IP!');
};

// Export the configuration
export const API_CONFIG = {
  BASE_URL: buildApiUrl(),
  CURRENT_DEVELOPER,
  getCurrentDeveloperIP,
  buildApiUrl,
  getBaseUrl,
  logCurrentConfig
};

// Default export
export default API_CONFIG;
