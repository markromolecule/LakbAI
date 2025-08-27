import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { AUTH_CONFIG } from '../../config/auth';
import { buildAuth0Url } from '../../config/developerConfig';
import { Auth0User } from './authService';

// Type definitions
export interface UserSession {
  userId: string;
  username: string;
  email: string;
  userType: 'passenger' | 'driver';
  loginTime: string;
  profileCompleted: boolean;
  auth0Id: string;
}

export interface SessionData {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  userProfile: Auth0User;
  expiresAt: number;
}

class SessionManager {
  /**
   * Store user session data
   */
  async storeUserSession(sessionData: SessionData, userType: 'passenger' | 'driver' = 'passenger'): Promise<void> {
    try {
      const session: UserSession = {
        userId: sessionData.userProfile.sub,
        username: sessionData.userProfile.nickname || sessionData.userProfile.name,
        email: sessionData.userProfile.email,
        userType,
        loginTime: new Date().toISOString(),
        profileCompleted: false,
        auth0Id: sessionData.userProfile.sub,
      };

      // Store session data
      await AsyncStorage.setItem(AUTH_CONFIG.session.storageKeys.userSession, JSON.stringify(session));
      await AsyncStorage.setItem(AUTH_CONFIG.session.storageKeys.accessToken, sessionData.accessToken);
      await AsyncStorage.setItem(AUTH_CONFIG.session.storageKeys.idToken, sessionData.idToken);
      await AsyncStorage.setItem(AUTH_CONFIG.session.storageKeys.userProfile, JSON.stringify(sessionData.userProfile));
      
      if (sessionData.refreshToken) {
        await AsyncStorage.setItem(AUTH_CONFIG.session.storageKeys.refreshToken, sessionData.refreshToken);
      }

      // Store expiration time (already calculated in useAuth hook)
      await AsyncStorage.setItem('session_expires_at', sessionData.expiresAt.toString());

      console.log('✅ User session stored successfully');
    } catch (error) {
      console.error('❌ Error storing user session:', error);
      throw error;
    }
  }

  /**
   * Get current user session
   */
  async getUserSession(): Promise<UserSession | null> {
    try {
      const sessionData = await AsyncStorage.getItem(AUTH_CONFIG.session.storageKeys.userSession);
      if (!sessionData) return null;

      const session: UserSession = JSON.parse(sessionData);
      
      // Check if session is expired
      const expiresAt = await AsyncStorage.getItem('session_expires_at');
      if (expiresAt && Date.now() > parseInt(expiresAt)) {
        console.log('⚠️ Session expired, clearing...');
        await this.clearUserSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('❌ Error getting user session:', error);
      return null;
    }
  }

  /**
   * Check if user session is valid
   */
  async isSessionValid(): Promise<boolean> {
    try {
      const session = await this.getUserSession();
      if (!session) return false;

      const accessToken = await AsyncStorage.getItem(AUTH_CONFIG.session.storageKeys.accessToken);
      return !!accessToken;
    } catch (error) {
      console.error('❌ Error checking session validity:', error);
      return false;
    }
  }

  /**
   * Clear user session
   */
  async clearUserSession(): Promise<void> {
    try {
      const keysToRemove = [
        AUTH_CONFIG.session.storageKeys.userSession,
        AUTH_CONFIG.session.storageKeys.accessToken,
        AUTH_CONFIG.session.storageKeys.idToken,
        AUTH_CONFIG.session.storageKeys.refreshToken,
        AUTH_CONFIG.session.storageKeys.userProfile,
        'session_expires_at',
      ];

      await AsyncStorage.multiRemove(keysToRemove);
      console.log('✅ User session cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing user session:', error);
      throw error;
    }
  }

  /**
   * Clear all authentication data
   */
  async clearAllAuthData(): Promise<void> {
    try {
      console.log('🧹 Clearing all authentication data...');
      
      // Clear all stored tokens and sessions
      const keysToRemove = [
        AUTH_CONFIG.session.storageKeys.accessToken,
        AUTH_CONFIG.session.storageKeys.idToken,
        AUTH_CONFIG.session.storageKeys.refreshToken,
        AUTH_CONFIG.session.storageKeys.userProfile,
        AUTH_CONFIG.session.storageKeys.codeVerifier,
        AUTH_CONFIG.session.storageKeys.codeChallenge,
        AUTH_CONFIG.session.storageKeys.state,
        AUTH_CONFIG.session.storageKeys.userSession,
        AUTH_CONFIG.session.storageKeys.authState,
        'session_expires_at',
      ];
      
      await AsyncStorage.multiRemove(keysToRemove);
      console.log('✅ AsyncStorage tokens cleared');
      
      // Clear expo auth session data
      await this.clearExpoAuthSessionData();
      
      // Clear Google OAuth state
      await this.clearGoogleOAuthState();
      
      console.log('🎉 All authentication data cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing authentication data:', error);
      throw error;
    }
  }

  /**
   * Clear expo auth session data
   */
  async clearExpoAuthSessionData(): Promise<void> {
    try {
      console.log('🧹 Clearing expo-auth-session data...');
      
      const allKeys = await AsyncStorage.getAllKeys();
      const expoAuthKeys = allKeys.filter((key: string) => 
        key.includes('expo.authsession') || 
        key.includes('expo.auth') ||
        key.includes('authsession')
      );
      
      if (expoAuthKeys.length > 0) {
        await AsyncStorage.multiRemove(expoAuthKeys);
        console.log(`✅ Cleared ${expoAuthKeys.length} expo auth session keys`);
      }
      
      console.log('✅ Expo auth session data cleared');
    } catch (error) {
      console.error('❌ Error clearing expo auth session data:', error);
      throw error;
    }
  }

  /**
   * Clear Google OAuth state
   */
  async clearGoogleOAuthState(): Promise<void> {
    try {
      console.log('🧹 Clearing Google OAuth state...');
      
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
        console.log(`✅ Cleared ${googleOAuthKeys.length} Google OAuth keys`);
      }
      
      // Force clear any browser sessions
      await WebBrowser.coolDownAsync();
      console.log('✅ Browser sessions cooled down');
      
      console.log('✅ Google OAuth state cleared');
    } catch (error) {
      console.error('❌ Error clearing Google OAuth state:', error);
      throw error;
    }
  }

