/**
 * Simple Developer Configuration
 * Each developer should update this file with their own IP address
 */

// CHANGE THIS TO YOUR LOCAL IP ADDRESS
export const DEVELOPER_IP = '192.168.60.123:8000'; // Joseph's IP

// Instructions for co-developers:
// 1. Find your computer's IP address:
//    - Mac: ifconfig | grep "inet " | grep -v 127.0.0.1
//    - Windows: cmd > ipconfig (look for IPv4 Address) 
//    - Linux: ifconfig (look for inet)
// 
// 2. Make sure XAMPP/PHP server is running with:
//    php -S 0.0.0.0:8000 -t /path/to/LakbAI
//    php -S 0.0.0.0:8000 -t .
//
// 3. Update DEVELOPER_IP above with your IP:8000
//
// 4. Both devices must be on the same WiFi network
//
// 5. If you need tunnel mode (network issues), use:
//    npx expo start --tunnel
//    Then update your IP to 'localhost' or use tunnel URL

// Alternative configuration for different developers
export const DEVELOPER_IPS = {
  joseph: '192.168.254.103:8000',
  jiro: 'localhost:8000', // For tunnel mode users
};

// Set which developer to use (change this to your name)
export const CURRENT_DEVELOPER = 'joseph';

// Get the current developer's IP
export const getCurrentDeveloperIP = (): string => {
  return DEVELOPER_IPS[CURRENT_DEVELOPER] || DEVELOPER_IP;
};

// Build the complete API URL
export const buildApiUrl = (): string => {
  const ip = getCurrentDeveloperIP();
  return `http://${ip}/LakbAI/LakbAI-API/routes/api.php`;
};

// Build the complete Auth0 API URL
export const buildAuth0Url = (): string => {
  const ip = getCurrentDeveloperIP();
  // The IP already includes the port, so don't add another one
  return `http://${ip}/routes/auth0.php`;
};

// Get the base URL for the project
export const getBaseUrl = (): string => {
  const ip = getCurrentDeveloperIP();
  return `http://${ip}/LakbAI`;
};

// Helper to log current configuration
export const logCurrentConfig = (): void => {
  console.log('Current Developer Config:');
  console.log('Developer:', CURRENT_DEVELOPER);
  console.log('IP:', getCurrentDeveloperIP());
  console.log('API URL:', buildApiUrl());
  console.log('Auth0 URL:', buildAuth0Url());
  console.log('Base URL:', getBaseUrl());
  console.log('Make sure both devices are on the same WiFi!');
  console.log('If using tunnel mode, IP should be localhost:8000');
};
