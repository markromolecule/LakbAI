import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { AUTH0_CONFIG, AUTH0_ENDPOINTS } from '../../config/auth0Config';
import { API_CONFIG } from '../../config/apiConfig';
import { buildAuth0Url } from '../../config/developerConfig';

// Configure WebBrowser for Auth0
WebBrowser.maybeCompleteAuthSession();

// Declare global types for caches
declare global {
  var auth0Cache: any;
  var userCache: any;
}

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

export interface DirectAuth0TokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  refresh_token?: string;
}

class Auth0Service {
  private discovery: AuthSession.DiscoveryDocument | null = null;
  private useDirectAuth0: boolean = false; // Track if we're using direct Auth0
  private currentRequest: AuthSession.AuthRequest | null = null; // Store current request for PKCE

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
   * Start Auth0 authentication flow using built-in PKCE
   */
  async authenticate(): Promise<{
    result: AuthSession.AuthSessionResult;
    codeVerifier: string;
  }> {
    if (!this.discovery) {
      await this.initialize();
    }

    // Create AuthRequest with PKCE enabled and unique state to force fresh authentication
    const uniqueState = `${Math.random().toString(36).substring(7)}_${Date.now()}`;
    
    this.currentRequest = new AuthSession.AuthRequest({
      clientId: AUTH0_CONFIG.clientId,
      scopes: AUTH0_CONFIG.scope.split(' '),
      redirectUri: AUTH0_CONFIG.redirectUri,
      responseType: AuthSession.ResponseType.Code,
      codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
      state: uniqueState, // Unique state parameter to force fresh authentication
    });

    console.log('🔄 Starting fresh authentication with unique state:', uniqueState);

    // Force Google to show account selection by modifying the authorization URL
    // This is the key to forcing fresh authentication at the Google OAuth server level
    const modifiedDiscovery = {
      ...this.discovery!,
      authorizationEndpoint: `${this.discovery!.authorizationEndpoint}?prompt=select_account&access_type=offline&_t=${Date.now()}&force_refresh=true`
    };

    console.log('🔐 Modified authorization endpoint to force account selection');

    // The code verifier will be automatically generated and stored in the request
    const result = await this.currentRequest.promptAsync(modifiedDiscovery, {
      showInRecents: true,
      // Force new browser session to prevent cached authentication
      createTask: true,
    });

    // Get the code verifier from the request after authentication
    const codeVerifier = this.currentRequest.codeVerifier;
    
    if (!codeVerifier) {
      console.error('❌ PKCE Code Verifier is missing!');
      console.error('AuthRequest state:', {
        hasCodeVerifier: !!this.currentRequest.codeVerifier,
        hasCodeChallenge: !!this.currentRequest.codeChallenge,
        codeChallengeMethod: this.currentRequest.codeChallengeMethod,
      });
      throw new Error('Failed to generate PKCE code verifier - this is a critical PKCE issue');
    }

    // Validate code verifier format
    if (codeVerifier.length < 43 || codeVerifier.length > 128) {
      console.error('❌ Invalid code verifier length:', codeVerifier.length);
      console.error('Expected: 43-128 characters, Got:', codeVerifier.length);
      throw new Error(`Invalid code verifier length: ${codeVerifier.length}`);
    }

    // Debug PKCE values
    console.log('PKCE Debug (Built-in):');
    console.log('- Code Verifier:', codeVerifier);
    console.log('- Code Verifier Length:', codeVerifier.length);
    console.log('- Code Challenge:', this.currentRequest.codeChallenge);
    console.log('- Code Challenge Method:', this.currentRequest.codeChallengeMethod);
    console.log('- Using expo-auth-session built-in PKCE');
    console.log('✅ PKCE setup successful');

    return { result, codeVerifier };
  }

