# Windows Developer Setup Guide

## 🚨 Critical Issues Identified

After analyzing your mobile app configuration, here are the main connection problems Windows developers face:

## 📋 Configuration Files Analysis

### 1. **developerConfig.ts** - Main Issue
```typescript
// Current configuration:
export const DEVELOPER_IP = '192.168.254.105:8000'; // Joseph's IP

// Problem: Windows developers need to change this to their IP
// Solution: Use tunnel mode or update with Windows IP
```

### 2. **apiConfig.ts** - Tunnel Configuration
```typescript
// Current configuration:
const TUNNEL_CONFIG = {
  enabled: false,  // This should be true for Windows developers
  port: 8000,
};
```

### 3. **Connection Flow Issues**
- Auth0 authentication uses `buildAuth0Url()` from developerConfig
- Session management uses `buildAuth0Url()` for API calls
- All API calls depend on correct IP configuration

## 🔧 Step-by-Step Windows Fix

### **Option 1: Tunnel Mode (Recommended)**

1. **Update developerConfig.ts**:
   ```typescript
   // File: LakbAI-Mobile/config/developerConfig.ts
   export const DEVELOPER_IP = 'localhost:8000'; // For tunnel mode
   ```

2. **Update apiConfig.ts**:
   ```typescript
   // File: LakbAI-Mobile/config/apiConfig.ts
   const TUNNEL_CONFIG = {
     enabled: true,  // Enable tunnel mode
     port: 8000,
   };
   ```

3. **Start services**:
   ```bash
   # Terminal 1: Start PHP API
   cd LakbAI-API
   php -S 0.0.0.0:8000
   
   # Terminal 2: Start Mobile with Tunnel
   cd LakbAI-Mobile
   npx expo start --tunnel
   ```

### **Option 2: Direct IP Mode**

1. **Find your Windows IP**:
   ```bash
   # Command Prompt:
   ipconfig
   # Look for "IPv4 Address" under your WiFi adapter
   # Example: 192.168.1.100
   ```

2. **Update developerConfig.ts**:
   ```typescript
   // File: LakbAI-Mobile/config/developerConfig.ts
   export const DEVELOPER_IP = '192.168.1.100:8000'; // Your Windows IP
   ```

3. **Start services**:
   ```bash
   # Terminal 1: Start PHP API
   cd LakbAI-API
   php -S 0.0.0.0:8000
   
   # Terminal 2: Start Mobile
   cd LakbAI-Mobile
   npx expo start
   ```

## 🚨 Common Windows Issues

### **Issue 1: Connection Refused**
```bash
# Error: Network request failed
# Error: Connection refused on port 8000
```

**Root Cause**: PHP server not accessible from mobile device

**Solutions**:
1. Use `php -S 0.0.0.0:8000` (not `localhost:8000`)
2. Enable Windows Firewall for Node.js and PHP
3. Use tunnel mode: `npx expo start --tunnel`

### **Issue 2: Auth0 Redirect URI Mismatch**
```bash
# Error: Auth0 authentication failed
# Error: Redirect URI mismatch
```

**Root Cause**: Auth0 callback URLs don't match tunnel URLs

**Solutions**:
1. When using tunnel, get tunnel URL from Expo
2. Add tunnel URL to Auth0 dashboard:
   ```
   Allowed Callback URLs:
   - lakbaimobile://auth
   - exp://YOUR_TUNNEL_URL/--/auth
   ```

### **Issue 3: API Endpoints Not Found**
```bash
# Error: 404 Not Found
# Error: API endpoint not accessible
```

**Root Cause**: Incorrect API URL construction

**Solutions**:
1. Check `buildApiUrl()` function in developerConfig.ts
2. Verify PHP server is running on correct port
3. Test API directly: `http://YOUR_IP:8000/LakbAI/LakbAI-API/routes/api.php`

## 🔍 Debugging Steps

### **Test API Connection**
```bash
# 1. Start PHP server:
cd LakbAI-API
php -S 0.0.0.0:8000

# 2. Test from mobile browser:
# Open browser on phone/tablet
# Navigate to: http://YOUR_IP:8000/LakbAI/LakbAI-API/routes/api.php
# Should see JSON response or error page (not connection refused)
```

### **Test Auth0 Connection**
```bash
# 1. Start mobile app with tunnel:
cd LakbAI-Mobile
npx expo start --tunnel

# 2. Copy tunnel URL (e.g., https://abc123.tunnel.dev)
# 3. Add to Auth0 dashboard:
# exp://abc123.tunnel.dev/--/auth
```

### **Check Configuration**
```bash
# Add this to your mobile app to debug:
import { logCurrentConfig } from './config/developerConfig';

// Call this in your app to see current config:
logCurrentConfig();
```

## 📱 Mobile App Configuration

### **Current Configuration Issues**

1. **developerConfig.ts**:
   - Hardcoded to Joseph's IP
   - Windows developers need to update this
   - Tunnel mode not properly configured

2. **apiConfig.ts**:
   - Tunnel mode disabled by default
   - Windows developers should enable this

3. **Auth0 Configuration**:
   - Redirect URIs need tunnel URLs for Windows developers
   - Mobile app scheme needs to match Auth0 settings

## 🚀 Quick Fix Commands

```bash
# For Windows developers having connection issues:

# 1. Clear all caches
cd LakbAI-Mobile
npx expo start --clear

# 2. Use tunnel mode
npx expo start --tunnel

# 3. Update config to localhost
# Edit config/developerConfig.ts:
export const DEVELOPER_IP = 'localhost:8000';

# 4. Restart PHP server
cd LakbAI-API
php -S 0.0.0.0:8000
```

## 🔧 Configuration Files to Update

### **File 1: developerConfig.ts**
```typescript
// Change this line:
export const DEVELOPER_IP = 'localhost:8000'; // For tunnel mode

// Or use your Windows IP:
export const DEVELOPER_IP = '192.168.1.100:8000'; // Your IP
```

### **File 2: apiConfig.ts**
```typescript
// Enable tunnel mode:
const TUNNEL_CONFIG = {
  enabled: true,  // Set to true for Windows developers
  port: 8000,
};
```

### **File 3: Auth0 Dashboard**
```
Allowed Callback URLs:
- lakbaimobile://auth
- exp://127.0.0.1:8081/--/auth
- exp://localhost:8081/--/auth
- exp://YOUR_TUNNEL_URL/--/auth (when using tunnel)
```

## 📞 Support

If you're still having issues:

1. **Check the main README.md** for complete troubleshooting
2. **Use tunnel mode** - it's more reliable for Windows developers
3. **Test API connection** from mobile browser first
4. **Check Windows Firewall** settings
5. **Ensure all devices are on same WiFi network**

The main issue is that Windows developers need to either:
- Update the IP address in developerConfig.ts to their Windows IP
- OR use tunnel mode with localhost configuration

Tunnel mode is recommended as it works through firewalls and doesn't require finding IP addresses.
