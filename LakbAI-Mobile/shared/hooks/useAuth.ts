import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import authService from '../services/authService';
import sessionManager from '../services/sessionManager';
import { Auth0User, Auth0TokenResponse } from '../services/authService';
import { UserSession, SessionData } from '../services/sessionManager';
import { PassengerRoutes } from '../../routes';

// Authentication state interface
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: Auth0User | null;
  session: UserSession | null;
  error: string | null;
}

// Authentication methods interface
export interface AuthMethods {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  forceFreshAuth: () => Promise<void>;
  syncUser: (userProfile: Auth0User) => Promise<any>;
  completeProfile: (auth0Id: string, userId: string, profileData: any) => Promise<any>;
}

// Hook return type
export type UseAuthReturn = AuthState & AuthMethods;

export const useAuth = (): UseAuthReturn => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    session: null,
    error: null,
  });

  const router = useRouter();

  /**
   * Check for existing session on mount
   */
  useEffect(() => {
    checkSession();
  }, []);

  /**
   * Check for existing valid session
   */
  const checkSession = useCallback(async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Check if user has explicitly logged out
      const hasLoggedOut = await sessionManager.hasUserLoggedOut();
      
      if (hasLoggedOut) {
        console.log('🚫 User has logged out, preparing for fresh authentication...');
        await forceFreshAuth();
        return;
      }
      
      // Check for existing valid session
      const session = await sessionManager.getUserSession();
      const isSessionValid = await sessionManager.isSessionValid();
      
      if (session && isSessionValid) {
        const userProfile = await sessionManager.getUserProfile();
        
        if (userProfile) {
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user: userProfile,
            session,
            error: null,
          });
          
          // Redirect based on user type
          if (session.userType === 'driver') {
            router.replace('/driver');
          } else {
            router.replace(PassengerRoutes.HOME);
          }
          return;
        }
      }
      
      // No valid session found, prepare for fresh authentication
      console.log('🆕 No valid session found, preparing for fresh authentication...');
      await forceFreshAuth();
      
    } catch (error) {
      console.error('❌ Error checking session:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Session check failed',
      }));
      await forceFreshAuth();
    }
  }, [router]);

  /**
   * Force fresh authentication by clearing all cached states
   */
  const forceFreshAuth = useCallback(async (): Promise<void> => {
    try {
      console.log('🔄 Forcing fresh authentication...');
      
      // Clear all authentication data
      await sessionManager.clearAllAuthData();
      
      // Reset auth service state
      authService.clearCurrentRequest();
      authService.resetToBackendMode();
      authService.resetDiscovery();
      
      // Clear logout flag
      await sessionManager.clearLogoutFlag();
      
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        session: null,
        error: null,
      });
      
      console.log('🎉 Fresh authentication state ready');
    } catch (error) {
      console.error('❌ Error forcing fresh authentication:', error);
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to prepare fresh authentication',
      }));
    }
  }, []);

  /**
   * Perform authentication login
   */
  const login = useCallback(async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      console.log('🚀 Starting authentication...');
      
      // Start Auth0 authentication flow
      const { result, codeVerifier } = await authService.authenticate();
      
      if (result.type === 'success' && result.params.code) {
        console.log('✅ Authentication successful, exchanging code for tokens...');
        
        // Exchange authorization code for tokens
        const tokenResponse: Auth0TokenResponse = await authService.exchangeCodeForTokens(
          result.params.code,
          codeVerifier
        );
        
        if (tokenResponse.status === 'success' && tokenResponse.data) {
          console.log('✅ Token exchange successful, getting user profile...');
          
          // Get user profile
          const userProfile = await authService.getUserProfile(tokenResponse.data.access_token);
          
          // Sync user with database
          const syncResult = await syncUser(userProfile);
          
          // Store session data
          const sessionData: SessionData = {
            accessToken: tokenResponse.data.access_token,
            idToken: tokenResponse.data.id_token,
            refreshToken: undefined, // Auth0 code flow doesn't always return refresh_token
            userProfile,
            expiresAt: Date.now() + (tokenResponse.data.expires_in * 1000),
          };
          
          await sessionManager.storeUserSession(sessionData, 'passenger');
          
          // Create user session
          const session: UserSession = {
            userId: userProfile.sub,
            username: userProfile.nickname || userProfile.name,
            email: userProfile.email,
            userType: 'passenger',
            loginTime: new Date().toISOString(),
            profileCompleted: syncResult.data?.profile_completed || false,
            auth0Id: userProfile.sub,
          };
          
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user: userProfile,
            session,
            error: null,
          });
          
          console.log('🎉 Authentication completed successfully');
          
          // Navigate to appropriate screen
          if (syncResult.data?.profile_completed) {
            router.replace(PassengerRoutes.HOME);
          } else {
            router.replace('/auth/complete-profile');
          }
        } else {
          throw new Error(tokenResponse.message || 'Token exchange failed');
        }
      } else {
        throw new Error('Authentication was cancelled or failed');
      }
    } catch (error) {
      console.error('❌ Authentication error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      }));
    }
  }, [router]);

  /**
   * Perform logout
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      console.log('🔄 Starting logout...');
      
      // Clear all authentication data
      await sessionManager.clearAllAuthData();
      
      // Set logout flag
      await sessionManager.setLogoutFlag();
      
      // Reset auth service state
      authService.clearCurrentRequest();
      authService.resetToBackendMode();
      authService.resetDiscovery();
      
      // Reset state
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        session: null,
        error: null,
      });
      
      console.log('🎉 Logout completed successfully');
      
      // Navigate to auth screen
      router.replace('/auth');
    } catch (error) {
      console.error('❌ Logout error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      }));
    }
  }, [router]);

  /**
   * Sync user with database
   */
  const syncUser = useCallback(async (userProfile: Auth0User): Promise<any> => {
    try {
      return await sessionManager.syncUserWithDatabase(userProfile);
    } catch (error) {
      console.error('❌ Error syncing user:', error);
      throw error;
    }
  }, []);

  /**
   * Complete user profile
   */
  const completeProfile = useCallback(async (
    auth0Id: string, 
    userId: string, 
    profileData: any
  ): Promise<any> => {
    try {
      return await sessionManager.completeProfile(auth0Id, userId, profileData);
    } catch (error) {
      console.error('❌ Error completing profile:', error);
      throw error;
    }
  }, []);

  return {
    ...authState,
    login,
    logout,
    checkSession,
    forceFreshAuth,
    syncUser,
    completeProfile,
  };
};
