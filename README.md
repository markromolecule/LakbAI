# LakbAI – Smart Jeepney Transportation System

## 🚌 About LakbAI

**LakbAI** is a comprehensive smart transportation management system designed specifically for jeepney operations in the Philippines. The system modernizes traditional jeepney services by providing digital solutions for passengers, drivers, and fleet administrators with **real-time WebSocket communication**.

### Core Purpose
LakbAI digitizes and streamlines jeepney operations by offering:
- **Real-time tracking** of jeepney locations and routes via WebSocket
- **Digital fare management** with distance-based pricing
- **QR code payment system** for contactless transactions
- **Driver earnings tracking** and shift management
- **Passenger discount system** (PWD, Senior Citizen, Student)
- **Fleet administration** and route management
- **Real-time notifications** for trip updates and location changes

### System Architecture
LakbAI consists of four integrated applications:

| Component | Technology | Purpose |
|-----------|------------|---------|
| **LakbAI-Mobile** | React Native (Expo) | Mobile app for passengers and drivers |
| **LakbAI-API** | PHP 8.0+ | Backend API and business logic |
| **LakbAI-Admin** | React + Vite | Web dashboard for fleet administrators |
| **LakbAI-WebSocket** | Node.js + Socket.IO | Real-time communication server |

## Real-Time WebSocket Integration

### WebSocket Server (`LakbAI-WebSocket`)
- **Node.js + Socket.IO** server running on port 8080
- **Real-time communication** between mobile apps and backend
- **API endpoints** for PHP backend to send data:
  - `/api/driver-location` - Driver location updates
  - `/api/trip-completed` - Trip completion notifications  
  - `/api/qr-scan` - QR scan notifications
  - `/api/earnings-update` - Driver earnings updates

### WebSocket Events
- **`driver-location-update`** - Real-time driver location changes
- **`trip-completed`** - Trip completion notifications
- **`earnings-update`** - Driver earnings updates
- **`qr-scan-notification`** - QR scan events

### Real-Time Features
1. **Live Driver Tracking** - Passengers see driver location updates instantly
2. **Trip Completion** - Automatic trip ending when driver reaches destination
3. **Earnings Updates** - Real-time driver earnings display
4. **Push Notifications** - Instant notifications for all events

## 🚀 Key Features

### For Passengers
- **Quick Sign-In**: Auth0-powered authentication with Google/Facebook
- **Route Planning**: View available routes and checkpoints
- **Fare Calculation**: Real-time fare calculation based on distance
- **QR Code Payment**: Contactless payment system
- **Discount Management**: Upload and verify discount documents
- **Real-Time Notifications**: 
  - Driver location updates
  - Trip completion alerts
  - Special checkpoint notifications
- **Trip Tracking**: Live tracking of active trips
- **Debug Tools**: Clear trip data for testing

### For Drivers
- **Driver Dashboard**: Earnings tracking and shift management
- **QR Code Scanner**: Accept payments from passengers
- **Route Navigation**: GPS-guided route assistance
- **Earnings Analytics**: Daily, weekly, monthly earnings reports
- **Document Management**: License verification and updates
- **Real-Time Updates**: Live earnings and trip updates

### For Administrators
- **Fleet Management**: Monitor jeepney status and assignments
- **User Management**: Manage passengers, drivers, and permissions
- **Route Administration**: Configure routes and checkpoints
- **Earnings Oversight**: Monitor driver earnings and transactions
- **Document Verification**: Approve discount documents and licenses
- **Real-Time Monitoring**: Live system status and activity

## System Requirements

### Minimum System Requirements

#### Development Environment
- **Operating System**: Windows 10/11, macOS 10.15+, or Ubuntu 18.04+
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 10GB free space
- **Internet**: Stable broadband connection

#### Core Dependencies
- **Node.js**: LTS version (18.x or higher)
- **npm**: Latest version (comes with Node.js)
- **PHP**: 8.0 or higher
- **Composer**: Latest version
- **MySQL**: 5.7 or higher (8.0+ recommended)
- **Git**: For version control

#### Development Tools
- **XAMPP**: For local development (includes Apache, MySQL, PHP)
- **Expo CLI**: For mobile app development
- **Xcode**: For iOS development (macOS only)
- **Android Studio**: For Android development

