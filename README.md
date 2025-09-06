# LakbAI – Complete Installation Guide

LakbAI is a comprehensive multi-platform transportation application composed of three main projects:

- **LakbAI-Mobile**: React Native (Expo) app for passengers/drivers
- **LakbAI-API**: PHP backend API with Auth0 integration
- **LakbAI-Admin**: React web admin dashboard

## 📋 Prerequisites

### System Requirements
- **Node.js**: LTS version (18.x or higher)
- **npm**: Latest version
- **PHP**: 8.0 or higher
- **Composer**: Latest version
- **MySQL**: 5.7 or higher
- **XAMPP**: For local development (includes Apache, MySQL, PHP)

### Development Tools
- **Xcode**: For iOS development (macOS only)
- **Android Studio**: For Android development
- **Expo CLI**: For mobile app development
- **Git**: For version control

## 🚀 Quick Installation

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd LakbAI
```

### 2. Install All Dependencies

#### LakbAI-Mobile (React Native/Expo)
```bash
cd LakbAI-Mobile
npm install
```

#### LakbAI-Admin (React Web)
```bash
cd LakbAI-Admin
npm install
```

#### LakbAI-API (PHP Backend)
```bash
cd LakbAI-API
composer install
```

## 📱 LakbAI-Mobile Setup

### Dependencies Installed
The mobile app includes these key dependencies:
- **Expo SDK**: ^53.0.20 (Core framework)
- **React Native**: 0.79.5
- **React**: 19.0.0
- **TypeScript**: ~5.8.3
- **Auth0 Integration**: expo-auth-session ^6.2.1
- **Navigation**: expo-router ~5.1.4
- **Storage**: @react-native-async-storage/async-storage ^2.1.2
- **Camera**: expo-camera ~16.1.11
- **QR Code**: react-native-qrcode-svg ^6.3.15
- **Notifications**: expo-notifications ^0.31.4

### Configuration Required

1. **Auth0 Configuration** (`config/auth0Config.ts`):
   ```typescript
   export const AUTH0_CONFIG = {
     domain: 'dev-0aaa1azz6qjnlz2l.us.auth0.com',
     clientId: 'oRukVKxyipmWOeKTcP05u3MshZpk66f5',
     redirectUri: 'lakbaimobile://auth',
     // ... other config
   };
   ```

2. **App Configuration** (`app.json`):
   - Bundle identifier: `com.anonymous.LakbAI`
   - Scheme: `lakbaimobile`
   - Permissions: Camera, Location, Media Library

### Running the Mobile App
```bash
cd LakbAI-Mobile
npx expo start
```

**Platform-specific commands:**
```bash
# iOS Simulator
npx expo run:ios

# Android Emulator
npx expo run:android

# Web browser
npx expo start --web
```

## 🌐 LakbAI-Admin Setup

### Dependencies Installed
The admin web app includes:
- **React**: ^19.1.1
- **Vite**: ^7.1.0 (Build tool)
- **Bootstrap**: ^5.3.7 (UI framework)
- **React Bootstrap**: ^2.10.10
- **React Router**: ^7.8.0
- **Tailwind CSS**: ^3.4.17
- **Google OAuth**: @react-oauth/google ^0.12.2

### Configuration Required

1. **Vite Proxy Configuration** (`vite.config.js`):
   ```javascript
   server: {
     proxy: {
       '/api': {
         target: 'http://localhost/LakbAI/LakbAI-API',
         changeOrigin: true,
         rewrite: (path) => path.replace(/^\/api/, ''),
       }
     }
   }
   ```

### Running the Admin App
```bash
cd LakbAI-Admin
npm run dev
```

**Available scripts:**
```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # ESLint check
```

## 🔧 LakbAI-API Setup

### Dependencies Installed
The PHP API includes:
- **vlucas/phpdotenv**: ^5.6 (Environment variables)
- **firebase/php-jwt**: ^6.11 (JWT token handling)
- **phpmailer/phpmailer**: ^6.10 (Email functionality)

### Database Setup

1. **Create Database**:
   ```sql
   CREATE DATABASE IF NOT EXISTS `lakbai_db` 
   CHARACTER SET utf8mb4 
   COLLATE utf8mb4_unicode_ci;
   ```

2. **Run Database Scripts**:
   ```bash
   # Import the users table
   mysql -u root -p lakbai_db < LakbAI-API/database/create_users_table.sql
   ```

3. **Database Configuration** (`config/db.php`):
   ```php
   $host = '127.0.0.1';
   $user = 'root';          // XAMPP default
   $pass = '';              // XAMPP default (empty)
   $db   = 'lakbai_db';     // Your database name
   ```

### Auth0 Configuration

1. **Auth0 Config** (`config/auth0_config.php`):
   ```php
   define('BACKEND_API_TOKEN', 'NYDdY3H1YuNB+yIkkSF9om8Eb1fT/ykDhFwYsucd19A=');
   define('BACKEND_API_URL', 'http://localhost/LakbAI/LakbAI-API');
   define('AUTH0_DOMAIN', 'dev-0aaa1azz6qjnlz2l.us.auth0.com');
   define('AUTH0_CLIENT_ID', 'oRukVKxyipmWOeKTcP05u3MshZpk66f5');
   ```

### Running the API

**Option 1: Using XAMPP**
- Start XAMPP Control Panel
- Enable Apache and MySQL services
- Access API at: `http://localhost/LakbAI/LakbAI-API`

