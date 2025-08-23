import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { auth0Service } from '../../shared/services/auth0Service';
import { storeUserSession } from '../../shared/utils/authUtils';
import { PassengerRoutes } from '../../routes/PassengerRoutes';
import { DriverRoutes } from '../../routes/DriverRoutes';

/**
 * Auth0 Callback Handler for Deep Linking
 * This component handles the redirect back from Auth0 after authentication
 */
export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      setStatus('processing');
      setMessage('Processing authentication...');

      console.log('Auth callback received with params:', params);

      // Check if there's an error in the callback
      if (params.error) {
        const errorDescription = params.error_description || 'Authentication failed';
        throw new Error(errorDescription as string);
      }

      // Check if we have an authorization code
      if (params.code) {
        console.log('Authorization code received, processing...');
        setMessage('Completing authentication...');

        // The auth0Service should handle the code exchange automatically
        // since we're using Expo AuthSession which handles the callback
        
        // Check if user is now authenticated
        const isAuthenticated = await auth0Service.isAuthenticated();
        
        if (isAuthenticated) {
          const user = await auth0Service.getCurrentUser();
          
          if (user) {
            console.log('Authentication successful:', user);
            setStatus('success');
            setMessage('Welcome! Redirecting...');
            
            await handleSuccessfulAuth(user);
            return;
          }
        }
      }

      // If we get here without success, there might be an issue
      throw new Error('Authentication could not be completed');
      
    } catch (error) {
      console.error('Auth callback error:', error);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Authentication failed');
      
      // Show error alert and redirect back to login
      setTimeout(() => {
        Alert.alert(
          'Authentication Error',
          error instanceof Error ? error.message : 'Authentication failed',
          [
            {
              text: 'Try Again',
              onPress: () => router.replace('/')
            }
          ]
        );
      }, 2000);
    }
  };

  const handleSuccessfulAuth = async (userData: any) => {
    try {
      // Get user roles to determine navigation
      const { roles } = await auth0Service.getUserRoles();
      console.log('User roles:', roles);
      
      // Determine user type - default to passenger for mobile app
      const userType = roles.includes('driver') ? 'driver' : 'passenger';
      const username = userData.nickname || userData.email || userData.name || 'user';
      
      // Store user session
      await storeUserSession(userType, username, true);
      
      // Navigate based on user type after a brief delay
      setTimeout(() => {
        if (userType === 'driver') {
          console.log('Navigating to driver home...');
          router.replace(DriverRoutes.HOME);
        } else {
          console.log('Navigating to passenger home...');
          router.replace(PassengerRoutes.HOME);
        }
      }, 1500);
    } catch (error) {
      console.error('Navigation error:', error);
      // Default to passenger route if there's an error
      setTimeout(() => {
        router.replace(PassengerRoutes.HOME);
      }, 1500);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <ActivityIndicator size="large" color="#007AFF" />;
      case 'success':
        return (
          <View style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: '#28A745',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Text style={{ color: 'white', fontSize: 32, fontWeight: 'bold' }}>✓</Text>
          </View>
        );
      case 'error':
        return (
          <View style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: '#DC3545',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Text style={{ color: 'white', fontSize: 32, fontWeight: 'bold' }}>✕</Text>
          </View>
        );
    }
  };

  return (
    <View style={{
      flex: 1,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24
    }}>
      {/* Logo */}
      <View style={{
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: '#F8F9FA',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
      }}>
        <Text style={{ fontSize: 32, fontWeight: 'bold' }}>L</Text>
      </View>

      {/* Status Icon */}
      {getStatusIcon()}

      {/* Status Text */}
      <Text style={{
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1A1A',
        textAlign: 'center',
        marginTop: 24,
        marginBottom: 12
      }}>
        {status === 'processing' && 'Authenticating...'}
        {status === 'success' && 'Welcome Back!'}
        {status === 'error' && 'Authentication Failed'}
      </Text>

      <Text style={{
        fontSize: 16,
        color: '#6C757D',
        textAlign: 'center',
        lineHeight: 24
      }}>
        {message}
      </Text>

      {/* Security Footer */}
      <View style={{
        position: 'absolute',
        bottom: 40,
        alignItems: 'center'
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingVertical: 8,
          paddingHorizontal: 16,
          backgroundColor: '#F8F9FA',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: '#E9ECEF'
        }}>
          <View style={{
            width: 16,
            height: 16,
            backgroundColor: '#28A745',
            borderRadius: 2
          }} />
          <Text style={{
            fontSize: 14,
            color: '#28A745',
            fontWeight: '600'
          }}>
            Secured by Auth0
          </Text>
        </View>
      </View>
    </View>
  );
}
