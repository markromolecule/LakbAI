// LakbAI-Mobile/app/index.tsx

import React from 'react';
import { SafeAreaView, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import AuthScreen from '../screens/auth/views/AuthScreen';
import type { LoginData, SignUpData } from '../shared/types/authentication'; 

export default function Index() {
  const router = useRouter();

  // simple local check for demo/test
  const handleLogin = (data: LoginData) => {
    const { username, password } = data;
    // Allow john / john for quick test
    if (username === 'john' && password === 'john') {
      // navigate to passenger home (replace so back button won't return to auth)
      router.replace('/passenger/home');
      return;
    }

    // here you can call your real auth API
    Alert.alert('Invalid credentials', 'Try username: john / password: john for testing');
  };

  const handleSignUp = (data: SignUpData) => {
    // For now just show an alert — extend as needed.
    Alert.alert('Sign up', `Created account for ${data.firstName} ${data.lastName}`);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <AuthScreen onLogin={handleLogin} onSignUp={handleSignUp} />
    </SafeAreaView>
  );
}