import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import styles from '../styles/Auth0LoginScreen.styles';
import { auth0Service } from '../../../shared/services/auth0Service';

interface Auth0LoginScreenProps {
  onLogin: (userData: any) => void;
  onSignup?: (userData: any) => void;
  onGuestContinue?: () => void;
}

const Auth0LoginScreen: React.FC<Auth0LoginScreenProps> = ({ 
  onLogin, 
  onSignup,
  onGuestContinue 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentAction, setCurrentAction] = useState<string>('');

  useEffect(() => {
    initializeAuth0();
  }, []);

  const initializeAuth0 = async () => {
    try {
      setIsInitializing(true);
      await auth0Service.initialize();
      
      // Check if user is already authenticated
      const isAuthenticated = await auth0Service.isAuthenticated();
      if (isAuthenticated) {
        const user = await auth0Service.getCurrentUser();
        if (user) {
          console.log('User already authenticated:', user);
          onLogin(user);
          return;
        }
      }
    } catch (error) {
      console.error('Auth0 initialization error:', error);
      Alert.alert(
        'Initialization Error',
        'Failed to initialize authentication service. Please restart the app.'
      );
    } finally {
      setIsInitializing(false);
    }
  };

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setCurrentAction('Authenticating...');
      
      const result = await auth0Service.login();
      
      if (result.error) {
        Alert.alert('Login Failed', result.error);
        return;
      }
      
      if (result.user) {
        console.log('Login successful:', result.user);
        onLogin(result.user);
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        'Login Error',
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    } finally {
      setIsLoading(false);
      setCurrentAction('');
    }
  };


  const handleSignup = async () => {
    try {
      setIsLoading(true);
      setCurrentAction('Creating account...');
      
      const result = await auth0Service.signup();
      
      if (result.error) {
        Alert.alert('Signup Failed', result.error);
        return;
      }
      
      if (result.user) {
        console.log('Signup successful:', result.user);
        if (onSignup) {
          onSignup(result.user);
        } else {
          onLogin(result.user);
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert(
        'Signup Error',
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    } finally {
      setIsLoading(false);
      setCurrentAction('');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setCurrentAction('Connecting to Google...');
      
      const result = await auth0Service.loginWithGoogle();
      
      if (result.error) {
        Alert.alert('Google Login Failed', result.error);
        return;
      }
      
      if (result.user) {
        console.log('Google login successful:', result.user);
        Alert.alert(
          'Welcome!',
          `Hello ${result.user.name || result.user.email}!`,
          [{ text: 'Continue', onPress: () => onLogin(result.user) }]
        );
      }
    } catch (error) {
      console.error('Google login error:', error);
      Alert.alert(
        'Google Login Error',
        error instanceof Error ? error.message : 'Google login failed'
      );
    } finally {
      setIsLoading(false);
      setCurrentAction('');
    }
  };

  const handleFacebookLogin = async () => {
    try {
      setIsLoading(true);
      setCurrentAction('Connecting to Facebook...');
      
      const result = await auth0Service.loginWithFacebook();
      
      if (result.error) {
        Alert.alert('Facebook Login Failed', result.error);
        return;
      }
      
      if (result.user) {
        console.log('Facebook login successful:', result.user);
        Alert.alert(
          'Welcome!',
          `Hello ${result.user.name || result.user.email}!`,
          [{ text: 'Continue', onPress: () => onLogin(result.user) }]
        );
      }
    } catch (error) {
      console.error('Facebook login error:', error);
      Alert.alert(
        'Facebook Login Error',
        error instanceof Error ? error.message : 'Facebook login failed'
      );
    } finally {
      setIsLoading(false);
      setCurrentAction('');
    }
  };

  // Show initialization loading
  if (isInitializing) {
    return (
      <View style={styles.initContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.initText}>Initializing...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.innerContainer}>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Image
                  source={require('../../../assets/images/logofinal.png')}
                  style={styles.logoImage}
                  accessibilityLabel="LakbAI logo"
                />
              </View>
            </View>
            <Text style={styles.title}>Welcome to LakbAI</Text>
            <Text style={styles.subtitle}>Your Smart Transportation Companion</Text>
          </View>

          {/* Auth Section */}
          <View style={styles.authSection}>
            {/* Primary Auth Buttons */}
            <View style={styles.authButtons}>
              {/* Login Button */}
              <TouchableOpacity 
                style={[styles.primaryButton, styles.loginButton, isLoading && styles.buttonDisabled]} 
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading && currentAction.includes('Authenticating') ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.primaryButtonText}>Authenticating...</Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Sign In</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Signup Button */}
              <TouchableOpacity 
                style={[styles.primaryButton, styles.signupButton, isLoading && styles.buttonDisabled]} 
                onPress={handleSignup}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading && currentAction.includes('Creating') ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.primaryButtonText}>Creating Account...</Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Create Account</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login Buttons */}
            <View style={styles.socialButtons}>
              {/* Google Login */}
              <TouchableOpacity 
                style={[styles.socialButton, styles.googleButton, isLoading && styles.buttonDisabled]} 
                onPress={handleGoogleLogin}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading && currentAction.includes('Google') ? (
                  <ActivityIndicator color="#DB4437" size="small" />
                ) : (
                  <Text style={styles.googleIconText}>G</Text>
                )}
                <Text style={[styles.socialButtonText, styles.googleText]}>Google</Text>
              </TouchableOpacity>

              {/* Facebook Login */}
              <TouchableOpacity 
                style={[styles.socialButton, styles.facebookButton, isLoading && styles.buttonDisabled]} 
                onPress={handleFacebookLogin}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading && currentAction.includes('Facebook') ? (
                  <ActivityIndicator color="#4267B2" size="small" />
                ) : (
                  <Text style={styles.facebookIconText}>f</Text>
                )}
                <Text style={[styles.socialButtonText, styles.facebookText]}>Facebook</Text>
              </TouchableOpacity>
            </View>

            {/* Loading Status */}
            {isLoading && currentAction && (
              <View style={styles.statusContainer}>
                <Text style={styles.statusText}>{currentAction}</Text>
              </View>
            )}
          </View>

          {/* Security Info */}
          <View style={styles.securitySection}>
            <View style={styles.securityBadge}>
              <View style={styles.shieldIcon} />
              <Text style={styles.securityText}>Secured by Auth0</Text>
            </View>
            <Text style={styles.securitySubtext}>
              Enterprise-grade security for your account
            </Text>
          </View>

          {/* Guest Option */}
          {onGuestContinue && (
            <TouchableOpacity 
              style={[styles.guestButton, isLoading && styles.buttonDisabled]} 
              onPress={onGuestContinue}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
            </TouchableOpacity>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Auth0LoginScreen;
