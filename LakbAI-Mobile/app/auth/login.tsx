import React from 'react';
import { View, StyleSheet } from 'react-native';
import LoginScreen from '../../screens/auth/views/LoginScreen';
import { useRouter } from 'expo-router';
import { PassengerRoutes } from '../../routes';
import sessionManager from '../../shared/services/sessionManager';

const LoginRoute: React.FC = () => {
  const router = useRouter();

  const handleLogin = async (data: any) => {
    console.log('Login successful:', data);
    
    try {
      // Clear any existing Auth0 session data
      await sessionManager.clearAllAuthData();
      console.log('✅ Cleared existing Auth0 session data');
      
      // Store the new traditional user session
      await sessionManager.storeTraditionalUserSession(data.user, 'passenger');
      console.log('✅ Created traditional user session for:', data.user.username);
      
      // Don't call forceFreshAuth as it will clear our new session
      // Instead, just redirect to home - the useAuth hook will detect the new session
      console.log('🚀 Redirecting to home with new traditional session');
      router.push(PassengerRoutes.HOME);
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
