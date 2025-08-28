import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { AUTH_CONFIG } from '../../config/auth';
import { buildAuth0Url } from '../../config/developerConfig';

// Configure WebBrowser for Auth0
WebBrowser.maybeCompleteAuthSession();

// Type definitions
export interface Auth0User {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  nickname: string;
  picture: string;
  provider: string;
  connection: string;
}

export interface Auth0TokenResponse {
  status: 'success' | 'error';
  message: string;
  data?: {
    access_token: string;
    id_token: string;
    token_type: string;
    expires_in: number;
  };
}

export interface DirectAuth0TokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  refresh_token?: string;
}

class AuthService {
  private discovery: AuthSession.DiscoveryDocument | null = null;
  private useDirectAuth0: boolean = false;
  private currentRequest: AuthSession.AuthRequest | null = null;

  /**
   * Traditional login method for username/password authentication
   */
  async login(credentials: { username: string; password: string }): Promise<{ status: 'success' | 'error'; message: string; user?: any }> {
    try {
      console.log('🔐 Attempting traditional login for user:', credentials.username);
      
      // Call the backend traditional login endpoint
      const response = await fetch(`${buildAuth0Url().replace('/routes/auth0.php', '/routes/auth_routes.php')}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'login',
          username: credentials.username,
          password: credentials.password,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Traditional login response error:', errorText);
        return {
          status: 'error',
          message: 'Login failed. Please check your credentials and try again.'
        };
      }

      const data = await response.json();
      console.log('Traditional login response:', data);

      if (data.status === 'success' && data.user) {
        return {
          status: 'success',
          message: 'Login successful',
          user: data.user
        };
      } else {
        return {
          status: 'error',
          message: data.message || 'Login failed. Please check your credentials and try again.'
        };
      }
    } catch (error) {
      console.error('❌ Traditional login error:', error);
      return {
        status: 'error',
        message: 'Login failed. Please try again.'
      };
    }
  }

  /**
   * Initialize Auth0 discovery document
   */
  async initialize(): Promise<void> {
    try {
      console.log('🔧 Initializing Auth0 discovery document...');
      
      this.discovery = await AuthSession.fetchDiscoveryAsync(
        `https://${AUTH_CONFIG.auth0.domain}`
      );
      
      console.log('✅ Auth0 discovery document initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Auth0 discovery:', error);
      throw error;
    }
  }

