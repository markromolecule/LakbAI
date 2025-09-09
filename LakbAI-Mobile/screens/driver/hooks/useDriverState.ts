import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { ViewType, DriverProfile, LogItem } from '../../../shared/types/driver';
import { CHECKPOINTS } from '../../../constants/checkpoints';
import sessionManager, { UserSession } from '../../../shared/services/sessionManager';
import { getBaseUrl } from '../../../config/apiConfig';

export const useDriverState = () => {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [driverLocation, setDriverLocation] = useState<string>('Robinson Tejero');
  const [lastScanTime, setLastScanTime] = useState<string>(new Date().toLocaleTimeString());
  const [isOnDuty, setIsOnDuty] = useState<boolean>(true);
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [userSession, setUserSession] = useState<UserSession | null>(null);

  // Load real driver data from session
  useEffect(() => {
    loadDriverProfile();
  }, []);

  const loadDriverProfile = async () => {
    try {
      const session = await sessionManager.getUserSession();
      if (session && session.userType === 'driver' && session.dbUserData) {
        setUserSession(session);
        
        // Try to fetch complete driver profile with jeepney info from API
        try {
          const baseUrl = getBaseUrl().replace('/routes/api.php', '');
          const response = await fetch(`${baseUrl}/api/mobile/driver/profile/${session.dbUserData.id}`);
          if (response.ok) {
            const result = await response.json();
            if (result.status === 'success' && result.driverProfile) {
              const apiProfile = transformApiProfileToDriverProfile(result.driverProfile);
              setDriverProfile(apiProfile);
              console.log('✅ Driver profile loaded from API:', apiProfile.name);
              return;
            }
          }
        } catch (apiError) {
          console.warn('⚠️ Failed to load from API, falling back to session data:', apiError);
        }
        
        // Fallback to session data transformation
        const profile = transformDatabaseUserToDriverProfile(session.dbUserData);
        setDriverProfile(profile);
        console.log('✅ Driver profile loaded from session:', profile.name);
      } else {
        console.log('⚠️ No driver session found, using mock data');
        setDriverProfile(getMockDriverProfile());
      }
    } catch (error) {
      console.error('❌ Failed to load driver profile:', error);
      setDriverProfile(getMockDriverProfile());
    }
  };

  const transformApiProfileToDriverProfile = (apiProfile: any): DriverProfile => {
    return {
      id: apiProfile.id,
      name: apiProfile.name,
      license: apiProfile.license_number || 'N/A',
      jeepneyNumber: apiProfile.assignedJeepney?.jeepneyNumber || 'No Jeepney Assigned',
      rating: 4.5 + (Math.random() * 0.8), // Mock data - would come from ratings
      totalTrips: Math.floor(Math.random() * 1000) + 500, // Mock data
      yearsExperience: Math.floor(Math.random() * 10) + 2, // Mock data
      todayTrips: Math.floor(Math.random() * 20),
      todayEarnings: Math.floor(Math.random() * 2000) + 500,
      route: apiProfile.assignedJeepney?.route?.name || 'No Route Assigned'
    };
  };

  const transformDatabaseUserToDriverProfile = (dbUser: any): DriverProfile => {
    const fullName = `${dbUser.first_name} ${dbUser.last_name}`;
    const address = [
      dbUser.house_number,
      dbUser.street_name,
      dbUser.barangay,
      dbUser.city_municipality,
      dbUser.province
    ].filter(Boolean).join(', ');

    // Generate jeepney details based on user ID for consistency
    const jeepneyNumber = `LKB-${String(dbUser.id).padStart(3, '0')}`;
    const routes = [
      'Robinson Tejero - Robinson Pala-pala',
      'Ayala Center - Lahug',
      'SM City Cebu - IT Park',
      'Colon Street - USC Main',
      'Fuente Circle - Capitol Site'
    ];
    const route = routes[dbUser.id % routes.length];

    return {
      id: dbUser.id, // Include the actual database ID
      name: fullName,
      license: dbUser.drivers_license_name || `D${dbUser.id}-${Date.now().toString().slice(-6)}`,
      jeepneyNumber,
      rating: 4.5 + (Math.random() * 0.8), // Random rating between 4.5-5.3
      totalTrips: Math.floor(Math.random() * 1000) + 500,
      yearsExperience: Math.floor(Math.random() * 10) + 2,
      todayTrips: Math.floor(Math.random() * 20),
      todayEarnings: Math.floor(Math.random() * 2000) + 500,
      route
    };
  };

  const getMockDriverProfile = (): DriverProfile => {
    return {
      id: '001',
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

  const updateLocation = (location: string) => {
    setDriverLocation(location);
    setLastScanTime(new Date().toLocaleTimeString());
  };

  const refreshDriverProfile = async () => {
    await loadDriverProfile();
  };

  return {
    currentView,
    setCurrentView,
    driverLocation,
    lastScanTime,
    isOnDuty,
    driverProfile: driverProfile || getMockDriverProfile(), // Fallback to mock if loading
    userSession,
    recentLogs,
    simulateQRScan,
    toggleDuty,
    updateLocation,
    refreshDriverProfile
  };
};