// Auth0 Configuration for LakbAI Mobile (Passenger Authentication)

export const auth0Config = {
  domain: 'dev-0aaa1azz6qjnlz2l.us.auth0.com',
  clientId: 'oRukVKxyipmWOeKTcP05u3MshZpk66f5',
  
  // Mobile-specific configuration
  scheme: 'lakbaimobile',
  
  // Auth0 configuration options
  audience: `https://dev-0aaa1azz6qjnlz2l.us.auth0.com/api/v2/`,
  scope: 'openid profile email offline_access',
  
  // Connection settings for social providers
  connection: {
    google: 'google-oauth2',
    facebook: 'facebook'
  },
  
  // Custom parameters
  customParameters: {
    role: 'passenger',
    app: 'mobile'
  },

  // Additional configuration
  additionalParameters: {
    prompt: 'login'
  },

  // Custom schemes for deep linking
  customScheme: 'lakbaimobile',
  
  // PKCE configuration
  pkce: {
    enabled: true,
    method: 'S256' // SHA256 for PKCE
  }
};

// Expo Auth0 Provider Options
export const auth0ProviderOptions = {
  domain: auth0Config.domain,
  clientId: auth0Config.clientId,
  customScheme: auth0Config.customScheme,
  audience: auth0Config.audience,
  scope: auth0Config.scope
};
