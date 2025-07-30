import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Header } from '../components/common/Header';
// import { ChatScreen } from '../screens/passenger/ChatScreen';
// import { FareCalculatorScreen } from '../screens/passenger/FareCalculatorScreen';
// import { FareMatrixScreen } from '../screens/passenger/FareMatrixScreen';
import { HomeScreen } from '../screens/passenger/HomeScreen';
// import { ScannerScreen } from '../screens/passenger/ScannerScreen';
import { COLORS, SPACING } from '../shared/styles';
import { globalStyles } from '../shared/styles/globalStyles';
import { ViewType } from '../shared/types';

const LakbAIPassenger: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('home');

  const renderScreen = () => {
    switch (currentView) {
      case 'home':
        return <HomeScreen onNavigate={setCurrentView} />;
      // case 'scanner':
      //   return <ScannerScreen />;
      // case 'chat':
      //   return <ChatScreen />;
      // case 'fare':
      //   return <FareCalculatorScreen />;
      // case 'route':
      //   return <FareMatrixScreen />;
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

      <View style={styles.footer}>
        <Text style={styles.footerText}>LakbAI v1.0 - Smart Jeepney Transportation</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
  },
  footer: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.gray400,
    fontSize: 12,
  },
});

export default LakbAIPassenger;