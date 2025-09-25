import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  View,
} from 'react-native';
import { useDriverState } from './hooks';
import { HomeView, ScannerView, FareView, ProfileView, LogsView, EarningsView } from './views';
import { QRGenerator } from './components/QRGenerator';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/common/Footer';
import { COLORS } from '../../shared/themes/colors';
import { driverStyles } from './styles';

export const DriverScreen: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    driverLocation,
    lastScanTime,
    isOnDuty,
    driverProfile,
    userSession,
    recentLogs,
    simulateQRScan,
    toggleDuty,
    updateLocation,
    refreshDriverProfile,
    refreshDriverLocation
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
            onRefresh={refreshDriverProfile}
            onRefreshLocation={refreshDriverLocation}
          />
        );
      case 'scanner':
        return (
          <ScannerView
            driverLocation={driverLocation}
            lastScanTime={lastScanTime}
            onSimulateScan={simulateQRScan}
            onLocationUpdate={updateLocation}
            driverProfile={driverProfile}
            driverInfo={{
              id: driverProfile.id?.toString() || userSession?.userId || '16',
              name: driverProfile.name,
              jeepneyNumber: driverProfile.jeepneyNumber,
              route: driverProfile.route,
            }}
            isOnDuty={isOnDuty}
            onTripCompleted={(tripSummary) => {
              console.log('🔄 DriverScreen received onTripCompleted:', tripSummary);
            }}
            onShiftEnd={() => {
              console.log('🔄 DriverScreen received onShiftEnd, calling toggleDuty()');
              toggleDuty();
            }}
            onRefresh={refreshDriverProfile}
          />
        );
      case 'fare':
        return (
          <FareView
            driverProfile={driverProfile}
          />
        );
      case 'profile':
        return (
          <ProfileView
            driverProfile={driverProfile}
            isOnDuty={isOnDuty}
            onRefresh={refreshDriverProfile}
          />
        );
      case 'logs':
        return (
          <LogsView
            recentLogs={recentLogs}
            driverProfile={driverProfile}
          />
        );
      case 'earnings':
        return (
          <EarningsView
            driverProfile={driverProfile}
            onRefresh={refreshDriverProfile}
          />
        );
      case 'qrcode':
        return (
          <QRGenerator
            driverInfo={{
              id: driverProfile.id?.toString() || userSession?.userId || '16', // Use actual database ID
              name: driverProfile.name,
              jeepneyNumber: driverProfile.jeepneyNumber,
              route: driverProfile.route,
              currentLocation: driverLocation,
            }}
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