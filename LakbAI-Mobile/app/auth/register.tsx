import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import RegisterScreen from '../../screens/auth/views/RegisterScreen';
import { useRouter } from 'expo-router';
import { PassengerRoutes } from '../../routes';
import { authService } from '../../shared/services';

const RegisterRoute: React.FC = () => {
  const router = useRouter();

  const handleSignUp = async (data: any) => {
    console.log('Sign up data:', data);
    
    try {
      // Automatically log in the user after successful registration
      console.log('🔄 Auto-logging in user after registration...');
      const loginResult = await authService.login({
        username: data.username,
        password: data.password
      });
      
      if (loginResult.status === 'success') {
        console.log('✅ Auto-login successful!');
        // Navigate to home screen
        router.push(PassengerRoutes.HOME);
      } else {
        console.log('❌ Auto-login failed:', loginResult.message);
        // Show alert and redirect to login screen
        Alert.alert(
          'Registration Successful',
          'Your account has been created successfully. Please log in to continue.',
          [
            {
              text: 'OK',
              onPress: () => router.push('/auth/login')
            }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Auto-login error:', error);
      // Show alert and redirect to login screen
      Alert.alert(
        'Registration Successful',
        'Your account has been created successfully. Please log in to continue.',
        [
          {
            text: 'OK',
            onPress: () => router.push('/auth/login')
          }
        ]
      );
    }
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
