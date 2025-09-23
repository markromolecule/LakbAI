import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { ViewType, DriverProfile, LogItem } from '../../../shared/types/driver';
import { CHECKPOINTS } from '../../../constants/checkpoints';
import sessionManager, { UserSession } from '../../../shared/services/sessionManager';
import { getBaseUrl } from '../../../config/apiConfig';
import { earningsService } from '../../../shared/services/earningsService';

export const useDriverState = () => {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [driverLocation, setDriverLocation] = useState<string>('Robinson Tejero');
  const [lastScanTime, setLastScanTime] = useState<string>(new Date().toLocaleTimeString());
  const [isOnDuty, setIsOnDuty] = useState<boolean>(false); // Default to off-duty
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [userSession, setUserSession] = useState<UserSession | null>(null);

  // Load real driver data from session
  useEffect(() => {
    loadDriverProfile();
    loadDriverLocation(); // Load current location from API
    
    // Listen for earnings changes and refresh profile
    const unsubscribe = earningsService.addListener((driverId) => {
      console.log('🔄 Earnings changed for driver:', driverId, 'Refreshing profile...');
      if (userSession?.dbUserData?.id.toString() === driverId) {
        // Add small delay to ensure earnings are saved before refreshing
        setTimeout(() => {
          loadDriverProfile();
        }, 500);
      }
    });
    
    return unsubscribe;
  }, [userSession?.dbUserData?.id]);

  const loadDriverProfile = async () => {
    try {
      console.log('🚀 Starting to load driver profile...');
      const session = await sessionManager.getUserSession();
      console.log('📱 Session data:', session);
      
      if (session && session.userType === 'driver' && session.dbUserData) {
        setUserSession(session);
        console.log('👤 Driver session found, ID:', session.dbUserData.id);
        
        // Try to fetch complete driver profile with jeepney info from API
        try {
          const baseUrl = getBaseUrl().replace('/routes/api.php', '');
          const apiUrl = `${baseUrl}/api/mobile/driver/profile/${session.dbUserData.id}`;
          console.log('🔍 Fetching driver profile from:', apiUrl);
          console.log('🔍 Base URL from config:', getBaseUrl());
          
          const response = await fetch(apiUrl);
          console.log('📡 API Response status:', response.status);
          
          if (response.ok) {
            const result = await response.json();
            console.log('📦 API Response data:', JSON.stringify(result, null, 2));
            
            if (result.status === 'success' && result.driverProfile) {
              const apiProfile = await transformApiProfileToDriverProfile(result.driverProfile);
              setDriverProfile(apiProfile);
              console.log('✅ Driver profile loaded from API:', JSON.stringify(apiProfile, null, 2));
              return;
            } else {
              console.warn('⚠️ API returned unsuccessful response:', result);
            }
          } else {
            console.warn('⚠️ API response not ok:', response.status, response.statusText);
            const errorText = await response.text();
            console.warn('⚠️ Error response body:', errorText);
          }
        } catch (apiError) {
          console.warn('⚠️ Failed to load from API, falling back to session data:', apiError);
        }
        
        // Fallback to session data transformation
        const profile = await transformDatabaseUserToDriverProfile(session.dbUserData);
        setDriverProfile(profile);
        console.log('✅ Driver profile loaded from session:', profile.name);
      } else {
        console.log('⚠️ No driver session found, using mock data');
        console.log('⚠️ Session details:', { 
          hasSession: !!session, 
          userType: session?.userType, 
          hasDbUserData: !!session?.dbUserData 
        });
        setDriverProfile(getMockDriverProfile());
      }
    } catch (error) {
      console.error('❌ Failed to load driver profile:', error);
      setDriverProfile(getMockDriverProfile());
    }
  };

  const loadDriverLocation = async () => {
    try {
      const session = await sessionManager.getUserSession();
      if (session && session.userType === 'driver' && session.dbUserData) {
        console.log('📍 Loading driver location for driver ID:', session.dbUserData.id);
        
        // Get the driver's route from jeepney assignment
        const jeepneyResponse = await fetch(`${getBaseUrl()}/jeepneys`);
        if (jeepneyResponse.ok) {
          const jeepneyData = await jeepneyResponse.json();
          const jeepney = jeepneyData.jeepneys?.find((j: any) => j.driver_id === session.dbUserData.id);
          
          if (jeepney?.route_id) {
            // Fetch current location from the driver's route with cache busting
            const timestamp = new Date().getTime();
            const locationResponse = await fetch(`${getBaseUrl()}/mobile/locations/route/${jeepney.route_id}?t=${timestamp}`);
            if (locationResponse.ok) {
              const locationData = await locationResponse.json();
              const driverLocation = locationData.driver_locations?.find((d: any) => d.driver_id == session.dbUserData.id);
              
              if (driverLocation?.last_scanned_checkpoint) {
                console.log('📍 API returned location:', driverLocation.last_scanned_checkpoint);
                console.log('📍 Current state location:', driverLocation); // This will show the current state
                setDriverLocation(driverLocation.last_scanned_checkpoint);
                setLastScanTime(driverLocation.last_update || new Date().toLocaleTimeString());
                console.log('✅ Loaded driver location from API:', driverLocation.last_scanned_checkpoint);
              } else {
                console.log('⚠️ No location data found for driver');
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to load driver location:', error);
    }
  };

  const transformApiProfileToDriverProfile = async (apiProfile: any): Promise<DriverProfile> => {
    // Calculate years of experience based on account creation date
    const createdDate = new Date(apiProfile.created_at);
    const now = new Date();
    const yearsExperience = Math.max(1, Math.floor((now.getTime() - createdDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)));
    
    // Get current earnings from earnings service (try API first)
    const currentEarnings = await earningsService.getEarningsAsync(apiProfile.id.toString());
    console.log('💰 Current earnings for driver', apiProfile.id, ':', currentEarnings);
    console.log('📊 Trip counts:', {
      todayTrips: currentEarnings.todayTrips,
      totalTrips: currentEarnings.totalTrips
    });
    
    return {
      id: apiProfile.id,
      name: apiProfile.name,
      license: apiProfile.license_number || '', // Can be blank as requested
      jeepneyNumber: apiProfile.assignedJeepney?.jeepneyNumber || 'No Jeepney Assigned',
      rating: 4.5 + (Math.random() * 0.8), // Mock data - would come from ratings
      totalTrips: currentEarnings.totalTrips, // Get real total trips from earnings service
      yearsExperience: yearsExperience,
      todayTrips: currentEarnings.todayTrips, // Get from earnings service 
      todayEarnings: currentEarnings.todayEarnings, // Get real earnings from service
      totalEarnings: currentEarnings.totalEarnings, // Get total lifetime earnings
      route: apiProfile.assignedJeepney?.route?.name || 'No Route Assigned'
    };
  };

  const transformDatabaseUserToDriverProfile = async (dbUser: any): Promise<DriverProfile> => {
    const fullName = `${dbUser.first_name} ${dbUser.last_name}`;
    
    // Calculate years of experience based on account creation date
    const createdDate = new Date(dbUser.created_at);
    const now = new Date();
    const yearsExperience = Math.max(1, Math.floor((now.getTime() - createdDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)));
    
    // Get current earnings from earnings service
    const currentEarnings = earningsService.getEarnings(dbUser.id.toString());
    console.log('💰 Session earnings for driver', dbUser.id, ':', currentEarnings);
    console.log('📊 Session trip counts:', {
      todayTrips: currentEarnings.todayTrips,
      totalTrips: currentEarnings.totalTrips
    });
    
    // Fetch real jeepney data from API
    let jeepneyNumber = `LKB-${String(dbUser.id).padStart(3, '0')}`; // Default fallback
    let route = 'SM Epza → SM Dasmariñas'; // Default fallback
    
    try {
      const response = await fetch(`${getBaseUrl()}/jeepneys`);
      if (response.ok) {
        const data = await response.json();
        const jeepney = data.jeepneys?.find((j: any) => j.driver_id === dbUser.id);
        if (jeepney) {
          jeepneyNumber = jeepney.jeepney_number;
          route = jeepney.route_name;
          console.log('✅ Fetched real jeepney data:', { jeepneyNumber, route });
        }
      }
    } catch (error) {
      console.warn('Failed to fetch jeepney data from API, using fallback:', error);
      // Fallback to hardcoded routes if API fails
      const routes = [
        'SM Epza → SM Dasmariñas',
        'SM Dasmariñas → SM Epza',
        'Ayala Center - Lahug',
        'SM City Cebu - IT Park',
        'Colon Street - USC Main',
        'Fuente Circle - Capitol Site'
      ];
      route = routes[dbUser.id % routes.length];
    }

    return {
      id: dbUser.id, // Include the actual database ID
      name: fullName,
      license: dbUser.drivers_license_name || '', // Can be blank as requested
      jeepneyNumber,
      rating: 4.5 + (Math.random() * 0.8), // Random rating between 4.5-5.3
      totalTrips: currentEarnings.totalTrips, // Get real total trips from earnings service
      yearsExperience: yearsExperience,
      todayTrips: currentEarnings.todayTrips, // Get from earnings service
      todayEarnings: currentEarnings.todayEarnings, // Get real earnings from service
      totalEarnings: currentEarnings.totalEarnings, // Get total lifetime earnings
      route
    };
  };

  const getMockDriverProfile = (): DriverProfile => {
    // Get current earnings from earnings service for mock profile too
    const currentEarnings = earningsService.getEarnings('001');
    
    return {
      id: '001',
      name: 'Juan Dela Cruz',
      license: '', // Can be blank as requested
      jeepneyNumber: 'LKB-001',
      rating: 4.8,
      totalTrips: currentEarnings.totalTrips, // Get real total trips from earnings service
      yearsExperience: 2, // Based on recent account
      todayTrips: currentEarnings.todayTrips, // Get from earnings service
      todayEarnings: currentEarnings.todayEarnings, // Get real earnings from service
      totalEarnings: currentEarnings.totalEarnings, // Get total lifetime earnings
      route: 'SM Epza → SM Dasmariñas'
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

  const toggleDuty = async () => {
    console.log('🔄 toggleDuty called, current isOnDuty:', isOnDuty);
    if (!userSession?.dbUserData?.id) {
      console.error('❌ No driver ID available for shift toggle');
      return;
    }

    const driverId = userSession.dbUserData.id.toString();
    console.log('🔄 Driver ID for shift toggle:', driverId);
    
    if (isOnDuty) {
      // Ending shift - clear active trip first, then reset earnings
      console.log('🔄 Ending shift for driver:', driverId);
      
      // Clear any active trip when ending shift
      try {
        const { tripTrackingService } = await import('../../../shared/services/tripTrackingService');
        const clearResult = tripTrackingService.clearActiveTrip(driverId);
        console.log('🧹 Clearing active trip on shift end:', clearResult);
        
        if (clearResult.success) {
          console.log('✅ Active trip cleared successfully');
        } else {
          console.log('⚠️ No active trip to clear or error occurred:', clearResult.message);
        }
      } catch (error) {
        console.error('❌ Error clearing active trip:', error);
      }
      
      // Now end the shift and reset earnings
      const result = await earningsService.endShift(driverId);
      
      if (result.success) {
        // Immediately update the state
        setIsOnDuty(false);
        Alert.alert(
          'Shift Ended! 🏁',
          `${result.message}\n\n✅ Any active trips have been cleared.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', result.message);
      }
    } else {
      // Starting shift - reset today's earnings to 0
      console.log('🚀 Starting shift for driver:', driverId);
      const result = await earningsService.startShift(driverId);
      
      if (result.success) {
        Alert.alert(
          'Shift Started! 🚀',
          result.message,
          [{ text: 'OK', onPress: () => setIsOnDuty(true) }]
        );
      } else {
        Alert.alert('Error', result.message);
      }
    }
  };

  const updateLocation = (location: string) => {
    console.log('📍 updateLocation called with:', location);
    setDriverLocation(location);
    setLastScanTime(new Date().toLocaleTimeString());
    console.log('📍 Location updated to:', location);
    
    // Refresh location from API to ensure sync with admin panel
    // Use multiple attempts with increasing delays to ensure we get the latest data
    setTimeout(() => {
      console.log('📍 Refreshing location from API (attempt 1)...');
      loadDriverLocation();
    }, 500); // First attempt after 500ms
    
    setTimeout(() => {
      console.log('📍 Refreshing location from API (attempt 2)...');
      loadDriverLocation();
    }, 2000); // Second attempt after 2 seconds
    
    setTimeout(() => {
      console.log('📍 Refreshing location from API (attempt 3)...');
      loadDriverLocation();
    }, 5000); // Third attempt after 5 seconds
  };

  const refreshDriverProfile = async () => {
    console.log('🔄 Manually refreshing driver profile...');
    await loadDriverProfile();
  };

  const refreshDriverLocation = async () => {
    console.log('🔄 Manually refreshing driver location...');
    await loadDriverLocation();
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
    refreshDriverProfile,
    refreshDriverLocation
  };
};