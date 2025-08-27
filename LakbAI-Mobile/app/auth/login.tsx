import React from 'react';
import { View, StyleSheet } from 'react-native';
import LoginScreen from '../../screens/auth/views/LoginScreen';
import { useRouter } from 'expo-router';
import { PassengerRoutes } from '../../routes';

const LoginRoute: React.FC = () => {
  const router = useRouter();

  const handleLogin = (data: any) => {
    console.log('Login successful:', data);
    // Redirect to home after successful login
    router.push(PassengerRoutes.HOME);
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
