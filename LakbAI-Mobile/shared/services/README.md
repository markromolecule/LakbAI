# Enhanced Auth0 Service

## Overview

The enhanced Auth0 service provides automatic fallback functionality to ensure authentication works even when the backend is unavailable. It automatically detects backend connectivity issues and switches to direct Auth0 communication using PKCE flow.

## Key Features

### 🔄 Automatic Fallback Mechanism
- **Primary**: Attempts backend token exchange first
- **Fallback**: Automatically switches to direct Auth0 communication if backend fails
- **Self-healing**: No manual intervention required

### 🛡️ Enhanced Security
- **PKCE Flow**: Uses Proof Key for Code Exchange (no client secret needed)
- **Secure Token Handling**: Maintains security standards in both modes
- **Automatic Mode Switching**: Seamless transition between backend and direct modes

### 📱 Mobile Optimized
- **Expo Compatible**: Works with Expo AuthSession
- **React Native Ready**: Optimized for mobile authentication flows
- **Error Handling**: Graceful degradation with detailed logging

## How It Works

### 1. Authentication Flow
```
User Login → Auth0 OAuth → Get Authorization Code → Token Exchange
                                                      ↓
                                              Try Backend First
                                                      ↓
                                              Backend Available? → Yes → Use Backend
                                                      ↓ No
                                              Fallback to Direct Auth0
```

### 2. Token Exchange Process
1. **Backend Attempt**: Tries to exchange code for tokens via your backend
2. **Fallback Detection**: If backend fails (network error, server down, etc.)
3. **Direct Auth0**: Automatically switches to direct Auth0 token exchange
4. **Mode Tracking**: Service remembers which mode is currently active

### 3. User Profile Retrieval
- **Backend Mode**: Fetches user profile through your backend
- **Direct Mode**: Fetches user profile directly from Auth0 userinfo endpoint
- **Automatic Conversion**: Converts Auth0 format to your app's format

## Usage

### Basic Authentication
```typescript
import auth0Service from '../shared/services/auth0Service';

// Start authentication
const { result, codeVerifier } = await auth0Service.authenticate();

if (result.type === 'success' && result.params.code) {
  // Exchange code for tokens (automatic fallback included)
  const tokenResponse = await auth0Service.exchangeCodeForTokens(
    result.params.code,
    codeVerifier
  );
  
  // Get user profile (automatic fallback included)
  const userProfile = await auth0Service.getUserProfile(tokenResponse.data.access_token);
}
```

### Check Current Mode
```typescript
const currentMode = auth0Service.getCurrentMode();
console.log(`Currently using: ${currentMode}`); // 'backend' or 'direct'
```

### Reset to Backend Mode
```typescript
// Useful for testing or when backend becomes available again
auth0Service.resetToBackendMode();
```

## Configuration

### Backend Configuration
Update your `developerConfig.ts` with your local IP:
```typescript
export const DEVELOPER_IP = '192.168.1.100:8000'; // Your IP here
```

### Auth0 Configuration
Ensure your `auth0Config.ts` has the correct settings:
```typescript
export const AUTH0_CONFIG = {
  domain: 'your-domain.auth0.com',
  clientId: 'your-client-id',
  redirectUri: 'lakbaimobile://auth',
  scope: 'openid profile email',
};
```

## Debug Component

Use the `Auth0DebugComponent` to test and monitor the authentication flow:

```typescript
import { Auth0DebugComponent } from '../components';

// In your screen/component
<Auth0DebugComponent
  onAuthSuccess={(user) => console.log('Auth success:', user)}
  onAuthError={(error) => console.log('Auth error:', error)}
/>
```

## Troubleshooting

### Common Issues

1. **Backend Unreachable**
   - Check if XAMPP/PHP server is running
   - Verify IP address in `developerConfig.ts`
   - Ensure both devices are on same WiFi network

2. **Auth0 Configuration Issues**
   - Verify domain and client ID
   - Check redirect URI configuration
   - Ensure PKCE is enabled in Auth0 dashboard

3. **Network Issues**
   - Use tunnel mode: `npx expo start --tunnel`
   - Update IP to `localhost:8000` in tunnel mode

### Debug Logs

The service provides detailed logging:
- 🔄 Backend attempts
- ⚠️ Fallback triggers
- ✅ Success confirmations
- ❌ Error details

## Security Notes

- **No Client Secret**: PKCE flow doesn't require client secret in mobile apps
- **Secure Storage**: Tokens should be stored securely (AsyncStorage with encryption)
- **Token Validation**: Always validate tokens on your backend for critical operations
- **HTTPS**: Production should use HTTPS for all communications

## Performance

- **Lazy Fallback**: Only switches to direct mode when backend fails
- **Mode Persistence**: Remembers mode during app session
- **Efficient Fallback**: Minimal overhead when backend is available

## Support

For issues or questions:
1. Check debug logs in console
2. Use `Auth0DebugComponent` for testing
3. Verify network connectivity
4. Check Auth0 dashboard configuration
