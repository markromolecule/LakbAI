# Auth0 Network Request Failed - Troubleshooting Guide

## 🔍 Problem Analysis

Your Auth0 authentication flow is failing at the token exchange step with a "Network request failed" error. This occurs because:

### Root Causes Identified:

1. **Backend Server Not Running** ❌
   - The PHP backend server on port 8000 is not active
   - Mobile app cannot reach the token exchange endpoint

2. **Redirect URI Mismatch** ❌ **FIXED** ✅
   - Was: `com.lakbai.mobile://auth`
   - Now: `lakbaimobile://auth` (matches your logs)

3. **Missing PHP Environment** ❌ **FIXED** ✅
   - PHP was not installed in the environment
   - Now installed with required extensions

## 🛠️ Solutions Applied

### 1. Fixed Redirect URI Configuration
```typescript
// Fixed in: LakbAI-Mobile/config/auth0Config.ts
redirectUri: 'lakbaimobile://auth', // Now matches your Auth0 app logs
```

### 2. Created Server Startup Script
```bash
# Run this to start your backend:
./start_server.sh
```

### 3. Installed PHP Environment
- PHP 8.x with curl, json, mbstring, mysql extensions
- Ready to serve your Auth0 backend endpoints

## 🚀 How to Fix the Network Issue

### Step 1: Start the Backend Server
```bash
cd /workspace
./start_server.sh
```

This will:
- Start PHP server on `0.0.0.0:8000`
- Serve your Auth0 endpoint at: `http://[YOUR_IP]:8000/routes/auth0.php`
- Enable token exchange functionality

### Step 2: Verify Network Configuration

Check your current API configuration:
```typescript
// In LakbAI-Mobile/config/apiConfig.ts
// Make sure the IP address is reachable from your mobile device
const DEVELOPER_CONFIGS = {
  joseph: '192.168.254.110',  // ← This IP must be reachable
}
```

### Step 3: Test the Connection

1. Start the server: `./start_server.sh`
2. Test endpoint: `curl http://localhost:8000/routes/auth0.php`
3. Should return: `{"status":"error","message":"No action provided"}`

## 🔧 Alternative Solutions

### Option A: Use Tunnel Mode (Recommended for Development)
```typescript
// In your mobile app, call:
import { setTunnelMode } from '../config/apiConfig';
setTunnelMode(true, 8000);
```

### Option B: Use ngrok for External Access
```bash
# Install ngrok
npm install -g ngrok

# Start your PHP server
./start_server.sh

# In another terminal, expose it:
ngrok http 8000

# Update your mobile app to use the ngrok URL
```

### Option C: Update Network Configuration
```typescript
// Add your actual network IP to apiConfig.ts
const DEVELOPER_CONFIGS = {
  joseph: 'YOUR_ACTUAL_IP_HERE',  // Get with: ip addr show
}
```

## 📋 Quick Checklist

- [x] Fixed redirect URI mismatch
- [x] Installed PHP and extensions
- [x] Created server startup script
- [ ] **START THE BACKEND SERVER** ← **DO THIS NOW**
- [ ] Test mobile app authentication
- [ ] Verify network connectivity

## 🆘 If Still Not Working

1. **Check Server Status:**
   ```bash
   curl http://localhost:8000/routes/auth0.php
   ```

2. **Check Network Connectivity:**
   ```bash
   # From mobile device network, test:
   curl http://192.168.254.110:8000/routes/auth0.php
   ```

3. **Enable Debug Mode:**
   ```typescript
   // In your mobile app
   import { debugApiConfig } from '../config/apiConfig';
   debugApiConfig(); // Check console for current API URL
   ```

## 🎯 Expected Flow After Fix

1. ✅ Mobile app starts Auth0 authentication
2. ✅ PKCE challenge generated correctly
3. ✅ Auth0 returns authorization code
4. ✅ Mobile app calls backend token exchange
5. ✅ Backend successfully exchanges code for tokens
6. ✅ Authentication completes successfully

---

**Next Step:** Run `./start_server.sh` to start your backend server! 🚀