### Platform-Specific Requirements

#### Mobile Development
- **iOS**: Xcode 14+, iOS 13+
- **Android**: Android Studio, Android SDK 21+
- **Expo**: Latest Expo CLI and SDK

#### Web Development
- **Modern Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Vite**: Build tool for React admin dashboard

#### Backend Development
- **PHP Extensions**: PDO, MySQL, OpenSSL, cURL
- **Web Server**: Apache 2.4+ or Nginx 1.18+
- **Database**: MySQL 5.7+ or MariaDB 10.3+

## Integrations & Third-Party Services

### Authentication & Security
- **Auth0**: Primary authentication provider
  - Google OAuth integration
  - Facebook OAuth integration
  - Email/password authentication
  - PKCE (Proof Key for Code Exchange) security
  - JWT token management

### Mobile Services
- **Expo SDK**: Cross-platform mobile development
  - Camera access for QR code scanning
  - Push notifications
  - Device storage management
  - Location services
- **Firebase**: Mobile backend services
  - Push notification delivery
  - Analytics (optional)
  - Cloud messaging

### Payment & QR System
- **QR Code Generation**: `react-native-qrcode-svg`
- **Camera Integration**: `expo-camera` for QR scanning
- **Custom Payment Logic**: Built-in fare calculation system

### Communication
- **PHPMailer**: Email functionality
  - User verification emails
  - Password reset notifications
  - System alerts

### Database & Storage
- **MySQL**: Primary database
  - User management
  - Route and checkpoint data
  - Transaction records
  - Earnings tracking
  - Active trips tracking
- **File Storage**: Local file system
  - Document uploads (licenses, discount certificates)
  - Image storage for profiles

### Web Services
- **Vite**: Modern build tool for React admin
- **Bootstrap 5**: UI framework
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing

### Development Tools
- **TypeScript**: Type safety for mobile app
- **ESLint**: Code linting and formatting
- **Babel**: JavaScript transpilation
- **PostCSS**: CSS processing

## Quick Start

### 1. Clone Repository
```bash
git clone <your-repository-url>
cd LakbAI
```

### 2. Install Dependencies
```bash
# Mobile app
cd LakbAI-Mobile
npm install

# Admin dashboard
cd ../LakbAI-Admin
npm install

# Backend API
cd ../LakbAI-API
composer install

# WebSocket server
cd ../LakbAI-WebSocket
npm install
```

### 3. Database Setup
```sql
CREATE DATABASE lakbai_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Environment Configuration
Create `.env` files in each project with required configuration (see detailed setup below).

### 5. Start Development Servers
```bash
# Terminal 1: Start XAMPP (Apache + MySQL)

# Terminal 2: Start WebSocket Server
cd LakbAI-WebSocket
npm start

# Terminal 3: Start API
cd LakbAI-API
php -S 0.0.0.0:8000

# Terminal 4: Start Admin
cd LakbAI-Admin
npm run dev

# Terminal 5: Start Mobile
cd LakbAI-Mobile
npx expo start
```

## 🔧 Detailed Setup

### WebSocket Server Setup
```bash
cd LakbAI-WebSocket
npm install
npm start
```
The WebSocket server will run on `http://localhost:8080`

### Mobile App Configuration
1. Update `LakbAI-Mobile/config/apiConfig.ts` with your API URLs
2. Configure Auth0 settings in `LakbAI-Mobile/config/auth0Config.ts`
3. Update WebSocket URL in `LakbAI-Mobile/shared/services/webSocketService.ts`

### API Configuration
1. Create `LakbAI-API/.env` file with database credentials
2. Update `LakbAI-API/config/db.php` with your database settings
3. Configure WebSocket URL in `LakbAI-API/src/WebSocketNotifier.php`

### Admin Dashboard Configuration
1. Update `LakbAI-Admin/src/config/apiConfig.js` with your API URLs
2. Configure Auth0 settings for admin authentication

## 📱 Mobile App Features

