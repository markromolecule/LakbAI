# 🚀 Developer Setup Guide

## For Co-Developers: Setting Up the API Connection

When you clone this project and want to run it on your own device, you'll need to update the API configuration to point to your local development server.

### 📋 Quick Setup Steps:

#### 1. **Find Your Computer's IP Address**

**Mac:**
```bash
ifconfig en0 | grep "inet " | head -1
# Look for: inet 192.168.x.x
```

**Windows:**
```cmd
ipconfig
# Look for: IPv4 Address. . . . . . . . . . . : 192.168.x.x
```

**Linux:**
```bash
ip addr show | grep "inet " | grep -v 127.0.0.1
```

#### 2. **Start Your PHP Development Server**

Make sure to start the server to accept connections from any IP:

```bash
cd /path/to/LakbAI
php -S 0.0.0.0:8000 -t .
```

**Important:** Use `0.0.0.0:8000` not `localhost:8000` so mobile devices can connect!

#### 3. **Update the API Configuration**

**Option A - Simple (Recommended):**
Update `config/developerConfig.ts`:
```typescript
export const CURRENT_DEVELOPER = 'yourname'; // Change this to your name
export const DEVELOPER_IPS = {
  joseph: '192.168.254.102:8000',
  yourname: '192.168.1.105:8000', // Add your IP here
};
```

**Option B - Quick Change:**
Update `shared/services/authService.ts` line 2:
```typescript
// Change this line to your IP:
import { API_CONFIG } from '../../config/apiConfig';
// Or temporarily hardcode:
// const API_BASE_URL = 'http://YOUR_IP:8000/LakbAI-API/routes/api.php';
```

#### 4. **Test the Connection**

1. **Test in mobile browser:** Open `http://YOUR_IP:8000/LakbAI-API/mobile-test.php`
2. **If successful:** You'll see a JSON success message
3. **If fails:** Check WiFi network, firewall, or IP address

#### 5. **Run the Mobile App**

```bash
npm start
# or
expo start
```

### 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Network request failed" | Check if both devices are on same WiFi |
| "Connection refused" | Make sure PHP server is running with `0.0.0.0:8000` |
| "Timeout" | Check firewall settings, try different IP |
| "Wrong IP" | Double-check your computer's IP address |

### 🌐 Network Requirements

- ✅ **Same WiFi Network:** Both computer and mobile device must be connected to the same WiFi
- ✅ **PHP Server Running:** Must use `0.0.0.0:8000` not `localhost:8000`
- ✅ **Firewall:** May need to allow incoming connections on port 8000
- ✅ **IP Address:** Use your computer's actual IP, not 127.0.0.1 or localhost

### 📱 Multiple Developers

Each developer should add their configuration to `config/developerConfig.ts`:

```typescript
export const DEVELOPER_IPS = {
  joseph: '192.168.254.102:8000',    // Original developer
  maria: '192.168.1.105:8000',       // Co-developer 1
  john: '10.0.0.23:8000',            // Co-developer 2
  alex: '192.168.0.15:8000',         // Co-developer 3
};

// Each person sets their name here:
export const CURRENT_DEVELOPER = 'maria'; // Change to your name
```

### 🚀 Production Deployment

For production, the API URL will automatically switch to:
```
https://your-production-domain.com/LakbAI-API/routes/api.php
```

No manual changes needed when building for production!

---

**Need Help?** 
- Check the terminal logs for connection attempts
- Use the debug functions: `debugApiConfig()` and `logCurrentConfig()`
- Test the connection in your mobile browser first