**Option 2: Using PHP Built-in Server**
```bash
cd LakbAI-API
php -S localhost:8000
```

## 🔐 Environment Configuration

### Required Environment Variables

Create `.env` files in each project:

#### LakbAI-API/.env
```env
DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=
DB_NAME=lakbai_db

AUTH0_DOMAIN=dev-0aaa1azz6qjnlz2l.us.auth0.com
AUTH0_CLIENT_ID=oRukVKxyipmWOeKTcP05u3MshZpk66f5
BACKEND_API_TOKEN=NYDdY3H1YuNB+yIkkSF9om8Eb1fT/ykDhFwYsucd19A=
BACKEND_API_URL=http://localhost/LakbAI/LakbAI-API
```

#### LakbAI-Mobile/.env
```env
EXPO_PUBLIC_AUTH0_DOMAIN=dev-0aaa1azz6qjnlz2l.us.auth0.com
EXPO_PUBLIC_AUTH0_CLIENT_ID=oRukVKxyipmWOeKTcP05u3MshZpk66f5
EXPO_PUBLIC_API_URL=http://localhost/LakbAI/LakbAI-API
```

## 🗄️ Database Schema

### Users Table Structure
The main `users` table includes:
- **Authentication**: username, email, password
- **Personal Info**: first_name, last_name, phone_number, birthday, gender
- **Address**: house_number, street_name, barangay, city_municipality, province, postal_code
- **User Type**: passenger, driver
- **Discounts**: PWD, Senior Citizen, Student
- **Verification**: is_verified, discount_verified

### Database Scripts Available
- `create_users_table.sql` - Main users table
- `update_users_table.sql` - Schema updates
- `update_users_table_auth0.sql` - Auth0 integration updates
- `fix_profile_completed.sql` - Profile completion fixes

## 🚀 Development Workflow

### Starting All Services

1. **Start XAMPP** (Apache + MySQL)
2. **Start API**:
   ```bash
   cd LakbAI-API
   # API runs automatically with XAMPP
   ```
3. **Start Admin**:
   ```bash
   cd LakbAI-Admin
   npm run dev
   ```
4. **Start Mobile**:
   ```bash
   cd LakbAI-Mobile
   npx expo start
   ```

### Development URLs
- **API**: `http://localhost/LakbAI/LakbAI-API`
- **Admin**: `http://localhost:5173` (Vite default)
- **Mobile**: Expo DevTools (usually `http://localhost:8081`)

## 🔧 Troubleshooting

### Common Issues

1. **Expo CLI not found**:
   ```bash
   npm install -g @expo/cli
   ```

2. **PHP Composer issues**:
   ```bash
   composer self-update
   composer install --no-dev
   ```

3. **Database connection errors**:
   - Verify XAMPP MySQL is running
   - Check database credentials in `config/db.php`
   - Ensure database `lakbai_db` exists

4. **Auth0 configuration errors**:
   - Verify Auth0 domain and client ID
   - Check redirect URIs in Auth0 dashboard
   - Ensure mobile app scheme matches Auth0 settings

5. **Port conflicts**:
   - Admin (Vite): Change port in `vite.config.js`
   - Mobile (Expo): Use `--port` flag
   - API: Change XAMPP port or use different server

### Platform-Specific Issues

**iOS Development**:
- Ensure Xcode is installed
- Check bundle identifier matches Auth0 settings
- Verify iOS simulator is available

**Android Development**:
- Install Android Studio
- Set up Android SDK
- Create virtual device or connect physical device

## 📁 Project Structure

```
LakbAI/
├── LakbAI-Mobile/          # React Native (Expo) app
│   ├── app/                # Expo Router screens
│   ├── components/         # Reusable components
│   ├── config/             # Auth0 and app configuration
│   ├── screens/            # Screen components
│   ├── shared/             # Shared utilities and services
│   └── assets/             # Images and fonts
├── LakbAI-API/             # PHP backend API
│   ├── controllers/        # API controllers
│   ├── config/             # Database and Auth0 config
│   ├── database/           # SQL scripts
│   ├── routes/             # API routes
│   └── src/                # Core application logic
└── LakbAI-Admin/           # React web admin
    ├── src/
    │   ├── components/     # React components
    │   ├── pages/          # Admin pages
    │   └── styles/         # CSS styles
    └── public/             # Static assets
```

## 🔒 Security Considerations

- **Auth0 Integration**: Uses PKCE for secure OAuth flow
- **JWT Tokens**: Secure token handling with Firebase JWT
- **CORS**: Configured for cross-origin requests
- **Environment Variables**: Sensitive data stored in .env files
- **Database**: Prepared statements for SQL injection prevention

## 📝 Development Notes

- **TypeScript**: Enabled in mobile app for type safety
- **ESLint**: Configured across all projects
- **Hot Reload**: Available in all development environments
- **API Proxy**: Admin app proxies API requests through Vite
- **Mobile Permissions**: Camera, location, and media library permissions configured

## 🎯 Next Steps

1. **Complete Auth0 Setup**: Configure Auth0 dashboard with correct redirect URIs
2. **Database Migration**: Run all database scripts in order
3. **Environment Setup**: Create and configure .env files
4. **Testing**: Test all three applications locally
5. **Production Deployment**: Configure production environments

## 📞 Support

For issues or questions:
- Check the troubleshooting section above
- Review configuration files for correct settings
- Ensure all prerequisites are installed
- Verify database connection and Auth0 configuration

---

**License**: Internal project. All rights reserved.