import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { Footer } from '../components/common/Footer';
import { Header } from '../components/common/Header';
import {
  ChatScreen,
  FareCalculatorScreen,
  FareMatrixScreen,
  HomeScreen,
  ScannerScreen,
  ViewType
} from '../screens';
import AuthScreen from '../screens/auth/AuthScreen';
import { COLORS } from '../shared/styles';
import { globalStyles } from '../shared/styles/globalStyles';
import { LoginData, SignUpData } from '../shared/types/auth';

/**
 * Main application component for LakbAI Passenger.
 * Handles authentication and navigation between screens.
 */

const LakbAIPassenger: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('home');

  const handleLogin = (data: LoginData) => {
    console.log('Login data:', data);
    if (data.username === 'livado') {
      setIsAuthenticated(true);            // trigger auth
      setCurrentView('home');              // force home screen
    } else {
      alert('Invalid username');           // or Alert.alert on mobile
    }
  };

  
  const handleSignUp = (data: SignUpData) => {
    // Add your signup logic here (API call, validation, etc.)
    console.log('SignUp data:', data);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentView('home');
  };

  const renderScreen = () => {
    switch (currentView) {
      case 'home':
        return <HomeScreen onNavigate={setCurrentView} />;
      case 'scanner':
        return <ScannerScreen />;
      case 'chat':
        return <ChatScreen />;
      case 'fare':
        return <FareCalculatorScreen />;
      case 'route':
        return <FareMatrixScreen />;
      default:
        return <HomeScreen onNavigate={setCurrentView} />;
    }
  };

  // Show AuthScreen if not authenticated
  if (!isAuthenticated) {
    return <AuthScreen onLogin={handleLogin} onSignUp={handleSignUp} />;
  }

  // Show main app if authenticated
  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <Header
        showBackButton={currentView !== 'home'}
        onBackPress={() => setCurrentView('home')}
        userType="Passenger"
        onLogout={handleLogout} // Add logout functionality to header
      />
      <View style={styles.mainContent}>
        {renderScreen()}
      </View>
      <Footer />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
  },
});

export default LakbAIPassenger;