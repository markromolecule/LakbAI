import React from 'react';
import { View, StyleSheet } from 'react-native';
import LoginScreen from '../../screens/auth/views/LoginScreen';
import { useRouter } from 'expo-router';
import { PassengerRoutes } from '../../routes';
import { useAuthContext } from '../../shared/providers/AuthProvider';
import sessionManager from '../../shared/services/sessionManager';

const LoginRoute: React.FC = () => {
  const router = useRouter();
  const { refreshTraditionalSession } = useAuthContext();

  const handleLogin = async (data: any) => {
    console.log('Login successful:', data);
    
    try {
      // Clear any existing Auth0 session data
      await sessionManager.clearAllAuthData();
      console.log('✅ Cleared existing Auth0 session data');
      
      // Get user type from database response, default to 'passenger'
      const userType = data.user.user_type || 'passenger';
      
      // Create a new traditional user session
      const traditionalSession = {
        userId: data.user.id.toString(),
        username: data.user.username || data.user.name,
        email: data.user.email,
        userType: userType,
        loginTime: new Date().toISOString(),
        profileCompleted: data.user.profile_completed || false,
        auth0Id: null, // Traditional users don't have Auth0 ID
        dbUserData: data.user, // Store the complete user data
      };
      
      // Store the new session
      await sessionManager.setTraditionalUserSession(traditionalSession);
      console.log('✅ Created traditional user session:', traditionalSession);
      console.log('👤 User type:', userType);
      
      // Refresh the traditional session to update auth state
      await refreshTraditionalSession();
      
      // Redirect based on user type
      if (userType === 'driver') {
        router.push('/driver');
      } else {
        router.push(PassengerRoutes.HOME);
      }
    } catch (error) {
      console.error('Error creating traditional session:', error);
      // Fallback: just redirect to home
      router.push(PassengerRoutes.HOME);
    }
  };

  const handleForgotPassword = () => {
    console.log('Forgot password pressed');
    // Implement forgot password functionality
  };

  const handleGuestContinue = () => {
    console.log('Guest continue pressed');
    router.push(PassengerRoutes.HOME);
  };

  const handleBack = () => {
    router.back();
  };

  const handleSwitchToSignUp = () => {
    router.push('/auth/register');
  };

  return (
    <View style={styles.container}>
      <LoginScreen
        onLogin={handleLogin}
        onForgotPassword={handleForgotPassword}
        onGuestContinue={handleGuestContinue}
        onBack={handleBack}
        onSwitchToSignUp={handleSwitchToSignUp}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});

export default LoginRoute;
