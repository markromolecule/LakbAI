import { useState } from 'react';
import { Alert } from 'react-native';
import { ViewType, DriverProfile, LogItem } from '../../../shared/types/driver';
import { CHECKPOINTS } from '../../../constants/checkpoints';

export const useDriverState = () => {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [driverLocation, setDriverLocation] = useState<string>('Robinson Tejero');
  const [lastScanTime, setLastScanTime] = useState<string>(new Date().toLocaleTimeString());
  const [isOnDuty, setIsOnDuty] = useState<boolean>(true);

  const driverProfile: DriverProfile = {
    name: 'Juan Dela Cruz',
    license: 'D123-456-789',
    jeepneyNumber: 'LKB-001',
    rating: 4.8,
    totalTrips: 1247,
    yearsExperience: 8,
    todayTrips: 12,
    todayEarnings: 1840,
    route: 'Robinson Tejero - Robinson Pala-pala'
  };

  const recentLogs: LogItem[] = [
    { time: '14:30', location: 'Lancaster New City', passengers: 8 },
    { time: '14:15', location: 'Riverside', passengers: 12 },
    { time: '14:00', location: 'Malabon', passengers: 6 },
    { time: '13:45', location: 'Robinson Tejero', passengers: 15 }
  ];

  const simulateQRScan = (): void => {
    const randomCheckpoint = CHECKPOINTS[Math.floor(Math.random() * CHECKPOINTS.length)];
    setDriverLocation(randomCheckpoint);
    setLastScanTime(new Date().toLocaleTimeString());
    
    Alert.alert(
      'Location Updated!',
      `Checkpoint: ${randomCheckpoint}\nTime: ${new Date().toLocaleTimeString()}\n\nYour location has been updated for passengers.`
    );
  };

  const toggleDuty = () => {
    setIsOnDuty(!isOnDuty);
  };

  return {
    currentView,
    setCurrentView,
    driverLocation,
    lastScanTime,
    isOnDuty,
    driverProfile,
    recentLogs,
    simulateQRScan,
    toggleDuty
  };
};