import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import auth0Service from '../../../shared/services/auth0Service';
import { PassengerRoutes } from '../../../routes';
import { storeUserSession } from '../../../shared/utils/authUtils';

interface HybridAuthScreenProps {
  onBackToTraditional?: () => void;
}

const HybridAuthScreen: React.FC<HybridAuthScreenProps> = ({ onBackToTraditional }) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleTraditionalAuth = () => {
    if (onBackToTraditional) {
      onBackToTraditional();
    }
  };

  const handleAuth0SignIn = async (provider: string) => {
    setIsLoading(true);
    
    try {
      console.log(`Starting ${provider} authentication...`);
      
      // Start Auth0 authentication flow
      const { result, codeVerifier } = await auth0Service.authenticate();
      
      if (result.type === 'success' && result.params.code) {
        console.log('Auth0 authentication successful, exchanging code for tokens...');
        
        // Exchange authorization code for tokens
        const tokens = await auth0Service.exchangeCodeForTokens(
          result.params.code,
          codeVerifier
        );
        
        console.log('Tokens received:', tokens);
        
        // Check if token exchange was successful
        if (tokens.status !== 'success' || !tokens.data || !tokens.data.access_token) {
          throw new Error('Token exchange failed: ' + (tokens.message || 'Unknown error'));
        }
        
        console.log('Getting user profile...');
        
        // Get user profile from Auth0
        const auth0User = await auth0Service.getUserProfile(tokens.data.access_token);
        
        console.log('Auth0 user profile received:', auth0User);
        
        // Sync user with local database
        const syncResult = await auth0Service.syncUserWithDatabase(auth0User);
        
        if (syncResult.status === 'success') {
          const user = syncResult.user;
          
          // Check if profile is complete
          if (user.profile_completed) {
            console.log('Profile complete, storing session and redirecting...');
            
            // Store user session
            await storeUserSession(user.user_type || 'passenger', user.username || user.email, true);
            
            // Redirect to appropriate screen based on user type
            if (user.user_type === 'driver') {
              router.replace('/driver');
            } else {
              router.replace(PassengerRoutes.HOME);
            }
          } else {
            console.log('Profile incomplete, redirecting to profile completion...');
            
            // Redirect to profile completion screen
            router.push({
              pathname: '/auth/complete-profile',
              params: { 
                auth0Id: auth0User.sub,
                userData: JSON.stringify(user)
              }
            });
          }
        } else {
          throw new Error(syncResult.message || 'Failed to sync user with database');
        }
      } else if (result.type === 'cancel') {
        console.log('Auth0 authentication cancelled by user');
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Auth0 authentication error:', error);
      Alert.alert(
        'Authentication Error',
        'Failed to authenticate with ' + provider + '. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const socialProviders = [
    {
      id: 'google',
      name: 'Google',
      icon: 'logo-google',
      color: '#DB4437',
      onPress: () => handleAuth0SignIn('google-oauth2')
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: 'logo-facebook',
      color: '#4267B2',
      onPress: () => handleAuth0SignIn('facebook')
    },
    {
      id: 'apple',
      name: 'Apple',
      icon: 'logo-apple',
      color: '#000000',
      onPress: () => handleAuth0SignIn('apple')
    }
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Authenticating...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleTraditionalAuth} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Quick Sign-In</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>
          Choose your preferred sign-in method
        </Text>

        <View style={styles.providersContainer}>
          {socialProviders.map((provider) => (
            <TouchableOpacity
              key={provider.id}
              style={[styles.providerButton, { backgroundColor: provider.color }]}
              onPress={provider.onPress}
              activeOpacity={0.8}
            >
              <Ionicons name={provider.icon as any} size={24} color="white" />
              <Text style={styles.providerText}>Continue with {provider.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.traditionalButton}
          onPress={handleTraditionalAuth}
        >
          <Text style={styles.traditionalButtonText}>
            Use Email & Password
          </Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 40,
  },
  providersContainer: {
    marginBottom: 30,
  },
  providerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  providerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 20,
    color: '#666666',
    fontSize: 14,
  },
  traditionalButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 30,
  },
  traditionalButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
});

export default HybridAuthScreen;
