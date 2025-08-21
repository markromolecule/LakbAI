import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Network configuration for different developers
const DEVELOPER_CONFIGS: { [key: string]: string } = {
  joseph: '192.168.254.105:8000',  // Local server ko
};

// Auto-detect developer based on device/environment
const getCurrentDeveloper = (): string => {
  // You can use different methods to detect who's running the app
  
  // Method 1: Based on device name/ID (if available)
  const deviceId = Constants.deviceId;
  // You could map device IDs to developers
  
  // Method 2: Based on network (check if certain IPs are reachable)
  // This would require additional network detection code
  
  // Method 3: Manual environment variable (simplest)
  // Set this in each developer's environment
  
  // For now, default to the first developer (Joseph)
  return 'joseph';
};

// Get the API base URL based on environment
const getApiBaseUrl = (): string => {
  if (__DEV__) {
    // Development mode - use local server
    const developer = getCurrentDeveloper();
    const ip = DEVELOPER_CONFIGS[developer] || DEVELOPER_CONFIGS.joseph;
    return `http://${ip}/LakbAI-API/routes/api.php`;
  } else {
    // Production mode - use production server
    return 'https://your-production-domain.com/LakbAI-API/routes/api.php';
  }
};

// Export the configuration
export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

// Helper function for co-developers to easily set their IP
export const setDeveloperIP = (developerName: string, ipAddress: string): void => {
  DEVELOPER_CONFIGS[developerName] = ipAddress;
  console.log(`Developer ${developerName} IP set to: ${ipAddress}`);
};

// Debug function to show current configuration (development only)
export const debugApiConfig = (): void => {
  if (__DEV__) {
    console.log('API Configuration:', API_CONFIG.BASE_URL);
  }
};

export default API_CONFIG;
