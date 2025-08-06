import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  View
} from 'react-native';
import { LoginData, SignUpData } from '../../../shared/types/authentication';
import LoginScreen from './LoginScreen';
import SignUpScreen from './SignUpScreen';
import styles from '../styles/AuthScreen.styles';
import { useRouter } from 'expo-router';

interface AuthScreenProps {
  onLogin?: (data: LoginData) => void;
  onSignUp?: (data: SignUpData) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onSignUp }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const router = useRouter();

  const handleLogin = (data: LoginData) => {
    const { username, password } = data;
    // Allow john / john for quick test
    if (username === 'john' && password === 'john123') {
      // navigate to passenger home (replace so back button won't return to auth)
      router.replace('/passenger/home');
      return;
    }
    // here you can call your real auth API
    Alert.alert('Invalid credentials', 'Try username: john / password: john for testing');
    
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === 'login' ? (
          <LoginScreen onLogin={handleLogin} onForgotPassword={handleForgotPassword} />
        ) : (
          <SignUpScreen onSignUp={handleSignUp} />
        )}
      </ScrollView>

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