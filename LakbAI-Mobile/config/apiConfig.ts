import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Network configuration for different developers
const DEVELOPER_CONFIGS: { [key: string]: string } = {
  joseph: '192.168.254.103',
  jiro: '192.168.254.111',  
};

// Tunnel mode configuration
const TUNNEL_CONFIG = {
  enabled: false,  // Set to true if using tunnel mode
  port: 8000,     // Port for your PHP server
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
    const ip = DEVELOPER_CONFIGS[developer] || DEVELOPER_CONFIGS.jiro;
    
    console.log('API Config Debug:', {
      developer,
      ip,
      tunnelEnabled: TUNNEL_CONFIG.enabled
    });
    
    // Check if tunnel mode is enabled
    if (TUNNEL_CONFIG.enabled) {
      return `http://localhost:${TUNNEL_CONFIG.port}/LakbAI/LakbAI-API/routes/api.php`;
    }
    
    // Check if the IP already includes a port (like 192.168.254.110:8000)
    if (ip.includes(':')) {
      return `http://${ip}/LakbAI/LakbAI-API/routes/api.php`;
    }
    
    // Regular LAN mode (no port specified) - add port 8000
    return `http://${ip}:8000/LakbAI/LakbAI-API/routes/api.php`;
  } else {
    // Production mode - use production server
    return 'https://your-production-domain.com/LakbAI/LakbAI-API/routes/api.php';
  }
};

// Export the configuration
export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

// Also export a function to get the base URL dynamically
export const getBaseUrl = (): string => {
  const url = getApiBaseUrl();
  console.log('🌐 getBaseUrl() returning:', url);
  return url;
};

// Helper function for co-developers to easily set their IP
export const setDeveloperIP = (developerName: string, ipAddress: string): void => {
  DEVELOPER_CONFIGS[developerName] = ipAddress;
  console.log(`Developer ${developerName} IP set to: ${ipAddress}`);
};

// Helper function to enable/disable tunnel mode
export const setTunnelMode = (enabled: boolean, port: number = 8000): void => {
  TUNNEL_CONFIG.enabled = enabled;
  TUNNEL_CONFIG.port = port;
  console.log(`Tunnel mode ${enabled ? 'enabled' : 'disabled'} on port ${port}`);
};

// Helper function for co-developers to easily configure their environment
export const configureForCoDeveloper = (developerName: string, useTunnel: boolean = false, ipAddress?: string, port: number = 8000): void => {
  // Set developer name
  if (ipAddress) {
    setDeveloperIP(developerName, ipAddress);
  }
  
  // Set tunnel mode
  setTunnelMode(useTunnel, port);
  
  console.log(`Configuration set for ${developerName}:`);
  console.log(`- Developer: ${developerName}`);
  console.log(`- Tunnel Mode: ${useTunnel ? 'Enabled' : 'Disabled'}`);
  console.log(`- Port: ${port}`);
  if (ipAddress) {
    console.log(`- IP Address: ${ipAddress}`);
  }
  console.log(`- API URL: ${getApiBaseUrl()}`);
};

export default API_CONFIG;
