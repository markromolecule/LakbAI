// Authentication Configuration
export const AUTH_CONFIG = {
  // Auth0 Configuration
  auth0: {
    domain: 'dev-0aaa1azz6qjnlz2l.us.auth0.com',
    clientId: 'oRukVKxyipmWOeKTcP05u3MshZpk66f5',
    redirectUri: 'lakbaimobile://auth',
    scope: 'openid profile email',
    responseType: 'code' as const,
    
    // Additional callback URLs for development
    additionalRedirectUris: [
      'lakbaimobile://auth',
      'com.lakbai.mobile://auth',
      'exp://127.0.0.1:8081/--/auth',
      'exp://localhost:8081/--/auth',
      'https://localhost:8081',
      'http://localhost:8081'
    ],
    
    // Logout URLs
    logoutUrls: [
      'lakbaimobile://auth',
      'com.lakbai.mobile://auth',
      'exp://127.0.0.1:8081/--/auth',
      'exp://localhost:8081/--/auth',
      'https://localhost:8081',
      'http://localhost:8081'
    ]
  },
  
  // Auth0 Endpoints
  endpoints: {
    authorization: 'https://dev-0aaa1azz6qjnlz2l.us.auth0.com/authorize',
    token: 'https://dev-0aaa1azz6qjnlz2l.us.auth0.com/oauth/token',
    userInfo: 'https://dev-0aaa1azz6qjnlz2l.us.auth0.com/userinfo',
    logout: 'https://dev-0aaa1azz6qjnlz2l.us.auth0.com/v2/logout'
  },
  
  // Session Configuration
  session: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    storageKeys: {
      accessToken: 'auth0_access_token',
      idToken: 'auth0_id_token',
      refreshToken: 'auth0_refresh_token',
      userProfile: 'auth0_user_profile',
      codeVerifier: 'auth0_code_verifier',
      codeChallenge: 'auth0_code_challenge',
      state: 'auth0_state',
      userSession: 'user_session',
      authState: 'auth_state',
      logoutFlag: '@logout_flag'
    }
  },
  
  // Authentication Flow Settings
  auth: {
    forceAccountSelection: true,
    usePKCE: true,
    showInRecents: false,
    preferEphemeralSession: true,
    createTask: true
  }
};

// Type definitions for configuration
export type Auth0Config = typeof AUTH_CONFIG.auth0;
export type SessionConfig = typeof AUTH_CONFIG.session;
export type AuthFlowConfig = typeof AUTH_CONFIG.auth;
