# Enhanced Auth0 Service with Comprehensive Session Management

## Overview

The enhanced Auth0 service provides a robust authentication flow with automatic fallback functionality and comprehensive session management. It ensures that users always get a fresh authentication experience and that logout completely clears all session data.

## 🔑 Key Features

### 🚀 Force Fresh Authentication
- **Always Fresh**: Every login attempt forces a new authentication flow
- **Account Selection**: Forces Google to show account selection screen
- **No Silent Re-auth**: Prevents automatic login with previous accounts
- **PKCE Security**: Uses Proof Key for Code Exchange for enhanced security

### 🧹 Comprehensive Logout
- **Full Session Clear**: Clears Auth0, Expo auth-session, Google OAuth, and AsyncStorage
- **Server Logout**: Calls Auth0 logout endpoint to clear server-side sessions
- **Logout Flag**: Sets flag to prevent automatic session restoration
- **Fresh State**: Resets all service state for next authentication

### 🔄 Automatic Fallback Mechanism
- **Primary**: Attempts backend token exchange first
- **Fallback**: Automatically switches to direct Auth0 communication if backend fails
- **Self-healing**: No manual intervention required

### 🛡️ Enhanced Security
- **PKCE Flow**: Uses Proof Key for Code Exchange (no client secret needed)
- **Secure Token Handling**: Maintains security standards in both modes
- **Automatic Mode Switching**: Seamless transition between backend and direct modes

## 📱 Authentication Flow

### 1. Quick Sign-In Flow
```
User taps Quick Sign-In → Auth0 login page opens → User authenticates →
	•	If existing account & profile completed → redirect to Passenger Home Screen
	•	If new account or profile incomplete → redirect to Completion Form
```

### 2. Logout Behavior
```
User logs out → Comprehensive session clearing → All caches/tokens cleared →
	•	Auth0 session cleared
	•	Expo auth-session cache cleared
	•	Google OAuth keys cleared
	•	AsyncStorage keys cleared
	•	Logout flag set
```

### 3. Next Login After Logout
```
User taps Quick Sign-In again → Force fresh authentication → Account selection required →
	•	No automatic re-authentication
	•	Fresh login flow every time
	•	New tokens and user data fetched
```

## 🚀 Implementation Details

### Force Fresh Authentication
The service automatically appends these parameters to force fresh authentication:
- `prompt=login` - Forces login screen
- `prompt=select_account` - Forces account selection
- `access_type=offline` - Requests refresh token
- `_t={timestamp}` - Prevents caching
- `force_refresh=true` - Custom parameter for force refresh

### Session Management
- **Session Check**: Always verifies logout flag before checking existing sessions
- **Token Validation**: Ensures tokens are fresh and valid
- **Cache Clearing**: Comprehensive clearing of all authentication caches
- **State Reset**: Resets all service state for fresh authentication

### Logout Process
1. **Clear Current Request**: Resets AuthRequest state
2. **Reset Service Mode**: Returns to backend mode
3. **Clear Expo Auth**: Removes all expo-auth-session data
4. **Force Account Selection**: Prepares for fresh Google OAuth
5. **Clear All Sessions**: Removes all stored tokens and sessions
6. **Server Logout**: Calls Auth0 logout endpoint
7. **Set Logout Flag**: Prevents automatic session restoration

## 📖 Usage Examples

### Basic Authentication
```typescript
import auth0Service from '../shared/services/auth0Service';

// Start authentication (always fresh)
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

### Comprehensive Logout
```typescript
// Logout with full session clearing
await auth0Service.logout();

// This will:
// - Clear all local sessions
// - Call Auth0 logout endpoint
// - Set logout flag
// - Prepare for fresh authentication
```

### Session Checking
```typescript
// Check if session exists and force fresh auth if needed
const hasValidSession = await auth0Service.checkSessionAndForceFreshAuth();

if (!hasValidSession) {
  // Ready for fresh authentication
  console.log('Fresh authentication required');
}
```

### Force Fresh Authentication
```typescript
// Force fresh authentication state
await auth0Service.forceFreshAuthentication();

// This will:
// - Clear all caches
// - Reset service state
// - Prepare for new authentication flow
```

## 🔧 Configuration

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

### Required Auth0 Dashboard Settings
1. **Application Type**: Native
2. **Token Endpoint Authentication Method**: None
3. **Grant Types**: Authorization Code, Refresh Token
4. **Response Type**: Code
5. **PKCE**: Enabled
6. **Callback URLs**: Include your redirect URI

## 🚨 Troubleshooting

### Common Issues

1. **Still Auto-logging In**
   - Check if logout flag is set: `@logout_flag`
   - Verify all caches are cleared
   - Ensure Auth0 service state is reset

2. **Google Account Selection Not Showing**
   - Call `forceGoogleAccountSelection()` before authentication
   - Clear browser sessions with `WebBrowser.coolDownAsync()`
   - Check if `prompt=select_account` is in authorization URL

3. **Session Persistence After Logout**
   - Verify logout flag is set to 'true'
   - Check if all AsyncStorage keys are cleared
   - Ensure Auth0 service logout method is called

### Debug Methods

```typescript
// Debug current AuthRequest state
auth0Service.debugCurrentRequest();

// Check current authentication mode
const mode = auth0Service.getCurrentMode(); // 'backend' or 'direct'

// Test backend connectivity
const connectivity = await auth0Service.testBackendConnectivity();

// Test alternative endpoints
const endpoints = await auth0Service.testAlternativeEndpoints();
```

## 🔒 Security Notes

- **No Client Secret**: PKCE flow doesn't require client secret in mobile apps
- **Secure Storage**: Tokens are stored securely in AsyncStorage
- **Token Validation**: Always validate tokens on your backend for critical operations
- **Session Isolation**: Each logout completely isolates sessions
- **Fresh Authentication**: No cached authentication state is reused

## 📱 Mobile Optimizations

- **Expo Compatible**: Works with Expo AuthSession
- **React Native Ready**: Optimized for mobile authentication flows
- **Error Handling**: Graceful degradation with detailed logging
- **Performance**: Efficient session management with minimal overhead

## 🎯 Best Practices

1. **Always Force Fresh**: Use `forceFreshAuthentication()` before each login
2. **Comprehensive Logout**: Use the service's logout method for complete cleanup
3. **Session Validation**: Check logout flag before attempting session restoration
4. **Error Handling**: Implement proper fallbacks for network issues
5. **User Feedback**: Provide clear feedback during authentication and logout

## 🆘 Support

For issues or questions:
1. Check debug logs in console
2. Verify logout flag status
3. Test backend connectivity
4. Check Auth0 dashboard configuration
5. Use debug methods for troubleshooting

---

**Note**: This enhanced service ensures that every authentication attempt is fresh and secure, providing users with a consistent and secure authentication experience.
