import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

/**
 * Authentication utilities for managing user sessions
 */

// Session storage keys
const SESSION_KEYS = {
  USER_TYPE: '@user_type',
  USERNAME: '@username',
  REMEMBER_ME: '@remember_me',
  LOGIN_TIME: '@login_time',
  LOGOUT_FLAG: '@logout_flag', // Add logout flag
};

export type UserType = 'passenger' | 'driver' | 'guest' | null;

/**
 * Store user session data securely
 */
export const storeUserSession = async (
  userType: UserType,
  username: string,
  rememberMe: boolean = false
): Promise<void> => {
  try {
    const loginTime = new Date().toISOString();
    
    await AsyncStorage.multiSet([
      [SESSION_KEYS.USER_TYPE, userType || ''],
      [SESSION_KEYS.USERNAME, username],
      [SESSION_KEYS.REMEMBER_ME, rememberMe.toString()],
      [SESSION_KEYS.LOGIN_TIME, loginTime],
      [SESSION_KEYS.LOGOUT_FLAG, 'false'], // Clear logout flag when storing new session
    ]);
  } catch (error) {
    console.error('Error storing user session:', error);
  }
};

/**
 * Get current user session data
 */
export const getUserSession = async (): Promise<{
  userType: UserType;
  username: string | null;
  rememberMe: boolean;
  loginTime: string | null;
}> => {
  try {
    const values = await AsyncStorage.multiGet([
      SESSION_KEYS.USER_TYPE,
      SESSION_KEYS.USERNAME,
      SESSION_KEYS.REMEMBER_ME,
      SESSION_KEYS.LOGIN_TIME,
    ]);

    const userType = (values[0][1] as UserType) || null;
    const username = values[1][1] || null;
    const rememberMe = values[2][1] === 'true';
    const loginTime = values[3][1] || null;

    return { userType, username, rememberMe, loginTime };
  } catch (error) {
    console.error('Error getting user session:', error);
    return { userType: null, username: null, rememberMe: false, loginTime: null };
  }
};

/**
 * Clear user session data securely
 */
export const clearUserSession = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      SESSION_KEYS.USER_TYPE,
      SESSION_KEYS.USERNAME,
      SESSION_KEYS.REMEMBER_ME,
      SESSION_KEYS.LOGIN_TIME,
      SESSION_KEYS.LOGOUT_FLAG, // Also clear logout flag
    ]);
  } catch (error) {
    console.error('Error clearing user session:', error);
  }
};

/**
 * Logout functionality with confirmation and secure session clearing
 */
export const useLogout = () => {
  const router = useRouter();

  const logout = (showConfirmation: boolean = true) => {
    const performLogout = async () => {
      try {
        console.log('🔄 Starting comprehensive logout...');
        
        // Clear all session data
        await clearUserSession();
        console.log('✅ User session cleared');
        
        // Set logout flag to prevent automatic session restoration
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage');
          await AsyncStorage.setItem(SESSION_KEYS.LOGOUT_FLAG, 'true');
          console.log('✅ Logout flag set');
        } catch (flagError) {
          console.log('⚠️ Could not set logout flag:', flagError);
        }
        
        // Clear Auth0 service state to allow fresh authentication
        try {
          const auth0Service = require('../services/auth0Service').default;
          
          // Force fresh authentication
          await auth0Service.forceFreshAuthentication();
          console.log('✅ Auth0 fresh authentication forced');
          
          // Force Google account selection
          await auth0Service.forceGoogleAccountSelection();
          console.log('✅ Google account selection forced');
          
          // Clear any stored tokens or cached data
          await auth0Service.clearExpoAuthSessionData();
          console.log('✅ Expo auth session data cleared');
          
        } catch (auth0Error) {
          console.log('⚠️ Could not clear some Auth0 service state:', auth0Error);
        }
        
        // Clear any AsyncStorage tokens that might still exist
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage');
          
          const keysToRemove = [
            'auth0_access_token',
            'auth0_id_token',
            'auth0_refresh_token',
            'auth0_user_profile',
            'user_session',
            'auth_state',
            'expo_auth_session_*'
          ];
          
          for (const key of keysToRemove) {
            if (key.includes('*')) {
              // Handle wildcard keys
              const allKeys = await AsyncStorage.getAllKeys();
              const matchingKeys = allKeys.filter((k: string) => k.startsWith('expo_auth_session_'));
              await AsyncStorage.multiRemove(matchingKeys);
            } else {
              await AsyncStorage.removeItem(key);
            }
          }
          
          console.log('✅ AsyncStorage tokens cleared');
        } catch (storageError) {
          console.log('⚠️ Could not clear AsyncStorage tokens:', storageError);
        }
        
        console.log('🎉 Comprehensive logout completed');
        
        // Navigate to authentication screen and prevent going back
        router.replace('/');
        
        // Optional success feedback
        // Alert.alert('Success', 'You have been logged out successfully');
      } catch (error) {
        console.error('❌ Logout error:', error);
        Alert.alert('Error', 'Failed to logout. Please try again.');
      }
    };

    if (showConfirmation) {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: performLogout,
          },
        ],
        { cancelable: true }
      );
    } else {
      performLogout();
    }
  };

  return { logout };
};

/**
 * Check if user is authenticated
 */
export const isUserAuthenticated = async (): Promise<boolean> => {
  const session = await getUserSession();
  return session.userType !== null && session.username !== null;
};

/**
 * Check if current session is a guest session
 */
export const isGuestSession = async (): Promise<boolean> => {
  const session = await getUserSession();
  return session.userType === 'guest' || session.username === 'guest';
};

/**
 * Check if current session is the test driver user
 */
export const isTestDriverSession = async (): Promise<boolean> => {
  const session = await getUserSession();
  return session.userType === 'driver' && session.username === 'livado';
};

/**
 * Get test user credentials for debugging
 */
export const getTestUserCredentials = () => {
  return {
    username: 'livado',
    password: 'livado123',
    userType: 'driver' as const
  };
};

