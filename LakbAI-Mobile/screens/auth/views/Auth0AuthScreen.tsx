import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  SafeAreaView,
  Text,
  View,
  ActivityIndicator
} from 'react-native';
import Auth0LoginScreen from './Auth0LoginScreen';
import SignUpScreen from './RegisterScreen';
import styles from '../styles/AuthScreen.styles';
import { useRouter } from 'expo-router';
import { PassengerRoutes } from '../../../routes/PassengerRoutes';
import { DriverRoutes } from '../../../routes/DriverRoutes';
import { storeUserSession } from '../../../shared/utils/authUtils';
import { auth0Service } from '../../../shared/services/auth0Service';

interface Auth0AuthScreenProps {
  onLogin?: (userData: any) => void;
  onGuestContinue?: () => void;
}

const Auth0AuthScreen: React.FC<Auth0AuthScreenProps> = ({ 
  onLogin, 
  onGuestContinue 
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [isInitializing, setIsInitializing] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuthenticationStatus();
  }, []);

  const checkAuthenticationStatus = async () => {
    try {
      setIsCheckingAuth(true);
      
      // Initialize Auth0 service
      await auth0Service.initialize();
      
      // Check if user is already authenticated
      const isAuthenticated = await auth0Service.isAuthenticated();
      
      if (isAuthenticated) {
        console.log('User already authenticated, checking user data...');
        const user = await auth0Service.getCurrentUser();
        
        if (user) {
          console.log('Found authenticated user:', user);
          await handleSuccessfulAuth(user);
          return;
        }
      }
      
      console.log('User not authenticated, showing login screen');
    } catch (error) {
      console.error('Auth check error:', error);
      Alert.alert(
        'Authentication Error',
        'Failed to initialize authentication. Please restart the app.'
      );
    } finally {
      setIsInitializing(false);
      setIsCheckingAuth(false);
    }
  };

  const handleAuth0Login = async (userData: any) => {
    try {
      console.log('Auth0 login successful:', userData);
      await handleSuccessfulAuth(userData);
      
      // Call optional callback
      if (onLogin) {
        onLogin(userData);
      }
    } catch (error) {
      console.error('Auth0 login handler error:', error);
      Alert.alert('Error', 'Failed to complete authentication');
    }
  };

  const handleSuccessfulAuth = async (userData: any) => {
    try {
      // Get user roles to determine navigation
      const { roles, isPassenger } = await auth0Service.getUserRoles();
      console.log('User roles:', roles);
      
      // Determine user type - default to passenger for mobile app
      const userType = roles.includes('driver') ? 'driver' : 'passenger';
      const username = userData.nickname || userData.email || userData.name || 'user';
      
      // Store user session
      await storeUserSession(userType, username, true);
      
      // Navigate based on user type
      if (userType === 'driver') {
        console.log('Navigating to driver home...');
        router.replace(DriverRoutes.HOME);
      } else {
        console.log('Navigating to passenger home...');
        router.replace(PassengerRoutes.HOME);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Default to passenger route if there's an error
      router.replace(PassengerRoutes.HOME);
    }
  };

  const handleGuestContinue = async () => {
    try {
      // Store guest session
      await storeUserSession('guest', 'guest', false);
      
      // Navigate to passenger home as guest
      router.replace(PassengerRoutes.HOME);
      
      // Call the optional prop if provided
      if (onGuestContinue) {
        onGuestContinue();
      }
    } catch (error) {
      console.error('Guest continue error:', error);
      Alert.alert('Error', 'Failed to continue as guest');
    }
  };

  const handleSignUpRedirect = () => {
    Alert.alert(
      'Create Account',
      'Account creation is handled through our secure authentication provider. Please use the "Sign In with Auth0" option and select "Sign up" when prompted.',
      [
        {
          text: 'Got it',
          onPress: () => setActiveTab('login')
        }
      ]
    );
  };

  // Show loading screen while initializing
  if (isInitializing || isCheckingAuth) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ 
            marginTop: 16, 
            fontSize: 16, 
            color: '#6C757D',
            fontWeight: '500' 
          }}>
            {isInitializing ? 'Initializing...' : 'Checking authentication...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.content}>
        {activeTab === 'login' ? (
          <Auth0LoginScreen 
            onLogin={handleAuth0Login} 
            onSignup={handleAuth0Login}
            onGuestContinue={handleGuestContinue} 
          />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <Text style={{ 
              fontSize: 24, 
              fontWeight: '700', 
              color: '#1A1A1A', 
              textAlign: 'center',
              marginBottom: 16 
            }}>
              Account Creation
            </Text>
            <Text style={{ 
              fontSize: 16, 
              color: '#6C757D', 
              textAlign: 'center', 
              lineHeight: 24,
              marginBottom: 32 
            }}>
              New accounts are created through our secure authentication provider. 
              Please use the login screen and select "Sign up" when prompted.
            </Text>
            <Text 
              style={{ 
                fontSize: 16, 
                color: '#007AFF', 
                fontWeight: '600' 
              }}
              onPress={() => setActiveTab('login')}
            >
              Go to Login
            </Text>
          </View>
        )}
      </View>

      {/* Toggle footer - only show for login tab */}
      {activeTab === 'login' && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Need to create an account?{' '}
            <Text style={styles.footerLink} onPress={handleSignUpRedirect}>
              Learn how
            </Text>
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default Auth0AuthScreen;
