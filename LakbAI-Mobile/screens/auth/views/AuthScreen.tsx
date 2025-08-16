import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  Text,
  View
} from 'react-native';
import { LoginData, SignUpData } from '../../../shared/types/authentication';
import LoginScreen from './LoginScreen';
import SignUpScreen from './RegisterScreen';
import styles from '../styles/AuthScreen.styles';
import { useRouter } from 'expo-router';
import { PassengerRoutes } from '../../../routes/PassengerRoutes';
import { DriverRoutes } from '../../../routes/DriverRoutes';
import { storeUserSession } from '../../../shared/utils/authUtils';
import { authService } from '../../../shared/services/authService';

interface AuthScreenProps {
  onLogin?: (data: LoginData) => void;
  onSignUp?: (data: SignUpData) => void;
  onGuestContinue?: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onSignUp, onGuestContinue }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const router = useRouter();

  const handleLogin = async (data: LoginData) => {
    try {
      console.log('Attempting to login user:', data);
      const response = await authService.login(data);
      
      if (response.status === 'success' && response.user) {
        const user = response.user;
        const userType = user.user_type || 'passenger'; // Default to passenger if not specified
        
        // Store user session with actual user data
        await storeUserSession(userType, user.username, true);
        
        // Navigate based on user type
        if (userType === 'driver') {
          router.replace(DriverRoutes.HOME);
        } else {
          router.replace(PassengerRoutes.HOME);
        }
      } else {
        Alert.alert('Login Failed', response.message || 'Please check your credentials and try again');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Network error occurred. Please check your connection and try again.');
    }
  };

  const handleSignUp = (data: SignUpData) => {
    // For now just show an alert — extend as needed.
    Alert.alert('Sign up', `Created account for ${data.firstName} ${data.lastName}`);
    
    // Call the optional prop if provided
    if (onSignUp) {
      onSignUp(data);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Password reset instructions would be sent to your email.');
  };

  const handleGuestContinue = async () => {
    // Store guest session
    await storeUserSession('guest', 'guest', false);
    // Navigate to passenger home as guest
    router.replace(PassengerRoutes.HOME);
    
    // Call the optional prop if provided
    if (onGuestContinue) {
      onGuestContinue();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.content}>
        {activeTab === 'login' ? (
          <LoginScreen onLogin={handleLogin} onForgotPassword={handleForgotPassword} onGuestContinue={handleGuestContinue} />
        ) : (
          <SignUpScreen onSignUp={handleSignUp} />
        )}
      </View>

      {/* Toggle footer */}
      <View style={styles.footer}>
        {activeTab === 'login' ? (
          <Text style={styles.footerText}>
            Don't have an account?{' '}
            <Text style={styles.footerLink} onPress={() => setActiveTab('signup')}>
              Sign up
            </Text>
          </Text>
        ) : (
          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Text style={styles.footerLink} onPress={() => setActiveTab('login')}>
              Log in
            </Text>
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

export default AuthScreen;