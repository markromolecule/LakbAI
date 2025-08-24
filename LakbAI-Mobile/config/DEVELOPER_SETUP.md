# 🚀 Quick Developer Setup

## 📱 For New Developers

### 1. Find Your IP Address
```bash
# Mac/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
# Look for IPv4 Address
```

### 2. Update `developerConfig.ts`
```typescript
// CHANGE THIS TO YOUR LOCAL IP ADDRESS
export const DEVELOPER_IP = 'YOUR_IP:8000'; // Your IP

// Add yourself to the developers list
export const DEVELOPER_IPS = {
  joseph: '192.168.254.110:8000',
  yourname: 'YOUR_IP:8000',  // ← Add this line
};

// Set which developer to use
export const CURRENT_DEVELOPER = 'yourname';  // ← Change this
```

### 3. Start PHP Server
```bash
cd LakbAI-API
php -S 0.0.0.0:8000 -t .
```

### 4. Test Connection
```bash
curl http://YOUR_IP:8000/list_users.php
```

## 🔄 For Existing Developers

### Switch Between Developers
```typescript
// In developerConfig.ts
export const CURRENT_DEVELOPER = 'yourname'; // Change this line
```

### Restart PHP Server
```bash
# Kill existing server
pkill -f "php -S"

# Start new server
cd LakbAI-API
php -S 0.0.0.0:8000 -t .
```

## 🧪 Quick Tests

### Test Backend
```bash
curl http://YOUR_IP:8000/list_users.php
```

### Test User Deletion
```bash
curl -X POST http://YOUR_IP:8000/delete_user.php \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1}'
```

### Test Mobile Sync
1. Create user in mobile app
2. Check logs for sync success
3. Verify in database

## 🚨 Common Issues

### "Network request failed"
- Check if PHP server is running
- Verify IP address in developerConfig
- Ensure devices are on same WiFi

### "Unauthorized" errors
- Check Auth0 configuration
- Verify Auth0 Action is deployed
- Check backend API token

## 📞 Need Help?
Check the main `SETUP_GUIDE.md` in the LakbAI-API folder for detailed instructions.
