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
import { COLORS } from '../shared/styles';
import { globalStyles } from '../shared/styles/globalStyles';

const LakbAIPassenger: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('home');

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

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <Header
        showBackButton={currentView !== 'home'}
        onBackPress={() => setCurrentView('home')}
        userType="Passenger"
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