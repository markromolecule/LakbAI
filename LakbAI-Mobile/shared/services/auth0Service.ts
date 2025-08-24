import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { AUTH0_CONFIG, AUTH0_ENDPOINTS } from '../../config/auth0Config';
import { API_CONFIG } from '../../config/apiConfig';

// Configure WebBrowser for Auth0
WebBrowser.maybeCompleteAuthSession();

export interface Auth0User {
  sub: string; // Auth0 user ID
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

class Auth0Service {
  private discovery: AuthSession.DiscoveryDocument | null = null;

  /**
   * Initialize Auth0 discovery document
   */
  async initialize(): Promise<void> {
    try {
      this.discovery = await AuthSession.fetchDiscoveryAsync(
        `https://${AUTH0_CONFIG.domain}`
      );
    } catch (error) {
      console.error('Failed to initialize Auth0 discovery:', error);
      throw error;
    }
  }

  /**
   * Generate PKCE challenge for secure OAuth flow
   */
  private async generatePKCEChallenge(): Promise<{
    codeVerifier: string;
    codeChallenge: string;
  }> {
    // Generate a random code verifier (43-128 characters, URL-safe)
    const generateRandomString = (length: number): string => {
      // Use only URL-safe characters (no dots, no special chars)
      const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      return result;
    };

    // Generate code verifier (43-128 characters as per RFC 7636)
    const codeVerifier = generateRandomString(64);
    
    // Generate code challenge using SHA256 hash
    let codeChallenge = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      codeVerifier,
      { encoding: Crypto.CryptoEncoding.BASE64 }
    );
    
    console.log('PKCE Generation Debug:');
    console.log('- Raw Code Challenge (BASE64):', codeChallenge);
    console.log('- Raw Code Challenge Length:', codeChallenge.length);
    
    // Make BASE64 URL-safe according to RFC 4648
    // Replace + with - and / with _
    codeChallenge = codeChallenge
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    
    // IMPORTANT: Do NOT remove padding for Auth0 PKCE
    // Auth0 expects the full BASE64 string with proper padding handling
    // The padding will be automatically handled by the URL encoding
    
    console.log('- Final Code Challenge (URL-safe):', codeChallenge);
    console.log('- Final Code Challenge Length:', codeChallenge.length);

    return { codeVerifier, codeChallenge };
  }

  /**
   * Start Auth0 authentication flow
   */
  async authenticate(): Promise<{
    result: AuthSession.AuthSessionResult;
    codeVerifier: string;
  }> {
    if (!this.discovery) {
      await this.initialize();
    }

    const { codeVerifier, codeChallenge } = await this.generatePKCEChallenge();
    
    // Debug PKCE values
    console.log('PKCE Debug:');
    console.log('- Code Verifier:', codeVerifier);
    console.log('- Code Challenge:', codeChallenge);
    console.log('- Code Verifier Length:', codeVerifier.length);
    console.log('- Code Challenge Length:', codeChallenge.length);

    const request = new AuthSession.AuthRequest({
      clientId: AUTH0_CONFIG.clientId,
      scopes: AUTH0_CONFIG.scope.split(' '),
      redirectUri: AUTH0_CONFIG.redirectUri,
      responseType: AuthSession.ResponseType.Code,
      codeChallenge: codeChallenge,
      codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
      state: Math.random().toString(36).substring(7), // Add state parameter for security
    });

    const result = await request.promptAsync(this.discovery!, {
      showInRecents: true,
    });

    return { result, codeVerifier };
  }

  /**
   * Exchange authorization code for tokens
   * Note: For mobile apps, we'll use the backend to handle token exchange
   * since client secret should not be exposed in frontend code
   */
  async exchangeCodeForTokens(
    code: string,
    codeVerifier: string
  ): Promise<Auth0TokenResponse> {
    try {
      // Debug token exchange request
      console.log('Token Exchange Debug:');
      console.log('- Code:', code);
      console.log('- Code Verifier:', codeVerifier);
      console.log('- Redirect URI:', AUTH0_CONFIG.redirectUri);
      
      // Use our backend to handle the token exchange securely
      const response = await fetch(`${API_CONFIG.BASE_URL.replace('/routes/api.php', '/routes/auth0.php')}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'token_exchange',
          code: code,
          code_verifier: codeVerifier,
          redirect_uri: AUTH0_CONFIG.redirectUri,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token exchange failed: ${error}`);
      }

      return response.json();
    } catch (error) {
      console.error('Token exchange error:', error);
      throw new Error(`Token exchange failed: ${error}`);
    }
  }

  /**
   * Get user profile from Auth0 through our backend
   */
  async getUserProfile(accessToken: string): Promise<Auth0User> {
    try {
      // Use our backend to get the user profile securely
      const response = await fetch(`${API_CONFIG.BASE_URL.replace('/routes/api.php', '/routes/auth0.php')}`, {
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
        throw new Error(`Failed to get user profile: ${error}`);
      }

      const result = await response.json();
      if (result.status === 'success') {
        return result.user;
      } else {
        throw new Error(result.message || 'Failed to get user profile');
      }
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw error;
    }
  }

  /**
   * Sync Auth0 user with local database
   */
  async syncUserWithDatabase(auth0User: Auth0User): Promise<any> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL.replace('/api.php', '/auth0.php')}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'auth0_sync',
          auth0_user: auth0User,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Sync failed: ${error}`);
      }

      return response.json();
    } catch (error) {
      console.error('Failed to sync user with database:', error);
      throw error;
    }
  }

  /**
   * Complete user profile after Auth0 authentication
   */
  async completeProfile(
    auth0Id: string,
    profileData: any
  ): Promise<any> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL.replace('/api.php', '/auth0.php')}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'complete_profile',
          auth0_id: auth0Id,
          profile_data: profileData,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Profile completion failed: ${error}`);
      }

      return response.json();
    } catch (error) {
      console.error('Failed to complete profile:', error);
      throw error;
    }
  }

  /**
   * Logout from Auth0
   */
  async logout(): Promise<void> {
    const logoutUrl = `${AUTH0_ENDPOINTS.logout}?client_id=${AUTH0_CONFIG.clientId}&returnTo=${encodeURIComponent(AUTH0_CONFIG.redirectUri)}`;
    
    try {
      await WebBrowser.openAuthSessionAsync(logoutUrl, AUTH0_CONFIG.redirectUri);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }
}

export default new Auth0Service();
