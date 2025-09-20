import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthContext } from '../../../shared/providers/AuthProvider';
import { useRouter } from 'expo-router';
import sessionManager from '../../../shared/services/sessionManager';

const CleanAuthScreen: React.FC = () => {
  const { login: auth0Login, isLoading, error } = useAuthContext();
  const router = useRouter();

  const handleQuickSignIn = async () => {
    try {
      await auth0Login();
    } catch (error) {
      console.error('Auth0 login error:', error);
    }
  };

  const handleTraditionalSignIn = async () => {
    try {
      // Clear any existing Auth0 session data to ensure clean state
      console.log('Clearing Auth0 session data for traditional login...');
      
      // Clear the current session if it exists
      await sessionManager.clearAllAuthData();
      console.log('Auth0 session data cleared');
      
      // Navigate to the traditional login screen
      router.push('/auth/login');
    } catch (error) {
      console.error('Error clearing Auth0 session:', error);
      // Continue to traditional login even if clearing fails
      router.push('/auth/login');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header with Logo */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/images/logofinal.png')}
              style={styles.logo}
              accessibilityLabel="LakbAI logo"
            />
          </View>
          <Text style={styles.title}>Welcome to LakbAI</Text>
          <Text style={styles.subtitle}>Choose how you'd like to sign in</Text>
        </View>

        {/* Choice Buttons */}
        <View style={styles.choiceContainer}>
          {/* Quick Sign-In Button */}
          <TouchableOpacity 
            style={[
              styles.choiceButton,
              styles.quickSignInButton,
              isLoading && styles.choiceButtonDisabled
            ]} 
            onPress={handleQuickSignIn}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="logo-google" size={32} color="#FFFFFF" />
              <Text style={styles.choiceButtonText}>Quick Sign-In</Text>
              <Text style={styles.choiceButtonSubtext}>Continue with Google</Text>
            </View>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Traditional Sign-In Button */}
          <TouchableOpacity 
            style={[
              styles.choiceButton,
              styles.traditionalButton
            ]} 
            onPress={handleTraditionalSignIn}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="person-outline" size={32} color="#007AFF" />
              <Text style={styles.traditionalButtonText}>Traditional Sign-In</Text>
              <Text style={styles.choiceButtonSubtext}>Use username & password</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <Ionicons name="car-sport" size={24} color="#007AFF" />
            <Text style={styles.loadingText}>Signing you in...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 16,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666666',
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 24,
  },
  choiceContainer: {
    width: '100%',
    alignItems: 'center',
  },
  choiceButton: {
    width: '100%',
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  quickSignInButton: {
    backgroundColor: '#4285F4',
  },
  traditionalButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  choiceButtonDisabled: {
    backgroundColor: '#B0B0B0',
    shadowOpacity: 0.1,
  },
  buttonContent: {
    alignItems: 'center',
    gap: 8,
  },
  choiceButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  traditionalButtonText: {
    color: '#007AFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  choiceButtonSubtext: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '400',
    opacity: 0.9,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8E8E8',
  },
  dividerText: {
    fontSize: 16,
    color: '#A0A0A0',
    fontWeight: '500',
    marginHorizontal: 20,
  },
  errorContainer: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFE5E5',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    width: '100%',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default CleanAuthScreen;