### Real-Time Trip Management
- **Trip Booking**: Book trips with pickup and destination selection
- **Live Tracking**: Real-time driver location updates
- **Trip Completion**: Automatic trip ending when destination is reached
- **Notifications**: Push notifications for all trip events

### Payment System
- **QR Code Payment**: Scan driver's QR code to pay
- **Fare Calculation**: Automatic fare calculation based on distance
- **Discount System**: Support for PWD, Senior Citizen, and Student discounts

### User Management
- **Profile Management**: Update personal information
- **Document Upload**: Upload discount certificates and IDs
- **Trip History**: View past trips and payments

## 🚌 Driver Features

### Earnings Management
- **Real-Time Earnings**: Live earnings updates via WebSocket
- **Earnings History**: View daily, weekly, monthly earnings
- **Trip Tracking**: Track completed trips and payments

### QR Code System
- **QR Code Generation**: Generate unique QR codes for payments
- **Payment Processing**: Accept payments from passengers
- **Transaction History**: View all payment transactions

### Route Management
- **Checkpoint Scanning**: Scan QR codes at checkpoints
- **Route Navigation**: GPS-guided route assistance
- **Location Updates**: Automatic location updates for passengers

## 🖥️ Admin Dashboard Features

### Fleet Management
- **Driver Management**: Add, edit, and manage drivers
- **Jeepney Management**: Track jeepney assignments and status
- **Route Management**: Configure routes and checkpoints

### User Management
- **Passenger Management**: Manage passenger accounts
- **Document Verification**: Approve discount documents
- **User Analytics**: View user statistics and activity

### System Monitoring
- **Real-Time Dashboard**: Live system status and activity
- **Earnings Overview**: Monitor driver earnings and transactions
- **Trip Analytics**: View trip statistics and patterns

## 🔧 API Endpoints

### Mobile API Endpoints
- `POST /api/mobile/passenger/book-trip` - Book a new trip
- `GET /api/mobile/passenger/active-trips` - Get active trips
- `POST /api/mobile/passenger/clear-trips` - Clear active trips (debug)
- `POST /api/mobile/driver/scan/checkpoint` - Scan checkpoint QR
- `GET /api/mobile/driver/earnings` - Get driver earnings

### WebSocket API Endpoints
- `POST /api/driver-location` - Send driver location update
- `POST /api/trip-completed` - Send trip completion notification
- `POST /api/qr-scan` - Send QR scan notification
- `POST /api/earnings-update` - Send earnings update

## 🐛 Debug Features

### Passenger Debug Tools
- **Clear Trip Data**: Debug button to clear all trip data
- **Trip Status Reset**: Reset trip status for testing
- **Notification Testing**: Test notification system

### Development Tools
- **Console Logging**: Comprehensive logging for debugging
- **WebSocket Status**: Monitor WebSocket connection status
- **API Testing**: Built-in API testing tools

## 📊 Database Schema

### Key Tables
- **`users`** - User accounts (passengers, drivers, admins)
- **`routes`** - Route definitions and checkpoints
- **`active_trips`** - Active passenger trips
- **`driver_earnings`** - Driver earnings records
- **`push_notifications`** - Notification queue
- **`checkpoints`** - Route checkpoints and QR codes

## 🚀 Deployment

### Production Setup
1. **WebSocket Server**: Deploy Node.js server with PM2
2. **API Server**: Deploy PHP API with Apache/Nginx
3. **Database**: Set up MySQL database with proper permissions
4. **Mobile App**: Build and deploy to app stores
5. **Admin Dashboard**: Build and deploy to web server

### Environment Variables
- **WebSocket**: `WEBSOCKET_URL`, `WEBSOCKET_ENABLED`
- **API**: `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`
- **Auth0**: `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`

## Recent Updates

### v2.0.0 - WebSocket Integration
- ✅ Real-time WebSocket communication
- ✅ Live driver location tracking
- ✅ Automatic trip completion
- ✅ Real-time earnings updates
- ✅ Push notifications for all events
- ✅ Special notification types (driver on shift, endpoint reached)
- ✅ Debug tools for testing
- ✅ Duplicate notification prevention
- ✅ Enhanced trip management system

---

**LakbAI** - Modernizing jeepney transportation with real-time technology! 🚌✨