  /**
   * Try backend token exchange first, fallback to direct Auth0 if it fails
   */
  async exchangeCodeForTokens(
    code: string,
    codeVerifier: string
  ): Promise<Auth0TokenResponse> {
    // First, try the backend approach
    try {
      console.log('🔄 Attempting backend token exchange...');
      const backendResult = await this.tryBackendTokenExchange(code, codeVerifier);
      this.useDirectAuth0 = false;
      console.log('✅ Backend token exchange successful');
      return backendResult;
    } catch (backendError) {
      console.log('⚠️ Backend token exchange failed, falling back to direct Auth0...');
      console.log('Backend error:', backendError);
      
      try {
        const directResult = await this.tryDirectAuth0TokenExchange(code, codeVerifier);
        this.useDirectAuth0 = true;
        console.log('✅ Direct Auth0 token exchange successful');
        return this.convertDirectResponseToBackendFormat(directResult);
      } catch (directError) {
        console.error('❌ Both backend and direct Auth0 token exchange failed');
        console.error('Direct Auth0 error:', directError);
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
        redirect_uri: AUTH0_CONFIG.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Backend token exchange failed: ${error}`);
    }

    const result = await response.json();
    
    // If the backend doesn't return user profile, we need to get it separately
    if (!result.user && result.data?.access_token) {
      try {
        const userProfile = await this.getUserProfile(result.data.access_token);
        
        // Return the result with user profile included
        return {
          ...result,
          user: userProfile,
          data: {
            ...result.data,
            user: userProfile
          }
        };
      } catch (profileError) {
        // Set flag to use direct Auth0 for future requests
        this.useDirectAuth0 = true;
        
        // Try to get user profile directly from Auth0
        try {
          const directUserProfile = await this.tryDirectAuth0GetUserProfile(result.data.access_token);
          
          return {
            ...result,
            user: directUserProfile,
            data: {
              ...result.data,
              user: directUserProfile
            }
          };
        } catch (directProfileError) {
          // Return the result without user profile - it will be handled later
          return result;
        }
      }
    }
    
    return result;
  }

  /**
   * Try direct token exchange with Auth0 using PKCE
   */
  private async tryDirectAuth0TokenExchange(
    code: string,
    codeVerifier: string
  ): Promise<DirectAuth0TokenResponse> {
    // Validate code verifier
    if (!codeVerifier || codeVerifier.length < 43 || codeVerifier.length > 128) {
      throw new Error(`Invalid code verifier: length ${codeVerifier?.length || 0}, expected 43-128 characters`);
    }
    
    // Validate code
    if (!code || code.length < 10) {
      throw new Error(`Invalid authorization code: length ${code?.length || 0}`);
    }
    
    const tokenRequestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: AUTH0_CONFIG.clientId,
      code_verifier: codeVerifier,
      code: code,
      redirect_uri: AUTH0_CONFIG.redirectUri,
    });

    const response = await fetch(AUTH0_ENDPOINTS.token, {
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

    const result = await response.json();
    return result;
  }

  /**
   * Convert direct Auth0 response to backend format for consistency
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

    // Use direct Auth0 if backend failed or we're already in direct mode
    try {
      const userProfile = await this.tryDirectAuth0GetUserProfile(accessToken);
      return userProfile;
    } catch (directError) {
      throw new Error('Failed to get user profile from all sources');
    }
  }

  /**
   * Try to get user profile through backend
   */
  private async tryBackendGetUserProfile(accessToken: string): Promise<Auth0User> {
    try {
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
      
      // Check if the backend actually returned user data
      if (result.user && result.user.sub) {
        return result.user;
      } else if (result.data && result.data.sub) {
        return result.data;
      } else if (result.data && result.data.user && result.data.user.sub) {
        return result.data.user;
      } else {
        throw new Error('Backend response missing user profile data');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Try to get user profile directly from Auth0
   */
  private async tryDirectAuth0GetUserProfile(accessToken: string): Promise<Auth0User> {
    try {
      const response = await fetch(AUTH0_ENDPOINTS.userInfo, {
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
      
      // Convert to our expected format
      const convertedUserData: Auth0User = {
        connection: 'Username-Password-Authentication',
        email: rawUserData.email,
        email_verified: rawUserData.email_verified,
        name: rawUserData.name,
        nickname: rawUserData.nickname,
        picture: rawUserData.picture,
        provider: 'auth0',
        sub: rawUserData.sub,
      };

      return convertedUserData;
    } catch (error) {
      throw new Error(`Direct Auth0 user profile failed: ${error}`);
    }
  }

  /**
   * Check if user needs to update their email in Auth0
   * This is useful for users who have changed their Google account email
   */
  async checkEmailUpdateNeeded(currentEmail: string, expectedEmail?: string): Promise<{
    needsUpdate: boolean;
    currentEmail: string;
    expectedEmail?: string;
    message: string;
  }> {
    if (!expectedEmail) {
      return {
        needsUpdate: false,
        currentEmail,
        message: 'No expected email provided for comparison'
      };
    }

    const needsUpdate = currentEmail.toLowerCase() !== expectedEmail.toLowerCase();
    
    if (needsUpdate) {
      console.log('⚠️ Email mismatch detected:');
      console.log('- Current (Auth0):', currentEmail);
      console.log('- Expected:', expectedEmail);
      console.log('💡 User may need to update their Google account email');
    }

    return {
      needsUpdate,
      currentEmail,
      expectedEmail,
      message: needsUpdate 
        ? `Email mismatch detected. Current: ${currentEmail}, Expected: ${expectedEmail}`
        : 'Email is up to date'
    };
  }

  /**
   * Get instructions for updating email in Auth0
   */
  getEmailUpdateInstructions(): string {
    return `
📧 Email Update Instructions:

If your email appears outdated in the app, you need to update it in your Google account:

1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to "Personal info" → "Email"
3. Update your email address
4. Wait a few minutes for changes to propagate
5. Sign out and sign back in to the app

Note: The app uses your Google account email for authentication.
    `.trim();
  }

  /**
   * Normalize response structure to ensure consistency
   * This helps calling code handle both backend and fallback responses uniformly
   */
  private normalizeResponseStructure(response: any): any {
    // If response already has the expected structure, return as is
    if (response.user && response.data) {
      return response;
    }
    
    // If response has data but no user, create user from data
    if (response.data && !response.user) {
      return {
        ...response,
        user: response.data
      };
    }
    
    // If response has user but no data, create data from user
    if (response.user && !response.data) {
      return {
        ...response,
        data: response.user
      };
    }
    
    // If neither exists, create both from available information
    const userData = response.user || response.data || {};
    return {
      ...response,
      user: userData,
      data: userData
    };
  }

  /**
   * Sync user with database
   */
  async syncUserWithDatabase(userProfile: any): Promise<any> {
    try {
      const { buildAuth0Url, getCurrentDeveloperIP } = require('../../config/developerConfig');
      const primaryUrl = buildAuth0Url();
      const ip = getCurrentDeveloperIP();
      
      // Prepare user data for sync
      const userData = {
        action: 'auth0_sync',
        auth0_user: {
          sub: userProfile.sub, // Backend expects 'sub', not 'auth0_id'
          email: userProfile.email,
          email_verified: userProfile.email_verified,
          name: userProfile.name,
          first_name: userProfile.given_name || userProfile.name?.split(' ')[0],
          last_name: userProfile.family_name || userProfile.name?.split(' ').slice(1).join(' '),
          nickname: userProfile.nickname,
          picture: userProfile.picture,
          provider: userProfile.provider || 'auth0',
          user_type: 'passenger',
          roles: ['passenger'],
          created_at: new Date().toISOString()
        }
      };
      
      // Try primary endpoint first
      try {
        const response = await fetch(primaryUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        });
        
        if (response.ok) {
          const result = await response.json();
          
          // Check if backend returned an error status
          if (result.status === 'error') {
            throw new Error(`Backend sync failed: ${result.message}`);
          }
          
          return result;
        } else {
          const errorText = await response.text();
          throw new Error(`Backend sync failed: ${response.status} - ${errorText}`);
        }
      } catch (primaryError) {
        // Try alternative endpoints if primary fails
        const alternativeEndpoints = [
          `http://${ip}/LakbAI/LakbAI-API/routes/auth0.php`,
          `http://${ip}/LakbAI-API/routes/auth0_routes.php`,
          `http://${ip}/LakbAI-API/api/auth0/sync-user`,
          `http://${ip}/LakbAI-API/auth0.php`,
          `http://${ip}/routes/auth0.php`,
          `http://${ip}/auth0.php`
        ];
        
        for (const endpoint of alternativeEndpoints) {
          try {
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(userData)
            });
            
            if (response.ok) {
              const result = await response.json();
              
              // Check if backend returned an error status
              if (result.status === 'error') {
                throw new Error(`Backend sync failed: ${result.message}`);
              }
              
              return result;
            }
          } catch (endpointError) {
            // Continue to next endpoint
          }
        }
        
