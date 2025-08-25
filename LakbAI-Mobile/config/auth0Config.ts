
export const AUTH0_CONFIG = {
  domain: 'dev-0aaa1azz6qjnlz2l.us.auth0.com',
  clientId: 'oRukVKxyipmWOeKTcP05u3MshZpk66f5',
  // Note: Client secret should NOT be in frontend code for security
  
  // It will be handled by the backend during token exchange
  redirectUri: 'lakbaimobile://auth',
  // For mobile apps, we typically don't need an audience unless calling a specific API
  scope: 'openid profile email',
  responseType: 'code',
  
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
};

export const AUTH0_ENDPOINTS = {
  authorization: `https://${AUTH0_CONFIG.domain}/authorize`,
  token: `https://${AUTH0_CONFIG.domain}/oauth/token`,
  userInfo: `https://${AUTH0_CONFIG.domain}/userinfo`,
  logout: `https://${AUTH0_CONFIG.domain}/v2/logout`
};
