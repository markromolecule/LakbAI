# LakbAI – Smart Jeepney Transportation System

## 🚌 About LakbAI

**LakbAI** is a smart transportation management system designed specifically for modern jeepney operations in the Philippines. The system modernizes traditional jeepney services by providing digital solutions for passengers, drivers, and fleet administrators.

### Core Purpose
LakbAI digitizes and streamlines jeepney operations by offering:
- **Real-time tracking** of jeepney locations and routes
- **Digital fare management** with distance-based pricing
- **QR code payment system** for contactless transactions
- **Driver earnings tracking** and shift management
- **Passenger discount system** (PWD, Senior Citizen, Student)
- **Fleet administration** and route management

### System Architecture
LakbAI consists of three integrated applications:

| Component | Technology | Purpose |
|-----------|------------|---------|
| **LakbAI-Mobile** | React Native (Expo) | Mobile app for passengers and drivers |
| **LakbAI-API** | PHP 8.0+ | Backend API and business logic |
| **LakbAI-Admin** | React + Vite | Web dashboard for fleet administrators |

### Key Features

#### For Passengers
- **Quick Sign-In**: Auth0-powered authentication with Google/Facebook
- **Route Planning**: View available routes and checkpoints
- **Fare Calculation**: Real-time fare calculation based on distance
- **QR Code Payment**: Contactless payment system
- **Discount Management**: Upload and verify discount documents
- **Push Notifications**: Real-time updates and alerts

#### For Drivers
- **Driver Dashboard**: Earnings tracking and shift management
- **QR Code Scanner**: Accept payments from passengers
- **Route Navigation**: GPS-guided route assistance
- **Earnings Analytics**: Daily, weekly, monthly earnings reports
- **Document Management**: License verification and updates

#### For Administrators
- **Fleet Management**: Monitor jeepney status and assignments
- **User Management**: Manage passengers, drivers, and permissions
- **Route Administration**: Configure routes and checkpoints
- **Earnings Oversight**: Monitor driver earnings and transactions
- **Document Verification**: Approve discount documents and licenses

## System Requirements

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

# Terminal 2: Start API
cd LakbAI-API
php -S 0.0.0.0:8000

# Terminal 3: Start Admin
cd LakbAI-Admin
npm run dev

# Terminal 4: Start Mobile
cd LakbAI-Mobile
npx expo start
```
