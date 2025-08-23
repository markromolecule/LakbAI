import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  SafeAreaView,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginData, SignUpData } from '../../../shared/types/authentication';
import Auth0LoginScreen from './Auth0LoginScreen';
import LoginScreen from './LoginScreen';
import SignUpScreen from './RegisterScreen';
import styles from '../styles/HybridAuthScreen.styles';
import { useRouter } from 'expo-router';
import { PassengerRoutes } from '../../../routes/PassengerRoutes';
import { DriverRoutes } from '../../../routes/DriverRoutes';
import { storeUserSession } from '../../../shared/utils/authUtils';
import { auth0Service } from '../../../shared/services/auth0Service';
import { authService } from '../../../shared/services/authService';

type AuthMethod = 'choice' | 'auth0' | 'regular';
type AuthMode = 'login' | 'signup';

interface HybridAuthScreenProps {
  onLogin?: (userData: any) => void;
  onGuestContinue?: () => void;
}

const HybridAuthScreen: React.FC<HybridAuthScreenProps> = ({ 
  onLogin, 
  onGuestContinue 
}) => {
  const [authMethod, setAuthMethod] = useState<AuthMethod>('choice');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isInitializing, setIsInitializing] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      setIsInitializing(true);
      
      // Check if user just logged out
      const userLoggedOut = await AsyncStorage.getItem('user_logged_out');
      
      if (userLoggedOut === 'true') {
        // Clear the logout flag and don't auto-login
        await AsyncStorage.removeItem('user_logged_out');
        console.log('User manually logged out, staying on auth screen');
        return;
      }
      
      // Check Auth0 authentication
      await auth0Service.initialize();
      const isAuth0Authenticated = await auth0Service.isAuthenticated();
      
      if (isAuth0Authenticated) {
        const user = await auth0Service.getCurrentUser();
        if (user) {
          console.log('Found Auth0 user:', user);
          await handleSuccessfulAuth(user, 'auth0');
          return;
        }
      }
      
      // Could also check regular auth here if you store tokens locally
      console.log('No existing authentication found');
      
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSuccessfulAuth = async (userData: any, method: 'auth0' | 'regular') => {
    try {
      let userType = 'passenger';
      let username = userData.email || userData.username || 'user';
      
      if (method === 'auth0') {
        const { roles } = await auth0Service.getUserRoles();
        userType = roles.includes('driver') ? 'driver' : 'passenger';
        username = userData.nickname || userData.email || userData.name || 'user';
        
        // Check if profile is complete
        const userMetadata = userData?.user_metadata || {};
        const hasLocalProfile = userMetadata.registration_complete || 
          (userMetadata.phone_number && userMetadata.address && userMetadata.first_name && userMetadata.last_name);
        
        if (!hasLocalProfile) {
          // Check if user exists in database with complete profile
          try {
            const { userSyncService } = await import('../../../shared/services/userSyncService');
            const accessToken = await auth0Service.getAccessToken();
            
            if (accessToken) {
              // Try to sync current user - if successful, user has complete profile in database
              const syncResult = await userSyncService.syncCurrentUser();
              if (syncResult.success) {
                console.log('User profile found in database, proceeding to home screen');
                // User exists in database, proceed to home screen
              } else {
                console.log('User profile incomplete, showing profile completion screen');
                router.replace('/auth/profile-completion');
                return;
              }
            } else {
              console.log('No access token, showing profile completion screen');
              router.replace('/auth/profile-completion');
              return;
            }
          } catch (error) {
            console.error('Error checking user profile:', error);
            // If we can't check, show profile completion to be safe
            router.replace('/auth/profile-completion');
            return;
          }
        }
      } else {
        // Regular login - determine user type from response
        userType = userData.user_type || 'passenger';
        username = userData.username || userData.email;
      }
      
      // Store user session
      await storeUserSession(userType, username, true);
      
      // Clear any logout flag since user is now logged in
      await AsyncStorage.removeItem('user_logged_out');
      
      // Navigate based on user type
      if (userType === 'driver') {
        router.replace(DriverRoutes.HOME);
      } else {
        router.replace(PassengerRoutes.HOME);
      }
      
      // Call optional callback
      if (onLogin) {
        onLogin(userData);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Default to passenger route if there's an error
      router.replace(PassengerRoutes.HOME);
    }
  };

  const handleAuth0Login = async (userData: any) => {
    await handleSuccessfulAuth(userData, 'auth0');
  };

  const handleRegularLogin = async (data: LoginData) => {
    try {
      console.log('Attempting regular login:', data);
      const response = await authService.login(data);
      
      if (response.status === 'success' && response.user) {
        await handleSuccessfulAuth(response.user, 'regular');
      } else {
        Alert.alert('Login Failed', response.message || 'Please check your credentials and try again');
      }
    } catch (error) {
      console.error('Regular login error:', error);
      Alert.alert('Error', 'Network error occurred. Please check your connection and try again.');
    }
  };

  const handleRegularSignUp = async (data: SignUpData) => {
    try {
      console.log('Attempting regular registration:', data);
      
      // Your existing registration logic
      Alert.alert('Success', 'Account created successfully! Please log in.', [
        { 
          text: 'OK', 
          onPress: () => {
            setAuthMode('login');
          }
        }
      ]);
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'Registration failed. Please try again.');
    }
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Password reset instructions would be sent to your email.');
  };

  const handleGuestContinue = async () => {
    try {
      await storeUserSession('guest', 'guest', false);
      router.replace(PassengerRoutes.HOME);
      
      if (onGuestContinue) {
        onGuestContinue();
      }
    } catch (error) {
      console.error('Guest continue error:', error);
      Alert.alert('Error', 'Failed to continue as guest');
    }
  };

  // Show loading screen while initializing
  if (isInitializing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Checking authentication...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Authentication method choice screen
  if (authMethod === 'choice') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../../assets/images/logofinal.png')}
                style={styles.logoImage}
                resizeMode="contain"
                accessibilityLabel="LakbAI logo"
              />
            </View>
            <Text style={styles.title}>Choose Sign In Method</Text>
            <Text style={styles.subtitle}>Select how you'd like to access your account</Text>
          </View>

          {/* Auth Method Options */}
          <View style={styles.methodContainer}>
            {/* Auth0 Option */}
            <TouchableOpacity 
              style={styles.methodButton}
              onPress={() => setAuthMethod('auth0')}
              activeOpacity={0.8}
            >
              <View style={styles.methodIcon}>
                <Text style={styles.methodIconText}>🔐</Text>
              </View>
              <View style={styles.methodContent}>
                <Text style={styles.methodTitle}>Quick Sign In</Text>
                <Text style={styles.methodDescription}>
                  Use Google, Facebook, or secure Auth0 login
                </Text>
                <View style={styles.methodFeatures}>
                  <Text style={styles.featureText}>• One-click social login</Text>
                  <Text style={styles.featureText}>• Enhanced security</Text>
                  <Text style={styles.featureText}>• Faster sign up</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Regular Option */}
            <TouchableOpacity 
              style={styles.methodButton}
              onPress={() => setAuthMethod('regular')}
              activeOpacity={0.8}
            >
              <View style={styles.methodIcon}>
                <Text style={styles.methodIconText}>📧</Text>
              </View>
              <View style={styles.methodContent}>
                <Text style={styles.methodTitle}>Traditional Sign In</Text>
                <Text style={styles.methodDescription}>
                  Use email and password with full registration
                </Text>
                <View style={styles.methodFeatures}>
                  <Text style={styles.featureText}>• Complete profile setup</Text>
                  <Text style={styles.featureText}>• Detailed preferences</Text>
                  <Text style={styles.featureText}>• Full customization</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Guest Option */}
          <TouchableOpacity 
            style={styles.guestButton} 
            onPress={handleGuestContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
            <Text style={styles.guestButtonSubtext}>Limited features available</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Auth0 Flow
  if (authMethod === 'auth0') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setAuthMethod('choice')}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <Auth0LoginScreen 
            onLogin={handleAuth0Login} 
            onGuestContinue={handleGuestContinue} 
          />
        </View>
      </SafeAreaView>
    );
  }

  // Regular Login/Register Flow
  if (authMethod === 'regular') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setAuthMethod('choice')}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          {authMode === 'login' ? (
            <LoginScreen 
              onLogin={handleRegularLogin} 
              onForgotPassword={handleForgotPassword} 
              onGuestContinue={handleGuestContinue} 
            />
          ) : (
            <SignUpScreen onSignUp={handleRegularSignUp} />
          )}
        </View>

        {/* Toggle Footer */}
        <View style={styles.footer}>
          {authMode === 'login' ? (
            <Text style={styles.footerText}>
              Don't have an account?{' '}
              <Text style={styles.footerLink} onPress={() => setAuthMode('signup')}>
                Sign up
              </Text>
            </Text>
          ) : (
            <Text style={styles.footerText}>
              Already have an account?{' '}
              <Text style={styles.footerLink} onPress={() => setAuthMode('login')}>
                Log in
              </Text>
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return null;
};

export default HybridAuthScreen;
