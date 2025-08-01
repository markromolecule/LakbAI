import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { LoginData, SignUpData } from '../../shared/types/auth';
import LoginScreen from './LoginScreen';
import SignUpScreen from './SignUpScreen';

interface AuthScreenProps {
  onLogin: (data: LoginData) => void;
  onSignUp: (data: SignUpData) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onSignUp }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  const handleLogin = (data: LoginData) => {
    Alert.alert('Success', `Welcome back, ${data.username}!`);
    onLogin(data);
  };

  const handleSignUp = (data: SignUpData) => {
    Alert.alert('Success', `Account created for ${data.firstName} ${data.lastName}!`);
    onSignUp(data);
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
  },
  footerLink: {
    color: '#3B82F6',
    fontWeight: '600',
  },
});

export default AuthScreen;