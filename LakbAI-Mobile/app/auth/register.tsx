import React from 'react';
import { View, StyleSheet } from 'react-native';
import RegisterScreen from '../../screens/auth/views/RegisterScreen';
import { useRouter } from 'expo-router';
import { PassengerRoutes } from '../../routes';

const RegisterRoute: React.FC = () => {
  const router = useRouter();

  const handleSignUp = (data: any) => {
    console.log('Sign up data:', data);
    // After successful sign up, navigate to home or login
    router.push(PassengerRoutes.HOME);
  };

  return (
    <View style={styles.container}>
      <RegisterScreen onSignUp={handleSignUp} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});

export default RegisterRoute;