  /**
   * Start Auth0 authentication flow with PKCE
   */
  async authenticate(): Promise<{
    result: AuthSession.AuthSessionResult;
    codeVerifier: string;
  }> {
    try {
      if (!this.discovery) {
        await this.initialize();
      }

      const uniqueState = `${Math.random().toString(36).substring(7)}_${Date.now()}`;
      
      this.currentRequest = new AuthSession.AuthRequest({
        clientId: AUTH_CONFIG.auth0.clientId,
        scopes: AUTH_CONFIG.auth0.scope.split(' '),
        redirectUri: AUTH_CONFIG.auth0.redirectUri,
        responseType: AuthSession.ResponseType.Code,
        codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
        state: uniqueState,
        prompt: AuthSession.Prompt.SelectAccount,
        usePKCE: AUTH_CONFIG.auth.usePKCE,
      });

      const result = await this.currentRequest.promptAsync(this.discovery!, {
        showInRecents: AUTH_CONFIG.auth.showInRecents,
        createTask: AUTH_CONFIG.auth.createTask,
        preferEphemeralSession: AUTH_CONFIG.auth.preferEphemeralSession,
      });
      
      if (result.type === 'error') {
        throw new Error(`Auth0 authentication error: ${result.error}`);
      }
      
      const codeVerifier = this.currentRequest?.codeVerifier;
      
      if (!codeVerifier) {
        throw new Error('Failed to generate PKCE code verifier');
      }
      
      return { result, codeVerifier };
    } catch (error) {
      console.error('❌ Error during Auth0 authentication:', error);
      throw error;
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(
    code: string,
    codeVerifier: string
  ): Promise<Auth0TokenResponse> {
    try {
      console.log('🔄 Attempting backend token exchange...');
      const backendResult = await this.tryBackendTokenExchange(code, codeVerifier);
      this.useDirectAuth0 = false;
      return backendResult;
    } catch (backendError) {
      console.log('⚠️ Backend token exchange failed, falling back to direct Auth0...');
      
      try {
        const directResult = await this.tryDirectAuth0TokenExchange(code, codeVerifier);
        this.useDirectAuth0 = true;
        return this.convertDirectResponseToBackendFormat(directResult);
      } catch (directError) {
        throw new Error(`All token exchange methods failed. Backend: ${backendError}, Direct: ${directError}`);
      }
    }
  }

  /**
   * Try token exchange through backend
   */
  private async tryBackendTokenExchange(
    code: string,
    codeVerifier: string
  ): Promise<Auth0TokenResponse> {
    const response = await fetch(buildAuth0Url(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'token_exchange',
        code: code,
        code_verifier: codeVerifier,
        redirect_uri: AUTH_CONFIG.auth0.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Backend token exchange failed: ${error}`);
    }

    const result = await response.json();
    
    if (!result.user && result.data?.access_token) {
      try {
        const userProfile = await this.getUserProfile(result.data.access_token);
        return {
          ...result,
          user: userProfile,
          data: { ...result.data, user: userProfile }
        };
      } catch (profileError) {
        this.useDirectAuth0 = true;
        try {
          const directUserProfile = await this.tryDirectAuth0GetUserProfile(result.data.access_token);
          return {
            ...result,
            user: directUserProfile,
            data: { ...result.data, user: directUserProfile }
          };
        } catch (directProfileError) {
          return result;
        }
      }
    }
    
    return result;
  }

  /**
   * Try direct token exchange with Auth0
   */
  private async tryDirectAuth0TokenExchange(
    code: string,
    codeVerifier: string
  ): Promise<DirectAuth0TokenResponse> {
    const tokenRequestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: AUTH_CONFIG.auth0.clientId,
      code_verifier: codeVerifier,
      code: code,
      redirect_uri: AUTH_CONFIG.auth0.redirectUri,
    });

    const response = await fetch(AUTH_CONFIG.endpoints.token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenRequestBody.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Direct Auth0 token exchange failed: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Convert direct Auth0 response to backend format
   */
  private convertDirectResponseToBackendFormat(
    directResponse: DirectAuth0TokenResponse
  ): Auth0TokenResponse {
    return {
      status: 'success',
      message: 'Token exchange successful via direct Auth0',
      data: {
        access_token: directResponse.access_token,
        id_token: directResponse.id_token,
        token_type: directResponse.token_type,
        expires_in: directResponse.expires_in,
      },
    };
  }

  /**
   * Get user profile from Auth0
   */
  async getUserProfile(accessToken: string): Promise<Auth0User> {
    if (!this.useDirectAuth0) {
      try {
        return await this.tryBackendGetUserProfile(accessToken);
      } catch (backendError) {
        this.useDirectAuth0 = true;
      }
    }

    try {
      return await this.tryDirectAuth0GetUserProfile(accessToken);
    } catch (directError) {
      throw new Error('Failed to get user profile from all sources');
    }
  }

  /**
   * Try to get user profile through backend
   */
  private async tryBackendGetUserProfile(accessToken: string): Promise<Auth0User> {
    const response = await fetch(buildAuth0Url(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'get_user_profile',
        access_token: accessToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Backend user profile failed: ${response.status} - ${error}`);
    }

    const result = await response.json();
    
    if (result.user && result.user.sub) {
      return result.user;
    } else if (result.data && result.data.sub) {
      return result.data;
    } else if (result.data && result.data.user && result.data.user.sub) {
      return result.data.user;
    } else {
      throw new Error('Backend response missing user profile data');
    }
  }

  /**
   * Try to get user profile directly from Auth0
   */
  private async tryDirectAuth0GetUserProfile(accessToken: string): Promise<Auth0User> {
    const response = await fetch(AUTH_CONFIG.endpoints.userInfo, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Direct Auth0 user profile failed: ${response.status} - ${error}`);
    }

    const rawUserData = await response.json();
    
    return {
      connection: 'Username-Password-Authentication',
      email: rawUserData.email,
      email_verified: rawUserData.email_verified,
      name: rawUserData.name,
      nickname: rawUserData.nickname,
      picture: rawUserData.picture,
      provider: 'auth0',
      sub: rawUserData.sub,
    };
  }

  /**
   * Get current authentication mode
   */
  getCurrentMode(): 'backend' | 'direct' {
    return this.useDirectAuth0 ? 'direct' : 'backend';
  }

  /**
   * Reset to backend mode
   */
  resetToBackendMode(): void {
    this.useDirectAuth0 = false;
    console.log('🔄 Reset to backend mode');
  }

  /**
   * Clear current request
   */
  clearCurrentRequest(): void {
    this.currentRequest = null;
    console.log('🗑️ Cleared current AuthRequest');
  }

  /**
   * Reset discovery document
   */ 
  resetDiscovery(): void {
    this.discovery = null;
    console.log('🔄 Auth0 discovery reset');
  }
}

export default new AuthService();
