import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  Text,
  View,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { LoginData, SignUpData } from '../../../shared/types/authentication';
import LoginScreen from './LoginScreen';
import SignUpScreen from './RegisterScreen';
import HybridAuthScreen from './HybridAuthScreen';
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
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'hybrid'>('login');
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

  const handleSignUp = async (data: SignUpData) => {
    try {
      console.log('=== AUTHSCREEN HANDLESIGNUP START ===');
      console.log('AuthScreen handleSignUp called with data:', data);
      console.log('Registration successful, updating UI...');
      
      // Show success message and redirect to login
      console.log('About to show success alert...');
      Alert.alert('Success', 'Account created successfully! Please log in.', [
        { 
          text: 'OK', 
          onPress: () => {
            // Switch to login tab
            console.log('About to call setActiveTab("login")...');
            setActiveTab('login');
            console.log('setActiveTab("login") called successfully');
          }
        }
      ]);
      
      // Call the optional prop if provided (for any additional logic)
      if (onSignUp) {
        console.log('Calling optional onSignUp prop...');
        onSignUp(data);
        console.log('Optional onSignUp prop called successfully');
      }
      
      console.log('=== AUTHSCREEN HANDLESIGNUP COMPLETE ===');
    } catch (error) {
      console.error('UI update error:', error);
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
        ) : activeTab === 'signup' ? (
          <SignUpScreen onSignUp={handleSignUp} />
        ) : (
          <HybridAuthScreen onBackToTraditional={() => setActiveTab('login')} />
        )}
      </View>

      {/* Toggle footer */}
      <View style={styles.footer}>
        {activeTab === 'login' ? (
          <>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
              <Text style={styles.footerLink} onPress={() => setActiveTab('signup')}>
                Sign up
              </Text>
            </Text>
            <TouchableOpacity 
              style={quickSignInStyles.quickSignInButton}
              onPress={() => setActiveTab('hybrid')}
            >
              <Text style={quickSignInStyles.quickSignInText}>Quick Sign-In</Text>
            </TouchableOpacity>
          </>
        ) : activeTab === 'signup' ? (
          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Text style={styles.footerLink} onPress={() => setActiveTab('login')}>
              Log in
            </Text>
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const quickSignInStyles = StyleSheet.create({
  quickSignInButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quickSignInText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AuthScreen;