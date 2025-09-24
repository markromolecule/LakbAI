import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import RegisterScreen from '../../screens/auth/views/RegisterScreen';
import { useRouter } from 'expo-router';
import { PassengerRoutes } from '../../routes';
import { authService } from '../../shared/services';
import { useAuthContext } from '../../shared/providers/AuthProvider';
import sessionManager from '../../shared/services/sessionManager';

const RegisterRoute: React.FC = () => {
  const router = useRouter();
  const { refreshTraditionalSession } = useAuthContext();

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
        
        try {
          // Clear any existing Auth0 session data
          await sessionManager.clearAllAuthData();
          console.log('✅ Cleared existing Auth0 session data');
          
          // Get user type from database response, default to 'passenger'
          const userType = loginResult.user.user_type || 'passenger';
          
          // Create a new traditional user session
          const traditionalSession = {
            userId: loginResult.user.id.toString(),
            username: loginResult.user.username || loginResult.user.name,
            email: loginResult.user.email,
            userType: userType,
            loginTime: new Date().toISOString(),
            profileCompleted: loginResult.user.profile_completed || false,
            auth0Id: null, // Traditional users don't have Auth0 ID
            dbUserData: loginResult.user, // Store the complete user data
          };
          
          // Store the new session
          await sessionManager.setTraditionalUserSession(traditionalSession);
          console.log('✅ Created traditional user session:', traditionalSession);
          console.log('👤 User type:', userType);
          
          // Refresh the traditional session to update auth state
          await refreshTraditionalSession();
          
          // Navigate to home screen
          router.push(PassengerRoutes.HOME);
        } catch (sessionError) {
          console.error('Error creating traditional session:', sessionError);
          // Fallback: just redirect to home
          router.push(PassengerRoutes.HOME);
        }
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
