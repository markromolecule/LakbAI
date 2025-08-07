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
};

export type UserType = 'passenger' | 'driver' | null;

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
        // Clear all session data
        await clearUserSession();
        
        // Navigate to login screen and prevent going back
        router.replace('/');
        
        // Optional success feedback
        // Alert.alert('Success', 'You have been logged out successfully');
      } catch (error) {
        console.error('Logout error:', error);
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