        // If all endpoints fail, provide fallback response
        return {
          backend_available: false,
          status: 'success',
          message: 'User sync completed (backend unavailable)',
          data: {
            auth0_id: userProfile.sub,
            created_at: new Date().toISOString(),
            email: userProfile.email,
            name: userProfile.name,
            profile_completed: false,
            updated_at: new Date().toISOString(),
            user_type: 'passenger'
          },
          user: {
            auth0_id: userProfile.sub,
            created_at: new Date().toISOString(),
            email: userProfile.email,
            name: userProfile.name,
            profile_completed: false,
            updated_at: new Date().toISOString(),
            user_type: 'passenger'
          }
        };
      }
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Complete user profile
   */
  async completeProfile(auth0Id: string, userId: string, profileData: any): Promise<any> {
    try {
      const { buildAuth0Url, getCurrentDeveloperIP } = require('../../config/developerConfig');
      const primaryUrl = buildAuth0Url();
      const ip = getCurrentDeveloperIP();
      
      // Prepare profile completion data with required auth0_id and user_id
      const completionData = {
        action: 'complete_profile',
        auth0_id: auth0Id, // Use the passed auth0Id parameter
        user_id: userId, // Include userId as fallback
        profile_data: {
          ...profileData,
          user_type: profileData.user_type || 'passenger',
          profile_completed: true,
          updated_at: new Date().toISOString()
        }
      };
      
      // Try primary endpoint first
      try {
        const response = await fetch(primaryUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(completionData)
        });
        
        if (response.ok) {
          const result = await response.json();
          return result;
        } else {
          const errorText = await response.text();
          throw new Error(`Profile completion failed: ${response.status} - ${errorText}`);
        }
      } catch (primaryError) {
        // Try alternative endpoints if primary fails
        const alternativeEndpoints = [
          `http://${ip}/LakbAI/LakbAI-API/routes/auth0.php`,
          `http://${ip}/LakbAI-API/routes/auth0_routes.php`,
          `http://${ip}/LakbAI-API/api/auth0/complete-profile`,
          `http://${ip}/LakbAI-API/auth0.php`,
          `http://${ip}/routes/auth0.php`,
          `http://${ip}/auth0.php`
        ];
        
        for (const endpoint of alternativeEndpoints) {
          try {
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(completionData)
            });
            
            if (response.ok) {
              const result = await response.json();
              return result;
            }
          } catch (endpointError) {
            // Continue to next endpoint
          }
        }
        
        // If all endpoints fail, provide fallback response
        return {
          backend_available: false,
          status: 'success',
          message: 'Profile completion completed (backend unavailable)',
          data: {
            profile_completed: true,
            updated_at: new Date().toISOString()
          }
        };
      }
      
    } catch (error) {
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

  /**
   * Get current authentication mode
   */
  getCurrentMode(): 'backend' | 'direct' {
    return this.useDirectAuth0 ? 'direct' : 'backend';
  }

  /**
   * Reset to backend mode (useful for testing)
   */
  resetToBackendMode(): void {
    this.useDirectAuth0 = false;
    console.log('🔄 Reset to backend mode');
  }

  /**
   * Clear current request (useful for testing)
   */
  clearCurrentRequest(): void {
    this.currentRequest = null;
    console.log('🗑️ Cleared current AuthRequest');
  }

  /**
   * Clear all expo-auth-session related data to force fresh authentication
   */
  async clearExpoAuthSessionData(): Promise<void> {
    try {
      console.log('🧹 Clearing expo-auth-session data...');
      
      // Clear AsyncStorage keys that expo-auth-session might use
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage');
        
        // Get all keys and filter for expo auth session related ones
        const allKeys = await AsyncStorage.getAllKeys();
        const expoAuthKeys = allKeys.filter((key: string) => 
          key.includes('expo.authsession') || 
          key.includes('expo.auth') ||
          key.includes('authsession')
        );
        
        if (expoAuthKeys.length > 0) {
          await AsyncStorage.multiRemove(expoAuthKeys);
          console.log(`✅ Cleared ${expoAuthKeys.length} expo auth session keys:`, expoAuthKeys);
        } else {
          console.log('ℹ️ No expo auth session keys found');
        }
      } catch (error) {
        console.log('⚠️ Could not clear expo auth session keys:', error);
      }
      
      console.log('✅ Expo auth session data cleared');
    } catch (error) {
      console.error('❌ Error clearing expo auth session data:', error);
      throw error;
    }
  }

  /**
   * Test backend connectivity for Auth0 endpoints
   */
  async testBackendConnectivity(): Promise<{ reachable: boolean; error?: string; details?: any }> {
    try {
      console.log('🔍 Testing backend connectivity for Auth0 endpoints...');
      
      const { buildAuth0Url } = require('../../config/developerConfig');
      const auth0Url = buildAuth0Url();
      
      console.log('📍 Testing URL:', auth0Url);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch(auth0Url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'ping',
            test: true,
            timestamp: Date.now()
          }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.text();
          console.log('✅ Backend is reachable');
          return {
            reachable: true,
            details: {
              status: response.status,
              response: data
            }
          };
        } else {
          const errorText = await response.text();
          console.log(`⚠️ Backend responded with status: ${response.status}`);
          return {
            reachable: false,
            error: `HTTP ${response.status}: ${errorText}`,
            details: {
              status: response.status,
              response: errorText
            }
          };
        }
      } catch (fetchError: unknown) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          return {
            reachable: false,
            error: 'Request timeout - server not responding'
          };
        }
        
        throw fetchError;
      }
    } catch (error) {
      console.error('❌ Backend connectivity test failed:', error);
      return {
        reachable: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test alternative backend endpoints to find working ones
   */
  async testAlternativeEndpoints(): Promise<{ workingEndpoints: string[]; errors: any[] }> {
    try {
      console.log('🔍 Testing alternative backend endpoints...');
      
      const { getCurrentDeveloperIP } = require('../../config/developerConfig');
      const ip = getCurrentDeveloperIP();
      const baseUrl = `http://${ip}/LakbAI/LakbAI-API`;
      
      const endpointsToTest = [
        // Correct Auth0 sync endpoint (matches your Auth0 action)
        `http://${ip}/LakbAI/LakbAI-API/api/auth0/sync-user`,
        // Existing Auth0 sync endpoint (your current implementation)
        `http://${ip}/LakbAI/LakbAI-API/routes/auth0_routes.php`,
        // Alternative Auth0 sync endpoints
        `http://${ip}/api/auth0/sync-user`,
        `http://${ip}/api/auth0/sync`,
        `http://${ip}/auth0/sync-user`,
        // Original endpoints (for testing)
        `${baseUrl}/routes/auth0.php`,
        `${baseUrl}/routes/api.php`,
        `${baseUrl}/routes/health_check.php`,
        `${baseUrl}/auth0.php`,
        `${baseUrl}/api.php`,
        `${baseUrl}/health_check.php`,
        `http://${ip}/LakbAI-API/routes/auth0.php`,
        `http://${ip}/LakbAI-API/routes/api.php`,
        `http://${ip}/LakbAI-API/auth0.php`,
        `http://${ip}/LakbAI-API/api.php`,
      ];
      
      const workingEndpoints: string[] = [];
      const errors: any[] = [];
      
      for (const endpoint of endpointsToTest) {
        try {
          console.log(`🔍 Testing: ${endpoint}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
          try {
            const response = await fetch(endpoint, {
              method: 'HEAD', // Just check if endpoint responds
              signal: controller.signal,
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              console.log(`✅ Working endpoint: ${endpoint}`);
              workingEndpoints.push(endpoint);
            } else {
              console.log(`⚠️ Endpoint responded with status: ${response.status}: ${endpoint}`);
            }
          } catch (fetchError: unknown) {
            clearTimeout(timeoutId);
            
            if (fetchError instanceof Error && fetchError.name === 'AbortError') {
              console.log(`⏰ Timeout: ${endpoint}`);
            } else {
              console.log(`❌ Error: ${endpoint} - ${fetchError}`);
            }
          }
        } catch (error) {
          console.log(`❌ Failed to test: ${endpoint} - ${error}`);
          errors.push({ endpoint, error });
        }
      }
      
      console.log(`🎯 Found ${workingEndpoints.length} working endpoints`);
      return { workingEndpoints, errors };
      
    } catch (error) {
      console.error('❌ Alternative endpoint testing failed:', error);
      return { workingEndpoints: [], errors: [error] };
    }
  }

  /**
   * Force Google OAuth to show account selection by clearing all possible states
   */
  async forceGoogleAccountSelection(): Promise<void> {
    try {
      console.log('🔐 Forcing Google account selection...');
      
      // Clear all possible Google OAuth related data
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage');
        
        // Get all keys and remove Google/OAuth related ones
        const allKeys = await AsyncStorage.getAllKeys();
        const googleOAuthKeys = allKeys.filter((key: string) => 
          key.includes('google') || 
          key.includes('oauth') ||
          key.includes('gmail') ||
          key.includes('auth0') ||
          key.includes('expo.auth') ||
          key.includes('authsession')
        );
        
        if (googleOAuthKeys.length > 0) {
          await AsyncStorage.multiRemove(googleOAuthKeys);
          console.log(`✅ Cleared ${googleOAuthKeys.length} Google OAuth keys:`, googleOAuthKeys);
        }
      } catch (error) {
        console.log('⚠️ Could not clear Google OAuth keys:', error);
      }
      
      // Force clear any browser sessions
      try {
        await WebBrowser.coolDownAsync();
        console.log('✅ Browser sessions cooled down');
      } catch (error) {
        console.log('⚠️ Could not cool down browser sessions:', error);
      }
      
      // Reset discovery to force fresh connection
      this.discovery = null;
      console.log('✅ Auth0 discovery reset');
      
      // Clear current request completely
      this.currentRequest = null;
      console.log('✅ Current request cleared');
      
      // Force clear any cached OAuth state by adding a random parameter
      // This ensures that even if Google caches the OAuth flow, our unique parameters will force a fresh flow
      console.log('🔄 OAuth state completely reset - next authentication will be fresh');
      
      console.log('🎉 Google account selection forced');
    } catch (error) {
      console.error('❌ Error forcing Google account selection:', error);
      throw error;
    }
  }

  /**
   * Force fresh authentication by clearing all possible cached states
   * This method should be called before starting authentication to prevent
   * automatic login with previous accounts
   */
  async forceFreshAuthentication(): Promise<void> {
    try {
      console.log('🔄 Forcing fresh authentication...');
      
      // Clear current request
      this.clearCurrentRequest();
      
      // Reset to backend mode
      this.resetToBackendMode();
      
      // Clear expo auth session data first
      await this.clearExpoAuthSessionData();
      
      // Force Google account selection
      await this.forceGoogleAccountSelection();
      
      // Clear AsyncStorage tokens
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage');
        
        const keysToRemove = [
          'auth0_access_token',
          'auth0_id_token',
          'auth0_refresh_token',
          'auth0_user_profile',
          'auth0_code_verifier',
          'auth0_state',
          'user_session',
          'auth_state',
        ];
        
        for (const key of keysToRemove) {
          await AsyncStorage.removeItem(key);
        }
        
        console.log('✅ AsyncStorage tokens cleared');
      } catch (error) {
        console.log('⚠️ Could not clear AsyncStorage tokens:', error);
      }
      
      // Clear any global caches safely
      try {
        if (typeof global !== 'undefined' && global.auth0Cache) {
          global.auth0Cache = {};
          console.log('✅ Global auth0Cache cleared');
        }
        
        if (typeof global !== 'undefined' && global.userCache) {
          global.userCache = {};
          console.log('✅ Global userCache cleared');
        }
      } catch (error) {
        console.log('⚠️ Could not clear global caches:', error);
      }
      
      console.log('🎉 Fresh authentication state ready');
    } catch (error) {
      console.error('❌ Error forcing fresh authentication:', error);
      throw error;
    }
  }

  /**
   * Comprehensive session clear - clears all authentication state
   */
  async clearAllSessions(): Promise<void> {
    try {
      console.log('🧹 Clearing all Auth0 sessions...');
      
      // Clear current request
      this.clearCurrentRequest();
      
      // Reset to backend mode
      this.resetToBackendMode();
      
      // Clear any stored tokens from AsyncStorage
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage');
        
        const keysToRemove = [
          'auth0_access_token',
          'auth0_id_token',
          'auth0_refresh_token',
          'auth0_user_profile',
          'auth0_code_verifier',
          'auth0_state',
          'user_session',
          'auth_state'
        ];
        
        for (const key of keysToRemove) {
          await AsyncStorage.removeItem(key);
        }
        
        console.log('✅ AsyncStorage tokens cleared');
      } catch (error) {
        console.log('⚠️ Could not clear AsyncStorage tokens:', error);
      }
      
      console.log('🎉 All Auth0 sessions cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing sessions:', error);
      throw error;
    }
  }

  /**
   * Debug current AuthRequest state for troubleshooting
   */
  debugCurrentRequest(): void {
    if (this.currentRequest) {
      console.log('🔍 Current AuthRequest Debug Info:');
      console.log('- Code Verifier:', this.currentRequest.codeVerifier);
      console.log('- Code Challenge:', this.currentRequest.codeChallenge);
      console.log('- Code Challenge Method:', this.currentRequest.codeChallengeMethod);
      console.log('- Redirect URI:', this.currentRequest.redirectUri);
      console.log('- Client ID:', this.currentRequest.clientId);
    } else {
      console.log('🔍 No current AuthRequest found');
    }
  }
}

export default new Auth0Service();
