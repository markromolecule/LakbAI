import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import auth0Service from '../../../shared/services/auth0Service';
import { PassengerRoutes } from '../../../routes';
import { storeUserSession, clearUserSession, getUserSession } from '../../../shared/utils/authUtils';
import styles from '../styles/HybridAuthScreen.styles';

// Declare global types for caches
declare global {
  var auth0Cache: any;
  var userCache: any;
}

interface HybridAuthScreenProps {
  onBackToTraditional?: () => void;
}

const HybridAuthScreen: React.FC<HybridAuthScreenProps> = ({ onBackToTraditional }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [sessionStatus, setSessionStatus] = useState<'checking' | 'ready' | 'expired'>('checking');
  const router = useRouter();

  // Check for existing session when component mounts
  useEffect(() => {
    checkExistingSession();
  }, []);

  /**
   * Check for existing valid session and redirect if found
   */
  const checkExistingSession = async () => {
    try {
      console.log('Checking for existing session...');
      
      // Check if user has explicitly logged out
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage');
        const logoutFlag = await AsyncStorage.getItem('@logout_flag');
        
        if (logoutFlag === 'true') {
          console.log('Logout flag detected, skipping session check and preparing for fresh authentication...');
          setSessionStatus('ready');
          await prepareForFreshAuthentication();
          return;
        }
      } catch (flagError) {
        console.log('Could not check logout flag:', flagError);
      }
      
      const session = await getUserSession();
      
      if (session.userType && session.username) {
        console.log('Existing session found:', session);
        
        // Check if session is still valid (not expired)
        const loginTime = new Date(session.loginTime || '');
        const now = new Date();
        const sessionAge = now.getTime() - loginTime.getTime();
        const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (sessionAge < maxSessionAge) {
          console.log('Valid session found, redirecting to appropriate screen...');
          setSessionStatus('ready');
          
          // Redirect based on user type
          if (session.userType === 'driver') {
            router.replace('/driver');
          } else {
            router.replace(PassengerRoutes.HOME);
          }
          return;
        } else {
          console.log('Session expired, clearing...');
          setSessionStatus('expired');
          await clearUserSession();
        }
      }
      
      // No valid session found or session was expired, prepare for fresh authentication
      console.log('No valid session found, preparing for fresh authentication...');
      setSessionStatus('ready');
      await prepareForFreshAuthentication();
      
    } catch (error) {
      console.error('Error checking session:', error);
      // Continue with fresh authentication
      await prepareForFreshAuthentication();
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Prepare for fresh authentication by clearing old data
   */
  const prepareForFreshAuthentication = async () => {
    try {
      console.log('Preparing for fresh authentication...');
      
      // Force fresh authentication by clearing all Auth0 service state and sessions
      await auth0Service.forceFreshAuthentication();
      console.log('Auth0 fresh authentication state ready');
      
      // Force Google to show account selection
      await auth0Service.forceGoogleAccountSelection();
      console.log('Google account selection forced');
      
      // Clear any stored tokens or cookies
      await clearStoredTokens();
      console.log('Stored tokens cleared');
      
      // Clear any cached user data
      await clearCachedUserData();
      console.log('Cached user data cleared');
      
      console.log('Ready for fresh authentication');
    } catch (error) {
      console.error('Error preparing for fresh authentication:', error);
      // Continue anyway - don't block authentication
    }
  };

  /**
   * Clear any stored authentication tokens
   */
  const clearStoredTokens = async () => {
    try {
      // Clear AsyncStorage tokens
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      
      const keysToRemove = [
        'auth0_access_token',
        'auth0_id_token',
        'auth0_refresh_token',
        'auth0_user_profile',
        'user_session',
        'auth_state'
      ];
      
      for (const key of keysToRemove) {
        await AsyncStorage.removeItem(key);
      }
      
      console.log('AsyncStorage tokens cleared');
    } catch (error) {
      console.log('Could not clear AsyncStorage tokens:', error);
    }
  };

  /**
   * Clear any cached user data
   */
  const clearCachedUserData = async () => {
    try {
      // Clear any in-memory caches safely
      // Note: Global caches will be cleared by the Auth0 service reset
      console.log('In-memory caches cleared via Auth0 service reset');
    } catch (error) {
      console.log('Could not clear in-memory caches:', error);
    }
  };

  /**
   * Force refresh session state (manual refresh)
   */
  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    await prepareForFreshAuthentication();
    setIsRefreshing(false);
  };

  const handleTraditionalAuth = () => {
    if (onBackToTraditional) {
      onBackToTraditional();
    }
  };

  const handleAuth0SignIn = async () => {
    // Ensure session is refreshed before authentication
    if (isRefreshing) {
      console.log('⏳ Waiting for session refresh to complete...');
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('Starting fresh Auth0 authentication...');
      console.log('Session state: Clean slate ready');
      
      // Start Auth0 authentication flow
      const { result, codeVerifier } = await auth0Service.authenticate();
      
      if (result.type === 'success' && result.params.code) {
        console.log('Auth0 authentication successful, exchanging code for tokens...');
        
        // Exchange authorization code for tokens
        const tokens = await auth0Service.exchangeCodeForTokens(
          result.params.code,
          codeVerifier
        );
        
        console.log('Tokens received:', tokens);
        
        // Check if token exchange was successful
        if (tokens.status !== 'success' || !tokens.data || !tokens.data.access_token) {
          throw new Error('Token exchange failed: ' + (tokens.message || 'Unknown error'));
        }
        
        console.log('Getting user profile...');
        
        // Get user profile from Auth0
        const auth0User = await auth0Service.getUserProfile(tokens.data.access_token);
        
        console.log('Auth0 user profile received:', auth0User);
        
        // Sync user with local database
        const syncResult = await auth0Service.syncUserWithDatabase(auth0User);
        
        console.log('Sync result received:', syncResult);
        console.log('Sync result structure:', {
          hasUser: !!syncResult.user,
          hasData: !!syncResult.data,
          hasDataUser: !!syncResult.data?.user,
          userKeys: syncResult.user ? Object.keys(syncResult.user) : 'no user',
          dataKeys: syncResult.data ? Object.keys(syncResult.data) : 'no data',
          dataUserKeys: syncResult.data?.user ? Object.keys(syncResult.data.user) : 'no data.user'
        });
        
        if (syncResult.status === 'success') {
          // Extract user data from the correct location in the response
          let user = null;
          
          if (syncResult.user) {
            user = syncResult.user;
            console.log('Using syncResult.user');
          } else if (syncResult.data?.user) {
            user = syncResult.data.user;
            console.log('Using syncResult.data.user');
          } else if (syncResult.data && !syncResult.data.user && syncResult.data.profile_completed !== undefined) {
            user = syncResult.data;
            console.log('Using syncResult.data (fallback)');
          }
          
          if (!user) {
            console.error('No user data in sync result:', syncResult);
            throw new Error('No user data received from sync');
          }
          
          console.log('User data extracted:', user);
          console.log('Profile completed status:', user.profile_completed);
          console.log('Profile completed type:', typeof user.profile_completed);
          console.log('Profile completed value:', user.profile_completed);
          
          // Check if profile is complete (handle both boolean and numeric values)
          const isProfileCompleted = Boolean(user.profile_completed) || user.profile_completed === 1;
          
          if (isProfileCompleted) {
            console.log('Profile complete, storing session and redirecting...');
            
            // Store user session
            await storeUserSession(user.user_type || 'passenger', user.username || user.email, true);
            
            // Redirect to appropriate screen based on user type
            if (user.user_type === 'driver') {
              router.replace('/driver');
            } else {
              router.replace(PassengerRoutes.HOME);
            }
          } else {
            console.log('Profile incomplete, redirecting to profile completion...');
            
            // Redirect to profile completion screen
            router.push({
              pathname: '/auth/complete-profile',
              params: { 
                auth0Id: auth0User.sub,
                userId: user.id, // Include user ID as fallback
                email: auth0User.email,
                name: auth0User.name,
                profileCompleted: 'false'
              }
            });
          }
        } else {
          throw new Error('User sync failed: ' + (syncResult.message || 'Unknown error'));
        }
      } else if (result.type === 'cancel') {
        console.log('Authentication cancelled by user');
        Alert.alert('Authentication Cancelled', 'You cancelled the authentication process.');
      } else {
        throw new Error('Authentication failed: ' + (result.type || 'Unknown error'));
      }
    } catch (error) {
      console.error('Auth0 authentication error:', error);
      Alert.alert(
        'Authentication Error',
        error instanceof Error ? error.message : 'An unexpected error occurred during authentication. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isRefreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Checking session...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleForceRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={20} color="#007AFF" />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
          
          <View style={styles.sessionStatus}>
            <View style={[
              styles.statusIndicator, 
              { 
                backgroundColor: sessionStatus === 'ready' ? '#34C759' : 
                               sessionStatus === 'expired' ? '#FF9500' : '#007AFF' 
              }
            ]} />
            <Text style={styles.statusText}>
              {sessionStatus === 'ready' ? 'Ready for Auth' : 
               sessionStatus === 'expired' ? 'Session Expired' : 'Checking Session'}
            </Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>LakbAI</Text>
            <Text style={styles.tagline}>Your Smart Transportation Companion</Text>
          </View>

          <View style={styles.authOptionsContainer}>
            <Text style={styles.sectionTitle}>Choose Your Sign-In Method</Text>
            
            {/* Auth0 Option */}
            <TouchableOpacity
              style={[styles.authButton, styles.auth0Button]}
              onPress={handleAuth0SignIn}
              disabled={isLoading}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="shield-checkmark" size={24} color="#FFFFFF" />
                <Text style={styles.auth0ButtonText}>Continue using Auth0</Text>
              </View>
              <Text style={styles.auth0Subtext}>
                Secure authentication with Google, Facebook, Apple, or email
              </Text>
            </TouchableOpacity>

            {/* Traditional Auth Option */}
            <TouchableOpacity
              style={[styles.authButton, styles.traditionalButton]}
              onPress={handleTraditionalAuth}
              disabled={isLoading}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="mail" size={24} color="#007AFF" />
                <Text style={styles.traditionalButtonText}>Use Email & Password</Text>
              </View>
              <Text style={styles.traditionalSubtext}>
                Traditional registration and login
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info Section */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Why Auth0?</Text>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={16} color="#34C759" />
              <Text style={styles.infoText}>Multiple sign-in options (Google, Facebook, Apple)</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={16} color="#34C759" />
              <Text style={styles.infoText}>Enhanced security and privacy</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={16} color="#34C759" />
              <Text style={styles.infoText}>Faster and more convenient</Text>
            </View>
          </View>
        </View>

        {/* Loading Overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingOverlayText}>Authenticating...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default HybridAuthScreen;
