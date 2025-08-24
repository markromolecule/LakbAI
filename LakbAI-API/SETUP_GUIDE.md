# 🚀 LakbAI Development Setup Guide

## 📋 Overview
This guide helps you set up the LakbAI project for development, including Auth0 integration, database sync, and mobile app connectivity.

## 🛠️ Prerequisites
- **XAMPP** (for local PHP/MySQL server)
- **Node.js** (for React/React Native development)
- **Auth0 Account** (for authentication)
- **Git** (for version control)

---

## Database Setup

### 1. Start XAMPP
```bash
# Start Apache and MySQL services
# Make sure MySQL is running on port 3306
```

### 2. Create Database
```sql
-- Run this in phpMyAdmin or MySQL command line
CREATE DATABASE IF NOT EXISTS lakbai_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Import Database Schema
The database schema is automatically created when you first run the sync endpoint. The `users` table will be created with all necessary Auth0 fields.

---

## Backend Setup (LakbAI-API)

### 1. Start PHP Development Server
```bash
cd LakbAI-API
php -S 0.0.0.0:8000 -t .
```

### 2. Verify Backend is Running
```bash
curl http://YOUR_IP:8000/list_users.php
```

### 3. Available Endpoints
- **List Users**: `GET /list_users.php`
- **Delete User**: `POST /delete_user.php` (with `{"user_id": X}`)
- **Auth0 Sync**: `POST /routes/auth0_sync_routes.php` (Auth0 Action endpoint)

---

## Auth0 Configuration

### 1. Auth0 Dashboard Setup
1. **Create Application**: Create a new Single Page Application
2. **Configure URLs**:
   - Allowed Callback URLs: `http://localhost:5173, http://localhost:3000`
   - Allowed Logout URLs: `http://localhost:5173, http://localhost:3000`
   - Allowed Web Origins: `http://localhost:5173, http://localhost:3000`

### 2. Auth0 Action Setup
1. **Create Action**: "Post User Registration"
2. **Add Code**: Copy from `auth0-actions/post-user-registration.js`
3. **Add Secrets**:
   - `BACKEND_API_URL`: `http://YOUR_IP:8000`
   - `BACKEND_API_TOKEN`: `NYDdY3H1YuNB+yIkkSF9om8Eb1fT/ykDhFwYsucd19A=`
4. **Deploy Action**

### 3. Auth0 Rule Setup
1. **Create Rule**: "LakbAI Role Assignment"
2. **Add Code**: Copy from `auth0-rules/lakbai-role-assignment.js`
3. **Deploy Rule**

---

## Mobile App Setup (LakbAI-Mobile)

### 1. Update Developer Configuration
Edit `LakbAI-Mobile/config/developerConfig.ts`:

```typescript
// CHANGE THIS TO YOUR LOCAL IP ADDRESS
export const DEVELOPER_IP = 'YOUR_IP:8000'; // Your IP

// Alternative configuration for different developers
export const DEVELOPER_IPS = {
  yourname: 'YOUR_IP:8000',
  // Add other developers here
};

// Set which developer to use
export const CURRENT_DEVELOPER = 'yourname';
```

### 2. Find Your IP Address
```bash
# Mac/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
# Look for IPv4 Address
```

### 3. Update Auth0 Configuration
Edit `LakbAI-Mobile/config/auth0Config.ts`:

```typescript
export const auth0Config = {
  domain: 'YOUR_AUTH0_DOMAIN',
  clientId: 'YOUR_CLIENT_ID',
  // ... other config
};
```

### 4. Start Mobile App
```bash
cd LakbAI-Mobile
npm start
# or
expo start
```

---

## 🖥️ Admin Panel Setup (LakbAI-Admin)

### 1. Install Dependencies
```bash
cd LakbAI-Admin
npm install
```

### 2. Update Auth0 Configuration
Edit `LakbAI-Admin/src/config/auth0Config.js`:

```javascript
export const auth0Config = {
  domain: 'YOUR_AUTH0_DOMAIN',
  clientId: 'YOUR_CLIENT_ID',
  // ... other config
};
```

### 3. Start Admin Panel
```bash
npm run dev
```

---

## 🔄 Sync Flow Overview

### Mobile App Flow
```
Mobile App → Auth0 Signup → Auth0 Action → Backend Sync → Database
```

### Admin Panel Flow
```
Admin Panel → Auth0 Signup → Auth0 Action → Backend Sync → Database
```

### Auth0 Action Flow
```
Auth0 User Created → Post User Registration Action → Backend API → Database
```

---

## Testing

### 1. Test Database Connection
```bash
curl http://YOUR_IP:8000/list_users.php
```

### 2. Test User Deletion
```bash
curl -X POST http://YOUR_IP:8000/delete_user.php \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1}'
```

### 3. Test Mobile App Sync
1. Create a user in mobile app
2. Check logs for sync success
3. Verify user appears in database

### 4. Test Admin Panel Sync
1. Create a driver account in admin panel
2. Verify driver appears in database with `user_type: 'driver'`

---

## Troubleshooting

### Common Issues

#### 1. "Network request failed" in Mobile App
- **Solution**: Check if PHP server is running on correct IP
- **Check**: `curl http://YOUR_IP:8000/list_users.php`

#### 2. Auth0 sync not working
- **Solution**: Verify Auth0 Action is deployed and secrets are set
- **Check**: Auth0 Dashboard → Actions → Logs

#### 3. Database connection failed
- **Solution**: Ensure MySQL is running in XAMPP
- **Check**: phpMyAdmin is accessible

#### 4. Mobile app can't connect
- **Solution**: Ensure both devices are on same WiFi network
- **Check**: IP address is correct in developerConfig

### Debug Commands
```bash
# Check if PHP server is running
ps aux | grep "php -S"

# Check database connection
curl http://YOUR_IP:8000/list_users.php

# Test Auth0 sync endpoint
curl -X POST http://YOUR_IP:8000/routes/auth0_sync_routes.php \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test" \
  -H "X-User-Sync: frontend-triggered" \
  -d '{"email": "test@test.com", "name": "Test User"}'
```

---

## Project Structure

```
LakbAI/
├── LakbAI-API/                 # Backend (PHP)
│   ├── controllers/            # API Controllers
│   ├── routes/                 # API Routes
│   ├── config/                 # Configuration
│   └── delete_user.php         # User Management
├── LakbAI-Mobile/              # Mobile App (React Native)
│   ├── config/                 # Configuration
│   ├── shared/services/        # Services
│   └── screens/                # App Screens
├── LakbAI-Admin/               # Admin Panel (React)
│   ├── src/config/             # Configuration
│   ├── src/services/           # Services
│   └── src/features/           # Features
├── auth0-actions/              # Auth0 Actions
├── auth0-rules/                # Auth0 Rules
└── SETUP_GUIDE.md             # This file
```

---

## 🔄 Development Workflow

### For New Features
1. Update `developerConfig.ts` with your IP
2. Start PHP server: `php -S 0.0.0.0:8000 -t .`
3. Test endpoints with curl
4. Develop and test in mobile/admin app
5. Verify sync is working

### For Database Changes
1. Update database schema
2. Test with existing endpoints
3. Update sync controller if needed
4. Test with mobile/admin app

### For Auth0 Changes
1. Update Auth0 Action/Rule code
2. Deploy in Auth0 Dashboard
3. Test with new user creation
4. Verify sync is working

---

## Support

If you encounter issues:
1. Check this guide first
2. Verify all prerequisites are installed
3. Check network connectivity
4. Review Auth0 Dashboard logs
5. Check PHP server logs

---

**Happy Coding!**
