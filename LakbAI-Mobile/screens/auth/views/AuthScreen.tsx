import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView } from 'react-native';
import CleanAuthScreen from './CleanAuthScreen';
import styles from '../styles/AuthScreen.styles';

const AuthScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <CleanAuthScreen />
    </SafeAreaView>
  );
};

export default AuthScreen;