import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  View,
} from 'react-native';
import { useDriverState } from './hooks';
import { HomeView, ScannerView, FareView, ProfileView, LogsView } from './views';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/common/Footer';
import { COLORS } from '../../shared/themes/colors';
import { FARE_MATRIX } from '../../constants/fareMatrix';
import { driverStyles } from './styles';

export const DriverScreen: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    driverLocation,
    lastScanTime,
    isOnDuty,
    driverProfile,
    recentLogs,
    simulateQRScan,
    toggleDuty
  } = useDriverState();

  const renderCurrentView = () => {
    switch (currentView) {
      case 'home':
        return (
          <HomeView
            driverProfile={driverProfile}
            isOnDuty={isOnDuty}
            driverLocation={driverLocation}
            lastScanTime={lastScanTime}
            onNavigate={setCurrentView}
            onToggleDuty={toggleDuty}
          />
        );
      case 'scanner':
        return (
          <ScannerView
            driverLocation={driverLocation}
            lastScanTime={lastScanTime}
            onSimulateScan={simulateQRScan}
          />
        );
      case 'fare':
        return (
          <FareView
            driverProfile={driverProfile}
            fareMatrix={FARE_MATRIX}
          />
        );
      case 'profile':
        return (
          <ProfileView
            driverProfile={driverProfile}
            isOnDuty={isOnDuty}
          />
        );
      case 'logs':
        return (
          <LogsView
            recentLogs={recentLogs}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={driverStyles.fullContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <Header
        title="LakbAI"
        showBackButton={currentView !== 'home'}
        onBackPress={() => setCurrentView('home')}
        userType="Driver"
      />
    
      {/* Main Content Container with proper flex handling */}
      <View style={driverStyles.mainContent}>
        {renderCurrentView()}
      </View>
      
      <Footer
        text="Professional Transportation"
        version="Driver v1.0"
      />
    </SafeAreaView>
  );
};