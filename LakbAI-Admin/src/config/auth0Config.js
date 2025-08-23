// Auth0 Configuration for LakbAI Admin (Driver Authentication)
export const auth0Config = {
  domain: 'dev-0aaa1azz6qjnlz2l.us.auth0.com',
  clientId: 'ysVIQhHKqNIFT1to9F0K40NuLh7xFvEN',
  
  // Callback URLs for development and production
  redirectUri: window.location.origin + '/auth/callback',
  returnTo: 'http://localhost:5173',
  
  // Logout URLs
  logoutReturnTo: 'http://localhost:5173',
  
  // Auth0 configuration options
  audience: `https://dev-0aaa1azz6qjnlz2l.us.auth0.com/api/v2/`,
  scope: 'openid profile email',
  
  // Connection settings for social providers
  connection: {
    google: 'google-oauth2',
    facebook: 'facebook'
  },
  
  // Custom parameters
  customParameters: {
    role: 'driver',
    app: 'admin'
  }
};

// Auth0 Provider Options
export const auth0ProviderOptions = {
  domain: auth0Config.domain,
  clientId: auth0Config.clientId,
  authorizationParams: {
    redirect_uri: auth0Config.redirectUri,
    audience: auth0Config.audience,
    scope: auth0Config.scope,
  },
  cacheLocation: 'localstorage',
  useRefreshTokens: true,
  // Enhanced error handling and state management
  skipRedirectCallback: window.location.pathname === '/auth/callback',
  onRedirectCallback: (appState) => {
    // Store app state for processing in callback
    if (appState) {
      localStorage.setItem('auth0_app_state', JSON.stringify(appState));
    }
  }
};
