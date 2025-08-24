import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { auth0Service } from '../../shared/services/auth0Service';

const Auth0Debugger: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const testPKCE = async () => {
    try {
      setIsLoading(true);
      await auth0Service.testPKCE();
      Alert.alert('Success', 'PKCE test completed successfully');
    } catch (error) {
      Alert.alert('Error', `PKCE test failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const result = await auth0Service.loginWithGoogle();
      if (result.error) {
        Alert.alert('Error', `Google login failed: ${result.error}`);
      } else {
        Alert.alert('Success', 'Google login successful');
      }
    } catch (error) {
      Alert.alert('Error', `Google login error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testFacebookLogin = async () => {
    try {
      setIsLoading(true);
      const result = await auth0Service.loginWithFacebook();
      if (result.error) {
        Alert.alert('Error', `Facebook login failed: ${result.error}`);
      } else {
        Alert.alert('Success', 'Facebook login successful');
      }
    } catch (error) {
      Alert.alert('Error', `Facebook login error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Auth0 Debugger</Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={testPKCE}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test PKCE Generation'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={testGoogleLogin}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test Google Login'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={testFacebookLogin}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test Facebook Login'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default Auth0Debugger;