  /**
   * Set logout flag
   */
  async setLogoutFlag(): Promise<void> {
    try {
      await AsyncStorage.setItem(AUTH_CONFIG.session.storageKeys.logoutFlag, 'true');
      console.log('✅ Logout flag set');
    } catch (error) {
      console.error('❌ Error setting logout flag:', error);
      throw error;
    }
  }

  /**
   * Check if user has logged out
   */
  async hasUserLoggedOut(): Promise<boolean> {
    try {
      const logoutFlag = await AsyncStorage.getItem(AUTH_CONFIG.session.storageKeys.logoutFlag);
      
      if (logoutFlag === 'true') {
        console.log('🚫 Logout flag detected - user has logged out');
        return true;
      }
      
      // Also check if there are any stored tokens
      const accessToken = await AsyncStorage.getItem(AUTH_CONFIG.session.storageKeys.accessToken);
      const userProfile = await AsyncStorage.getItem(AUTH_CONFIG.session.storageKeys.userProfile);
      
      if (!accessToken && !userProfile) {
        console.log('✅ No stored tokens found - user needs fresh authentication');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error checking logout state:', error);
      return false;
    }
  }

  /**
   * Clear logout flag
   */
  async clearLogoutFlag(): Promise<void> {
    try {
      await AsyncStorage.removeItem(AUTH_CONFIG.session.storageKeys.logoutFlag);
      console.log('✅ Logout flag cleared');
    } catch (error) {
      console.error('❌ Error clearing logout flag:', error);
      throw error;
    }
  }

  /**
   * Sync user with database
   */
  async syncUserWithDatabase(userProfile: Auth0User): Promise<any> {
    try {
      const { getCurrentDeveloperIP } = require('../../config/developerConfig');
      const primaryUrl = buildAuth0Url();
      const ip = getCurrentDeveloperIP();
      
      const userData = {
        action: 'auth0_sync',
        auth0_user: {
          sub: userProfile.sub,
          email: userProfile.email,
          email_verified: userProfile.email_verified,
          name: userProfile.name,
          first_name: userProfile.name?.split(' ')[0],
          last_name: userProfile.name?.split(' ').slice(1).join(' '),
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
      const { getCurrentDeveloperIP } = require('../../config/developerConfig');
      const primaryUrl = buildAuth0Url();
      const ip = getCurrentDeveloperIP();
      
      const completionData = {
        action: 'complete_profile',
        auth0_id: auth0Id,
        user_id: userId,
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
          return await response.json();
        } else {
          const errorText = await response.text();
          throw new Error(`Profile completion failed: ${response.status} - ${errorText}`);
        }
      } catch (primaryError) {
        // Try alternative endpoints if primary fails
        const alternativeEndpoints = [
          `http://${ip}/LakbAI/LakbAI-API/routes/auth0.php`,
          `http://${ip}/LakbAI/LakbAI-API/routes/auth0_routes.php`,
          `http://${ip}/LakbAI/LakbAI-API/api/auth0/complete-profile`,
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
              return await response.json();
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
   * Get access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(AUTH_CONFIG.session.storageKeys.accessToken);
    } catch (error) {
      console.error('❌ Error getting access token:', error);
      return null;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(): Promise<Auth0User | null> {
    try {
      const profileData = await AsyncStorage.getItem(AUTH_CONFIG.session.storageKeys.userProfile);
      return profileData ? JSON.parse(profileData) : null;
    } catch (error) {
      console.error('❌ Error getting user profile:', error);
      return null;
    }
  }
}

export default new SessionManager();
