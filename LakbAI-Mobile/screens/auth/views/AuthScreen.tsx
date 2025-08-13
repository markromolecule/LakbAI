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

interface AuthScreenProps {
  onLogin?: (data: LoginData) => void;
  onSignUp?: (data: SignUpData) => void;
  onGuestContinue?: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onSignUp, onGuestContinue }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const router = useRouter();

  const handleLogin = async (data: LoginData) => {
    const { username, password } = data;
    
    // Allow john / john123 for passenger login
    if (username === 'john' && password === 'john123') {
      // Store passenger session
      await storeUserSession('passenger', username, true);
      // navigate to passenger home (replace so back button won't return to auth)
      router.replace(PassengerRoutes.HOME);
      return;
    }
    
    // Allow livado / livado123 for driver login
    if (username === 'livado' && password === 'livado123') {
      // Store driver session
      await storeUserSession('driver', username, true);
      // navigate to driver dashboard (replace so back button won't return to auth)
      router.replace(DriverRoutes.HOME);
      return;
    }
    
    // here you can call your real auth API
    Alert.alert(
      'Invalid credentials', 
      'Try:\n• username: john / password: john123 (Passenger)\n• username: livado / password: livado123 (Driver)'
    );
    
    // Call the optional prop if provided
    if (onLogin) {
      onLogin(data);
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