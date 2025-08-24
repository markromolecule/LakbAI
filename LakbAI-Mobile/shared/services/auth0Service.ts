import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import { auth0Config } from '../../config/auth0Config';

/**
 * Auth0 Service for LakbAI Mobile Application
 * Handles authentication for Passengers using Expo Auth0
 */

interface AuthResult {
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  user?: any;
  error?: string;
}

interface User {
  sub: string;
  name?: string;
  email?: string;
  email_verified?: boolean;
  picture?: string;
  nickname?: string;
  [key: string]: any;
}

class Auth0Service {
  private static instance: Auth0Service;
  private discoveryDocument: AuthSession.DiscoveryDocument | null = null;

  // Secure storage keys
  private static readonly STORAGE_KEYS = {
    ACCESS_TOKEN: 'auth0_access_token',
    ID_TOKEN: 'auth0_id_token',
    REFRESH_TOKEN: 'auth0_refresh_token',
    USER_DATA: 'auth0_user_data',
    EXPIRES_AT: 'auth0_expires_at'
  };

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): Auth0Service {
    if (!Auth0Service.instance) {
      Auth0Service.instance = new Auth0Service();
    }
    return Auth0Service.instance;
  }

  /**
   * Initialize Auth0 service
   */
  async initialize(): Promise<void> {
    try {
      this.discoveryDocument = await AuthSession.fetchDiscoveryAsync(
        `https://${auth0Config.domain}`
      );
      console.log('Auth0 Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Auth0 Service:', error);
      throw error;
    }
  }

  /**
   * Login with Auth0 Universal Login
   */
  async login(): Promise<AuthResult> {
    return this.authenticate('login');
  }

  /**
   * Sign up with Auth0 Universal Login
   */
  async signup(): Promise<AuthResult> {
    // Clear any existing session before signup to ensure fresh start
    await this.logout();
    
    // Force fresh authentication by clearing any cached tokens
    await Promise.all([
      SecureStore.deleteItemAsync(Auth0Service.STORAGE_KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(Auth0Service.STORAGE_KEYS.ID_TOKEN),
      SecureStore.deleteItemAsync(Auth0Service.STORAGE_KEYS.REFRESH_TOKEN),
      SecureStore.deleteItemAsync(Auth0Service.STORAGE_KEYS.USER_DATA),
      SecureStore.deleteItemAsync(Auth0Service.STORAGE_KEYS.EXPIRES_AT),
    ]);
    
    return this.authenticate('signup');
  }

  /**
   * Authenticate with Auth0 (login or signup)
   */
  private async authenticate(mode: 'login' | 'signup'): Promise<AuthResult> {
    try {
      await this.ensureInitialized();
      
      if (!this.discoveryDocument) {
        throw new Error('Auth0 not initialized');
      }

      const redirectUri = `${auth0Config.customScheme}://auth`;

      console.log(`Auth0 ${mode} Redirect URI:`, redirectUri);

      const authRequestConfig: AuthSession.AuthRequestConfig = {
        clientId: auth0Config.clientId,
        scopes: auth0Config.scope.split(' '),
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        // Enable PKCE for mobile security
        usePKCE: true,
        extraParams: {
          audience: auth0Config.audience,
          ...auth0Config.customParameters,
          // Add signup context for role assignment
          ...(mode === 'signup' && {
            screen_hint: 'signup',
            role: 'passenger',
            prompt: 'select_account'
          })
        },
        prompt: mode === 'signup' ? AuthSession.Prompt.SelectAccount : AuthSession.Prompt.Login,
      };

      const authRequest = new AuthSession.AuthRequest(authRequestConfig);

      console.log(`Starting Auth0 ${mode} with PKCE...`);
      const authResult = await authRequest.promptAsync(this.discoveryDocument);

      console.log(`Auth0 ${mode} result:`, {
        type: authResult.type,
        hasCode: authResult.type === 'success' ? !!authResult.params?.code : false,
        hasCodeVerifier: !!authRequest.codeVerifier,
        error: authResult.type === 'error' ? authResult.error : undefined,
        params: authResult.type === 'success' ? authResult.params : undefined
      });

      if (authResult.type === 'success') {
        console.log(`Auth0 ${mode} successful, exchanging code for tokens...`);
        return await this.exchangeCodeForTokens(
          authResult.params.code!, 
          redirectUri,
          authRequest.codeVerifier
        );
      } else if (authResult.type === 'error') {
        const errorMsg = authResult.params?.error_description || authResult.error?.message || `${mode} failed`;
        console.error(`Auth0 ${mode} error:`, errorMsg);
        throw new Error(errorMsg);
      } else {
        console.log(`Auth0 ${mode} was cancelled or failed`);
        throw new Error(`${mode} was cancelled or failed`);
      }
    } catch (error) {
      console.error(`${mode} error:`, error);
      return { error: error instanceof Error ? error.message : `${mode} failed` };
    }
  }

  /**
   * Login with Google
   */
  async loginWithGoogle(): Promise<AuthResult> {
    return this.loginWithConnection('google-oauth2');
  }

  /**
   * Login with Facebook
   */
  async loginWithFacebook(): Promise<AuthResult> {
    return this.loginWithConnection('facebook');
  }

  /**
   * Login with specific connection
   */
  private async loginWithConnection(connection: string): Promise<AuthResult> {
    try {
      await this.ensureInitialized();
      
      if (!this.discoveryDocument) {
        throw new Error('Auth0 not initialized');
      }

      const redirectUri = `${auth0Config.customScheme}://auth`;

      const authRequestConfig: AuthSession.AuthRequestConfig = {
        clientId: auth0Config.clientId,
        scopes: auth0Config.scope.split(' '),
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        // Enable PKCE for mobile security
        usePKCE: true,
        extraParams: {
          audience: auth0Config.audience,
          connection,
          ...auth0Config.customParameters
        },
        prompt: AuthSession.Prompt.Login,
      };

      const authRequest = new AuthSession.AuthRequest(authRequestConfig);
      
      console.log(`Starting ${connection} login with PKCE...`);
      const authResult = await authRequest.promptAsync(this.discoveryDocument);

      console.log(`${connection} login result:`, {
        type: authResult.type,
        hasCode: authResult.type === 'success' ? !!authResult.params?.code : false,
        hasCodeVerifier: !!authRequest.codeVerifier,
        error: authResult.type === 'error' ? authResult.error : undefined,
        params: authResult.type === 'success' ? authResult.params : undefined
      });

      if (authResult.type === 'success') {
        console.log(`${connection} login successful, exchanging code for tokens...`);
        return await this.exchangeCodeForTokens(
          authResult.params.code!, 
          redirectUri,
          authRequest.codeVerifier
        );
      } else if (authResult.type === 'error') {
        const errorMsg = authResult.params?.error_description || 'Social login failed';
        console.error(`${connection} login error:`, errorMsg);
        throw new Error(errorMsg);
      } else {
        console.log(`${connection} login was cancelled`);
        throw new Error('Social login was cancelled');
      }
    } catch (error) {
      console.error(`${connection} login error:`, error);
      return { error: error instanceof Error ? error.message : `${connection} login failed` };
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  private async exchangeCodeForTokens(code: string, redirectUri: string, codeVerifier?: string): Promise<AuthResult> {
    try {
      if (!this.discoveryDocument?.tokenEndpoint) {
        throw new Error('Token endpoint not available');
      }

      const tokenRequestBody: any = {
        grant_type: 'authorization_code',
        client_id: auth0Config.clientId,
        code,
        redirect_uri: redirectUri,
      };

      // Add PKCE code_verifier if available
      if (codeVerifier) {
        tokenRequestBody.code_verifier = codeVerifier;
      }

      const tokenRequest = await fetch(this.discoveryDocument.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tokenRequestBody),
      });

      const tokenData = await tokenRequest.json();

      if (!tokenRequest.ok) {
        console.error('Token exchange failed:', tokenData);
        throw new Error(tokenData.error_description || 'Token exchange failed');
      }

      console.log('Tokens received successfully');

      // Store tokens securely
      await this.storeTokens({
        accessToken: tokenData.access_token,
        idToken: tokenData.id_token,
        refreshToken: tokenData.refresh_token,
      });

      // Get user information
      const user = await this.getUserInfo(tokenData.access_token);
      await this.storeUserData(user);

      return {
        accessToken: tokenData.access_token,
        idToken: tokenData.id_token,
        refreshToken: tokenData.refresh_token,
        user
      };
    } catch (error) {
      console.error('Token exchange error:', error);
      throw error;
    }
  }

  /**
   * Get user information from Auth0
   */
  private async getUserInfo(accessToken: string): Promise<User | null> {
    try {
      if (!this.discoveryDocument?.userInfoEndpoint) {
        throw new Error('Userinfo endpoint not available');
      }

      const userResponse = await fetch(this.discoveryDocument.userInfoEndpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to get user info');
      }

      const user = await userResponse.json();
      console.log('User info retrieved:', user);
      return user;
    } catch (error) {
      console.error('Get user info error:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const accessToken = await SecureStore.getItemAsync(Auth0Service.STORAGE_KEYS.ACCESS_TOKEN);
      const expiresAt = await SecureStore.getItemAsync(Auth0Service.STORAGE_KEYS.EXPIRES_AT);
      
      if (!accessToken) return false;
      
      if (expiresAt) {
        const expiry = parseInt(expiresAt);
        if (Date.now() >= expiry) {
          console.log('Token expired, attempting refresh...');
          return await this.refreshTokenSilently();
        }
      }
      
      return true;
    } catch (error) {
      console.error('Authentication check error:', error);
      return false;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await SecureStore.getItemAsync(Auth0Service.STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Get access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(Auth0Service.STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Get access token error:', error);
      return null;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // First, try to revoke the Auth0 session
      try {
        const accessToken = await this.getAccessToken();
        if (accessToken && this.discoveryDocument?.revocationEndpoint) {
          await fetch(this.discoveryDocument.revocationEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: accessToken,
              client_id: auth0Config.clientId,
            }),
          });
          console.log('Auth0 session revoked');
        }
      } catch (revokeError) {
        console.warn('Failed to revoke Auth0 session:', revokeError);
        // Continue with local logout even if Auth0 revocation fails
      }

      // Clear all stored data
      await Promise.all([
        SecureStore.deleteItemAsync(Auth0Service.STORAGE_KEYS.ACCESS_TOKEN),
        SecureStore.deleteItemAsync(Auth0Service.STORAGE_KEYS.ID_TOKEN),
        SecureStore.deleteItemAsync(Auth0Service.STORAGE_KEYS.REFRESH_TOKEN),
        SecureStore.deleteItemAsync(Auth0Service.STORAGE_KEYS.USER_DATA),
        SecureStore.deleteItemAsync(Auth0Service.STORAGE_KEYS.EXPIRES_AT),
      ]);

      // Clear any cached user data
      // Note: The service methods will return null for cached data after logout

      console.log('User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Refresh token silently
   */
  private async refreshTokenSilently(): Promise<boolean> {
    try {
      const refreshToken = await SecureStore.getItemAsync(Auth0Service.STORAGE_KEYS.REFRESH_TOKEN);
      
      if (!refreshToken || !this.discoveryDocument?.tokenEndpoint) {
        return false;
      }

      const tokenRequest = await fetch(this.discoveryDocument.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          client_id: auth0Config.clientId,
          refresh_token: refreshToken,
        }),
      });

      const tokenData = await tokenRequest.json();

      if (!tokenRequest.ok) {
        console.error('Token refresh failed:', tokenData);
        return false;
      }

      await this.storeTokens({
        accessToken: tokenData.access_token,
        idToken: tokenData.id_token,
        refreshToken: tokenData.refresh_token || refreshToken, // Use new refresh token if provided
      });

      console.log('Tokens refreshed successfully');
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  /**
   * Store tokens securely
   */
  private async storeTokens(tokens: {
    accessToken: string;
    idToken?: string;
    refreshToken?: string;
  }): Promise<void> {
    const promises = [
      SecureStore.setItemAsync(Auth0Service.STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken),
    ];

    if (tokens.idToken) {
      promises.push(
        SecureStore.setItemAsync(Auth0Service.STORAGE_KEYS.ID_TOKEN, tokens.idToken)
      );
    }

    if (tokens.refreshToken) {
      promises.push(
        SecureStore.setItemAsync(Auth0Service.STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken)
      );
    }

    // Set expiry time (assuming 24 hours for access token)
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000);
    promises.push(
      SecureStore.setItemAsync(Auth0Service.STORAGE_KEYS.EXPIRES_AT, expiresAt.toString())
    );

    await Promise.all(promises);
  }

  /**
   * Store user data securely
   */
  private async storeUserData(user: User | null): Promise<void> {
    if (user) {
      await SecureStore.setItemAsync(
        Auth0Service.STORAGE_KEYS.USER_DATA,
        JSON.stringify(user)
      );
    }
  }

  /**
   * Ensure Auth0 is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.discoveryDocument) {
      await this.initialize();
    }
  }

  /**
   * Get user roles and permissions
   */
  async getUserRoles(): Promise<{
    roles: string[];
    permissions: string[];
    isPassenger: boolean;
  }> {
    try {
      const user = await this.getCurrentUser();
      
      if (!user) {
        return { roles: [], permissions: [], isPassenger: false };
      }

      const roles = user['https://lakbai.com/roles'] || [];
      const permissions = user['https://lakbai.com/permissions'] || [];
      
      return {
        roles,
        permissions,
        isPassenger: roles.includes('passenger')
      };
    } catch (error) {
      console.error('Failed to get user roles:', error);
      return { roles: [], permissions: [], isPassenger: false };
    }
  }

  /**
   * Update user metadata in Auth0
   */
  async updateUserMetadata(metadata: any): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      const accessToken = await this.getAccessToken();
      
      if (!user || !accessToken) {
        throw new Error('User not authenticated or no access token');
      }

      console.log('Updating user metadata for user:', user.sub);
      console.log('Metadata to update:', metadata);
      
      // Note: For user metadata updates via Management API, you need:
      // 1. Management API access token (different from user access token)
      // 2. Or use a backend service to handle this
      
      // For now, we'll store locally and sync later via backend
      const updatedUser = {
        ...user,
        user_metadata: {
          ...user.user_metadata,
          ...metadata
        }
      };
      
      await this.storeUserData(updatedUser);
      console.log('User metadata updated locally');
      
      // TODO: In production, send this to your backend API to update Auth0
      // via Management API with proper credentials
      console.warn('User metadata update: Backend integration required for production');
      
    } catch (error) {
      console.error('Update user metadata error:', error);
      throw new Error('Failed to update user profile. Please try again.');
    }
  }

  /**
   * Get user's complete profile including metadata
   */
  async getUserProfile(): Promise<any> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return null;
      
      return {
        // Basic Auth0 profile
        id: user.sub,
        name: user.name,
        email: user.email,
        picture: user.picture,
        nickname: user.nickname,
        email_verified: user.email_verified,
        
        // Extended metadata
        address: user?.user_metadata?.address,
        phone_number: user?.user_metadata?.phone_number,
        birthday: user?.user_metadata?.birthday,
        gender: user?.user_metadata?.gender,
        user_type: user?.user_metadata?.user_type,
        registration_complete: user?.user_metadata?.registration_complete,
        preferences: user?.user_metadata?.preferences,
        
        // Raw metadata for debugging
        user_metadata: user?.user_metadata,
        app_metadata: user?.app_metadata,
      };
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  }

  /**
   * Test PKCE generation
   */
  async testPKCE(): Promise<void> {
    try {
      await this.ensureInitialized();
      
      if (!this.discoveryDocument) {
        throw new Error('Auth0 not initialized');
      }

      const redirectUri = `${auth0Config.customScheme}://auth`;
      
      const authRequestConfig: AuthSession.AuthRequestConfig = {
        clientId: auth0Config.clientId,
        scopes: auth0Config.scope.split(' '),
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        usePKCE: true,
        extraParams: {
          audience: auth0Config.audience,
          ...auth0Config.customParameters
        },
        prompt: AuthSession.Prompt.Login,
      };

      const authRequest = new AuthSession.AuthRequest(authRequestConfig);
      
      console.log('PKCE Test - AuthRequest created:', {
        hasCodeVerifier: !!authRequest.codeVerifier,
        codeVerifierLength: authRequest.codeVerifier?.length,
        hasCodeChallenge: !!authRequest.codeChallenge,
        codeChallengeLength: authRequest.codeChallenge?.length,
        codeChallengeMethod: authRequest.codeChallengeMethod
      });
      
    } catch (error) {
      console.error('PKCE Test failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const auth0Service = Auth0Service.getInstance();
