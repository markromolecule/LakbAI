// screens/passenger/views/HomeScreen.tsx
import React, { useCallback, useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert, Modal, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { PassengerRoutes, PassengerRouteHref } from '../../../routes/PassengerRoutes';
import { COLORS } from '../../../shared/styles';
import { globalStyles } from '../../../shared/styles/globalStyles';
import { useAuthContext } from '../../../shared/providers/AuthProvider';
import { LocationNotificationDisplay } from '../../../components/passenger/LocationNotificationDisplay';
import { googleMapsService, Coordinates } from '../../../shared/services/googleMapsService';
import { tripNotificationService, TripNotification } from '../../../shared/services/tripNotificationService';
import { fareMatrixService } from '../../../shared/services/fareMatrixService';
import styles from '../styles/HomeScreen.styles';
import DriverLocationCard from '../components/DriverLocationCard';
import { getBaseUrl } from '../../../config/apiConfig';
import type { Href } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage keys
const SELECTED_ROUTE_KEY = 'selected_route';
const ACTIVE_TRIP_KEY = 'active_trip';

interface ActiveTrip {
  id: string;
  driverId: string;
  driverName: string;
  jeepneyNumber: string;
  route: string;
  pickupLocation: string;
  destination: string;
  fare: number;
  pickupCoordinates: Coordinates;
  destinationCoordinates: Coordinates;
  routeCoordinates: Coordinates[];
  status: 'waiting' | 'in_progress' | 'completed';
  startTime: string;
}

interface DriverLocation {
  checkpoint_name: string;
  coordinates: Coordinates;
  lastUpdate: string;
  status: string;
}

const GridItem: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  borderColor: string;
  onPress: () => void;
}> = ({ icon, title, subtitle, color, borderColor, onPress }) => (
  <TouchableOpacity style={[styles.gridItem, { borderColor }]} onPress={onPress}>
    <Ionicons name={icon} size={32} color={color} />
    <Text style={styles.gridTitle}>{title}</Text>
    <Text style={styles.gridSubtitle}>{subtitle}</Text>
  </TouchableOpacity>
);

interface Route {
  id: number;
  route_name: string;
  origin: string;
  destination: string;
  description?: string;
  fare_base?: string;
  checkpoints?: Array<{
    checkpoint_name: string;
    sequence_order: number;
    fare_from_origin: string;
    is_origin: number;
    is_destination: number;
  }>;
}

interface HomeScreenProps {
  onBackButtonPress?: () => void;
  onShowBackButton?: () => void;
  onHideActiveTripView?: (hideFunction: () => void) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onBackButtonPress, onShowBackButton, onHideActiveTripView }) => {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthContext();
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  
  // Active trip state
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [tripStatus, setTripStatus] = useState<'waiting' | 'in_progress' | 'completed'>('waiting');
  const [mapRegion, setMapRegion] = useState({
    latitude: 14.409629181477962,
    longitude: 120.8584739239211,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [notificationShown, setNotificationShown] = useState(false);
  const [showActiveTripView, setShowActiveTripView] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Save selected route to AsyncStorage
  const saveSelectedRoute = async (route: Route) => {
    try {
      await AsyncStorage.setItem(SELECTED_ROUTE_KEY, JSON.stringify(route));
      console.log('🛣️ Route saved to storage:', route.route_name);
    } catch (error) {
      console.error('❌ Error saving route to storage:', error);
    }
  };

  // Load selected route from AsyncStorage
  const loadSelectedRoute = async (): Promise<Route | null> => {
    try {
      const savedRoute = await AsyncStorage.getItem(SELECTED_ROUTE_KEY);
      if (savedRoute) {
        const route = JSON.parse(savedRoute);
        console.log('🛣️ Route loaded from storage:', route.route_name);
        return route;
      }
    } catch (error) {
      console.error('❌ Error loading route from storage:', error);
    }
    return null;
  };

  // Load available routes
  const loadRoutes = async () => {
    try {
      setLoadingRoutes(true);
      console.log('🛣️ Loading routes from API...');
      
      // Get base URL and construct the correct routes endpoint
      const baseUrl = getBaseUrl();
      const routesUrl = `${baseUrl}/routes`;
      console.log('🛣️ Routes URL:', routesUrl);
      
      const response = await fetch(routesUrl);
      console.log('🛣️ Routes response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🛣️ Routes data:', data);
        
        if (data.status === 'success' && data.routes) {
          // All routes from API are active (no status filtering needed)
          console.log('🛣️ Available routes:', data.routes);
          console.log('🛣️ Setting routes in state...');
          
          setRoutes(data.routes);
          console.log('🛣️ Routes set in state successfully');
          
          // If there's an active trip, trigger immediate driver location update
          if (activeTrip) {
            console.log('🛣️ Active trip detected - triggering immediate driver location update');
            setTimeout(() => {
              updateDriverLocation();
            }, 1000); // Small delay to ensure state is updated
          }
          
          // Try to restore saved route, otherwise set default to first one
          if (!selectedRoute && data.routes.length > 0) {
            const savedRoute = await loadSelectedRoute();
            
            if (savedRoute) {
              // Check if saved route still exists in current routes
              const routeExists = data.routes.find((route: any) => route.id === savedRoute.id);
              if (routeExists) {
                setSelectedRoute(routeExists);
                console.log('🛣️ Restored saved route:', routeExists.route_name);
              } else {
                // Saved route no longer exists, use first available route
                setSelectedRoute(data.routes[0]);
                console.log('🛣️ Saved route not found, using default:', data.routes[0].route_name);
                // Save the new default route
                await saveSelectedRoute(data.routes[0]);
              }
            } else {
              // No saved route, use first available route
              setSelectedRoute(data.routes[0]);
              console.log('🛣️ No saved route, using default:', data.routes[0].route_name);
              // Save the default route
              await saveSelectedRoute(data.routes[0]);
            }
          }
        } else {
          console.warn('🛣️ No routes found in response');
        }
      } else {
        console.error('🛣️ Failed to fetch routes:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('🛣️ Error loading routes:', error);
    } finally {
      setLoadingRoutes(false);
    }
  };

  // Active trip functions
  const checkForActiveTrip = async () => {
    try {
      const storedTrip = await getStoredActiveTrip();
      console.log('🔍 Checking for active trip:', storedTrip);
      
      if (storedTrip) {
        // Check if the trip data is valid
        if (storedTrip.id && storedTrip.driverId && storedTrip.pickupLocation && storedTrip.destination) {
          setActiveTrip(storedTrip);
          setTripStatus(storedTrip.status);
          
          // Check if this is a new trip (created within the last 30 seconds)
          const tripAge = Date.now() - new Date(storedTrip.startTime).getTime();
          const isNewTrip = tripAge < 30000; // 30 seconds
          
          console.log('🕐 Trip age check:', {
            startTime: storedTrip.startTime,
            currentTime: new Date().toISOString(),
            tripAge: tripAge,
            isNewTrip: isNewTrip
          });
          
          if (isNewTrip) {
            // Automatically show active trip view for new trips
            setShowActiveTripView(true);
            // Use setTimeout to defer the callback to avoid setState during render
            setTimeout(() => {
              console.log('🆕 Calling onShowBackButton for new trip');
              onShowBackButton?.(); // Notify parent to show back button
            }, 500); // Increased delay to 500ms to ensure trip view is properly set
            console.log('🆕 New trip detected - automatically showing trip view');
          } else {
            // DON'T automatically show active trip view for old trips
            setShowActiveTripView(false);
            console.log('📅 Existing trip detected - not auto-showing');
          }
          
          // Set initial map region
          if (storedTrip.pickupCoordinates && storedTrip.destinationCoordinates) {
            const bounds = googleMapsService.calculateBounds([
              storedTrip.pickupCoordinates,
              storedTrip.destinationCoordinates
            ]);
            setMapRegion(bounds);
          }
          
          console.log('✅ Active trip loaded from storage:', storedTrip);
        } else {
          // Trip data is corrupted or incomplete, clear it
          console.log('⚠️ Corrupted trip data found, clearing...');
          await AsyncStorage.removeItem(ACTIVE_TRIP_KEY);
          setActiveTrip(null);
          setShowActiveTripView(false);
        }
      } else {
        console.log('ℹ️ No active trip found in storage');
        setActiveTrip(null);
        setShowActiveTripView(false);
      }
    } catch (error) {
      console.error('Error checking for active trip:', error);
      // Clear corrupted data
      await AsyncStorage.removeItem(ACTIVE_TRIP_KEY);
      setActiveTrip(null);
      setShowActiveTripView(false);
    }
  };

  const getStoredActiveTrip = async (): Promise<ActiveTrip | null> => {
    try {
      const storedTrip = await AsyncStorage.getItem(ACTIVE_TRIP_KEY);
      return storedTrip ? JSON.parse(storedTrip) : null;
    } catch (error) {
      console.error('Error getting stored active trip:', error);
      return null;
    }
  };

  const updateDriverLocation = async () => {
    console.log('📍 updateDriverLocation called - activeTrip:', !!activeTrip, 'routes count:', routes?.length || 0);
    
    if (!activeTrip) {
      console.log('📍 No active trip - skipping driver location update');
      return;
    }

    if (!routes || routes.length === 0) {
      console.log('📍 No routes available - skipping driver location update');
      console.log('📍 Routes state:', routes);
      console.log('📍 Routes type:', typeof routes);
      return;
    }
    
    try {
      // Find the route ID from the route name
      console.log('📍 Available routes:', routes.map(r => r.route_name));
      console.log('📍 Looking for route:', activeTrip.route);
      
      const currentRoute = routes.find(r => r.route_name === activeTrip.route);
      if (!currentRoute) {
        console.log('📍 No route found for:', activeTrip.route);
        console.log('📍 Available routes:', routes.map(r => ({ id: r.id, name: r.route_name })));
        return;
      }
      
      console.log('📍 Updating driver location for route:', currentRoute.id);
      const response = await fetch(`${getBaseUrl()}/mobile/passenger/real-time-drivers/${currentRoute.id}`);
      const data = await response.json();
      
      console.log('📍 Driver location response:', data);
      
      if (data.status === 'success' && data.driver_locations) {
        // Find the specific driver in the response
        const driverLocation = data.driver_locations.find((driver: any) => driver.driver_id === activeTrip.driverId);
        
        if (driverLocation) {
          setDriverLocation({
            checkpoint_name: driverLocation.current_location,
            coordinates: { latitude: 0, longitude: 0 }, // Default coordinates
            lastUpdate: driverLocation.last_updated,
            status: 'active'
          });
          console.log('📍 Driver location updated:', driverLocation.current_location);
          
          // Check if driver has reached or passed passenger's destination
          await checkTripCompletion(driverLocation.current_location);
        } else {
          console.log('📍 Driver not found in location data');
        }
      } else {
        console.log('📍 No driver location data received - status:', data.status, 'message:', data.message);
      }
    } catch (error) {
      console.error('Error updating driver location:', error);
    }
  };

  const checkTripCompletion = async (driverCurrentLocation: string) => {
    if (!activeTrip || !driverCurrentLocation) {
      console.log('🔍 Trip completion check skipped - no active trip or driver location');
      return;
    }

    try {
      console.log('🔍 Starting trip completion check:', {
        activeTrip: activeTrip.id,
        driverLocation: driverCurrentLocation,
        passengerDestination: activeTrip.destination,
        fullActiveTrip: activeTrip
      });

      // Find the route ID from the route name
      console.log('🔍 Available routes for trip completion:', routes.map(r => r.route_name));
      console.log('🔍 Looking for route:', activeTrip.route);
      
      const currentRoute = routes.find(r => r.route_name === activeTrip.route);
      if (!currentRoute) {
        console.log('⚠️ No route found for:', activeTrip.route);
        console.log('⚠️ Available routes:', routes.map(r => ({ id: r.id, name: r.route_name })));
        return;
      }

      console.log('🔍 Found route:', currentRoute.id);

      // Get route checkpoints to determine if driver has reached or passed destination
      const routeData = await fareMatrixService.getFareMatrixForRoute(currentRoute.id);
      
      if (routeData.status !== 'success' || !routeData.checkpoints) {
        console.log('⚠️ Failed to get route data:', routeData.status);
        return;
      }

      console.log('🔍 Route data loaded, checkpoints:', routeData.checkpoints.length);

      // Find the sequence order of passenger's destination and driver's current location
      const destinationCheckpoint = routeData.checkpoints.find(c => c.checkpoint_name === activeTrip.destination);
      const driverCheckpoint = routeData.checkpoints.find(c => c.checkpoint_name === driverCurrentLocation);
      
      if (!destinationCheckpoint) {
        console.log('⚠️ Destination checkpoint not found:', activeTrip.destination);
        return;
      }
      
      if (!driverCheckpoint) {
        console.log('⚠️ Driver checkpoint not found:', driverCurrentLocation);
        return;
      }

      console.log('🔍 Trip completion check:', {
        passengerDestination: activeTrip.destination,
        destinationSequence: destinationCheckpoint.sequence_order,
        driverLocation: driverCurrentLocation,
        driverSequence: driverCheckpoint.sequence_order,
        shouldComplete: driverCheckpoint.sequence_order >= destinationCheckpoint.sequence_order
      });

      // If driver has reached or passed the passenger's destination, complete the trip
      if (driverCheckpoint.sequence_order >= destinationCheckpoint.sequence_order) {
        console.log('🏁 Driver has reached or passed destination - completing trip');
        
        // Trigger trip completion notification
        if (!notificationShown) {
          setNotificationShown(true);
          setTripStatus('completed');
          
          // Automatically complete the trip after a short delay
          setTimeout(() => {
            completeTrip();
          }, 1000);
        }
      } else {
        console.log('📍 Driver not at destination yet - continuing trip');
        console.log('📍 Driver sequence:', driverCheckpoint.sequence_order, 'Destination sequence:', destinationCheckpoint.sequence_order);
      }
    } catch (error) {
      console.error('Error checking trip completion:', error);
    }
  };

  const cancelTrip = async () => {
    Alert.alert(
      'Cancel Trip',
      'Are you sure you want to cancel this trip?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove active trip from storage
              await AsyncStorage.removeItem(ACTIVE_TRIP_KEY);
              setActiveTrip(null);
              setDriverLocation(null);
              setTripStatus('waiting');
              
              // TODO: Notify driver about cancellation
              Alert.alert('Trip Cancelled', 'Your trip has been cancelled.');
            } catch (error) {
              console.error('Error cancelling trip:', error);
              Alert.alert('Error', 'Failed to cancel trip. Please try again.');
            }
          }
        }
      ]
    );
  };

  const completeTrip = async () => {
    try {
      // Remove active trip from storage
      await AsyncStorage.removeItem(ACTIVE_TRIP_KEY);
      setActiveTrip(null);
      setDriverLocation(null);
      setTripStatus('waiting');
      setShowActiveTripView(false);
      onBackButtonPress?.(); // Notify parent to hide back button
      
      Alert.alert('Trip Completed', 'Thank you for using LakbAI!');
    } catch (error) {
      console.error('Error completing trip:', error);
    }
  };

  const hideActiveTripView = useCallback(() => {
    console.log('🔙 hideActiveTripView called - hiding active trip view');
    
    // Don't hide if component is not initialized yet
    if (!isInitialized) {
      console.log('⚠️ hideActiveTripView called before initialization - ignoring');
      return;
    }
    
    // Use setTimeout to defer the state update to avoid setState during render
    setTimeout(() => {
      setShowActiveTripView(false);
      onBackButtonPress?.(); // Notify parent to hide back button
      console.log('🔙 Active trip view hidden');
    }, 0);
  }, [onBackButtonPress, isInitialized]);

  const clearTripData = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(ACTIVE_TRIP_KEY);
      setActiveTrip(null);
      setShowActiveTripView(false);
      setDriverLocation(null);
      setTripStatus('waiting');
      onBackButtonPress?.(); // Notify parent to hide back button
      console.log('🧹 Trip data cleared successfully');
      Alert.alert('Trip Data Cleared', 'Old trip data has been cleared. You can now start a new trip.');
    } catch (error) {
      console.error('Error clearing trip data:', error);
      Alert.alert('Error', 'Failed to clear trip data. Please try again.');
    }
  }, [onBackButtonPress]);

  const clearAllTripData = useCallback(async () => {
    try {
      // Clear all possible trip-related storage keys
      await AsyncStorage.multiRemove([
        ACTIVE_TRIP_KEY,
        'selected_route',
        'driver_location',
        'trip_status',
        'active_trip',
        'trip_data'
      ]);
      setActiveTrip(null);
      setShowActiveTripView(false);
      setDriverLocation(null);
      setTripStatus('waiting');
      onBackButtonPress?.(); // Notify parent to hide back button
      console.log('🧹 All trip data cleared successfully');
      Alert.alert('All Trip Data Cleared', 'All trip-related data has been cleared. The app will restart fresh.');
    } catch (error) {
      console.error('Error clearing all trip data:', error);
      Alert.alert('Error', 'Failed to clear trip data. Please try again.');
    }
  }, [onBackButtonPress]);

  // Test function to simulate driver reaching destination
  const testTripCompletion = useCallback(async () => {
    if (!activeTrip) {
      Alert.alert('No Active Trip', 'No active trip to test completion with.');
      return;
    }
    
    console.log('🧪 Testing trip completion for destination:', activeTrip.destination);
    await checkTripCompletion(activeTrip.destination);
  }, [activeTrip]);

  // Store the hideActiveTripView function in a ref so parent can access it
  React.useEffect(() => {
    if (onHideActiveTripView && isInitialized) {
      console.log('🔙 Setting up hideActiveTripView callback');
      onHideActiveTripView(hideActiveTripView);
    }
  }, [onHideActiveTripView, hideActiveTripView, isInitialized]);

  // Prevent hideActiveTripView from being called during initial load
  React.useEffect(() => {
    // Mark as initialized after a longer delay to prevent immediate hiding
    const timer = setTimeout(() => {
      setIsInitialized(true);
      console.log('✅ HomeScreen initialized - hideActiveTripView can now be called');
    }, 2000); // Increased delay to 2 seconds
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    loadRoutes();
    checkForActiveTrip();
    setNotificationShown(false); // Reset notification flag
  }, []);

  // Listen for driver location updates
  useEffect(() => {
    if (activeTrip && routes && routes.length > 0) {
      console.log('📍 Setting up driver location interval - activeTrip:', !!activeTrip, 'routes count:', routes.length);
      const interval = setInterval(() => {
        updateDriverLocation();
      }, 3000); // Update every 3 seconds
      
      return () => clearInterval(interval);
    } else {
      console.log('📍 Not setting up driver location interval - activeTrip:', !!activeTrip, 'routes count:', routes?.length || 0);
    }
  }, [activeTrip, routes]);

  // Listen for driver QR scan notifications
  useEffect(() => {
    if (activeTrip) {
      let cleanup: (() => void) | undefined;
      
      tripNotificationService.listenForDriverNotifications(
        activeTrip.id,
        (notification: TripNotification) => {
          console.log('🔔 Received driver notification:', notification);
          
          if (notification.type === 'driver_at_destination' && !notificationShown) {
            // Driver has reached the destination - automatically complete the trip
            setNotificationShown(true);
            setTripStatus('completed');
            
            // Automatically complete the trip after a short delay
            setTimeout(() => {
              completeTrip();
            }, 1000);
          }
        }
      ).then((cleanupFn) => {
        cleanup = cleanupFn;
      });

      return () => {
        if (cleanup) {
          cleanup();
        }
      };
    }
  }, [activeTrip]);

  // Auto-refresh routes every 30 seconds to get updated fare information
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing routes...');
      loadRoutes();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Removed empty useFocusEffect that wasn't doing anything

  const handleMyTrip = useCallback(() => {
    console.log('🎯 My Trip button pressed - activeTrip:', activeTrip);
    if (activeTrip) {
      // Show the active trip view
      setShowActiveTripView(true);
      // Use setTimeout to defer the callback to avoid setState during render
      setTimeout(() => {
        onShowBackButton?.(); // Notify parent to show back button
      }, 0);
      console.log('🎯 My Trip button pressed - showing active trip view');
    } else {
      // Show a message that there's no active trip
      console.log('🎯 No active trip found - showing alert');
      Alert.alert(
        'No Active Trip',
        'You don\'t have any active trips at the moment. Scan a QR code to start a new trip.',
        [
          { text: 'OK', style: 'default' },
          { text: 'Scan QR', style: 'default', onPress: () => router.push('/passenger/scanner' as Href) }
        ],
        { cancelable: true }
      );
    }
  }, [activeTrip, router, onShowBackButton]);

  const gridItems: Array<{
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    color: string;
    borderColor: string;
    route?: PassengerRouteHref;
    onPress?: () => void;
  }> = [
    {
      icon: 'qr-code',
      title: 'Scan QR Code',
      subtitle: isAuthenticated ? 'Get fare info' : 'Login required',
      color: COLORS.primary,
      borderColor: COLORS.primaryLight,
      onPress: () => {
        if (!isAuthenticated) {
          Alert.alert(
            'Login required',
            'Please log in first to use Scan QR Code.',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/'),
              },
            ],
            { cancelable: false }
          );
          return;
        }
        router.push(PassengerRoutes.SCANNER as Href);
      }
    },
    {
      icon: 'chatbubble',
      title: 'BiyaBot',
      subtitle: isAuthenticated ? 'Ask questions' : 'Login required',
      color: COLORS.success,
      borderColor: COLORS.successBiya,
      onPress: () => {
        if (!isAuthenticated) {
          Alert.alert(
            'Restricted',
            'Please log in to use BiyaBot.',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/'),
              },
            ],
            { cancelable: false }
          );
          return;
        }
        router.push(PassengerRoutes.CHAT as Href);
      }
    },
    {
      icon: 'calculator',
      title: 'Fare Calculator',
      subtitle: 'Calculate fares',
      color: COLORS.orange,
      borderColor: COLORS.orangeLight,
      route: PassengerRoutes.FARE
    },
    {
      icon: 'map',
      title: 'Routes & Fares',
      subtitle: 'View all fares',
      color: COLORS.purple,
      borderColor: COLORS.purpleLight,
      route: PassengerRoutes.ROUTE
    },
    {
      icon: 'car',
      title: 'My Trip',
      subtitle: activeTrip ? 'View current trip' : 'No active trip',
      color: activeTrip ? COLORS.success : COLORS.gray600,
      borderColor: activeTrip ? COLORS.successLight : COLORS.gray300,
      onPress: handleMyTrip
    },
    {
      icon: 'person',
      title: 'My Profile',
      subtitle: 'Account & settings',
      color: COLORS.gray600,
      borderColor: COLORS.gray300,
      route: PassengerRoutes.PROFILE
    }
  ];

  // Show active trip view if there's an active trip and it should be shown
  if (activeTrip && showActiveTripView) {
    return (
      <ScrollView style={globalStyles.container} showsVerticalScrollIndicator={false}>
        {/* Modern Active Trip Content */}
        <View style={styles.modernActiveTripContent}>
          <View style={styles.tripStatusIndicator}>
            <View style={[
              styles.statusDot, 
              { backgroundColor: tripStatus === 'completed' ? COLORS.success : COLORS.primary }
            ]} />
            <Text style={styles.tripStatusText}>
              {tripStatus === 'waiting' ? 'Trip Booked' : 
               tripStatus === 'in_progress' ? 'In Progress' : 'Trip Completed'}
            </Text>
          </View>
          
          <View style={styles.tripDriverInfo}>
            <View style={styles.driverAvatar}>
              <Ionicons name="person" size={20} color={COLORS.white} />
            </View>
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>{activeTrip.driverName}</Text>
              <Text style={styles.jeepneyNumber}>{activeTrip.jeepneyNumber}</Text>
            </View>
          </View>
          
        </View>
        
        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={mapRegion}
            showsUserLocation={true}
            showsMyLocationButton={true}
            provider={Platform.OS === 'ios' ? undefined : 'google'}
            mapType="standard"
          >
            {/* Driver Location */}
            {driverLocation && (
              <Marker
                coordinate={driverLocation.coordinates}
                title="Your Driver"
                description={`${activeTrip.driverName} - ${activeTrip.jeepneyNumber}`}
                pinColor="blue"
              />
            )}
            
            {/* Pickup Location - only show if trip is not completed */}
            {tripStatus !== 'completed' && (
              <Marker
                coordinate={activeTrip.pickupCoordinates}
                title="Pickup"
                description={activeTrip.pickupLocation}
                pinColor="green"
              />
            )}
            
            {/* Destination - only show if trip is not completed */}
            {tripStatus !== 'completed' && (
              <Marker
                coordinate={activeTrip.destinationCoordinates}
                title="Destination"
                description={activeTrip.destination}
                pinColor="red"
              />
            )}
            
            {/* Route - only show if trip is not completed */}
            {tripStatus !== 'completed' && activeTrip.routeCoordinates && activeTrip.routeCoordinates.length > 0 && (
              <Polyline
                coordinates={activeTrip.routeCoordinates}
                strokeColor="#0000FF"
                strokeWidth={3}
              />
            )}
          </MapView>
        </View>
        
        {/* Modern Trip Info */}
        <View style={styles.modernTripInfo}>
          <View style={styles.routeCard}>
            <View style={styles.routeHeader}>
              <Ionicons name="location" size={16} color={COLORS.primary} />
              <Text style={styles.routeTitle}>Your Route</Text>
            </View>
            <View style={styles.routeDetails}>
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, { backgroundColor: COLORS.success }]} />
                <Text style={styles.routePointText}>{activeTrip.pickupLocation}</Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, { backgroundColor: COLORS.warning }]} />
                <Text style={styles.routePointText}>{activeTrip.destination}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.fareCard}>
            <View style={styles.fareHeader}>
              <Ionicons name="card" size={16} color={COLORS.primary} />
              <Text style={styles.fareTitle}>Trip Fare</Text>
            </View>
            <Text style={styles.fareAmount}>₱{activeTrip.fare.toFixed(2)}</Text>
          </View>
          
          {driverLocation && (
            <View style={styles.driverLocationCard}>
              <View style={styles.driverLocationHeader}>
                <Ionicons name="car" size={16} color={COLORS.primary} />
                <Text style={styles.driverLocationTitle}>Driver Location</Text>
              </View>
              <Text style={styles.driverLocationText}>{driverLocation.checkpoint_name}</Text>
            </View>
          )}
          
          {/* Clear Trip Data Button - for troubleshooting */}
          <TouchableOpacity 
            style={styles.clearTripButton} 
            onPress={() => {
              Alert.alert(
                'Clear Trip Data',
                'This will clear the current trip data. Are you sure?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Clear', style: 'destructive', onPress: clearTripData }
                ]
              );
            }}
          >
            <Ionicons name="trash-outline" size={16} color={COLORS.warning} />
            <Text style={styles.clearTripButtonText}>Clear Trip Data</Text>
          </TouchableOpacity>
          
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={globalStyles.container} showsVerticalScrollIndicator={false}>
      {/* Location Notifications */}
      <LocationNotificationDisplay routeId={selectedRoute?.id?.toString() || '1'} />
      
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Welcome to LakbAI</Text>
        <Text style={styles.headerSubtitle}>Your smart jeepney companion</Text>
      </View>

      {/* Main Grid Actions */}
      <View style={styles.gridContainer}>
        {gridItems.map((item, index) => (
          <GridItem
            key={index}
            icon={item.icon}
            title={item.title}
            subtitle={item.subtitle}
            color={item.color}
            borderColor={item.borderColor}
            onPress={item.onPress || (() => router.push(item.route as Href))}
          />
        ))}
      </View>

      {/* Compact Route Selector */}
      {isAuthenticated && selectedRoute && (
        <View style={styles.compactRouteSelector}>
          <View style={styles.compactRouteInfo}>
            <View style={styles.compactRouteText}>
              <Text style={styles.compactRouteName} numberOfLines={1}>
                {selectedRoute.route_name}
              </Text>
              <Text style={styles.compactRouteDetails} numberOfLines={1}>
                Base fare: ₱{selectedRoute.fare_base || '13.00'} • Tap to change route
              </Text>
            </View>
            <View style={styles.compactRouteActions}>
              <Text style={styles.compactRouteFare}>
                ₱{selectedRoute.fare_base || '13.00'}
              </Text>
              <TouchableOpacity 
                style={styles.compactRouteButton}
                onPress={() => {
                  console.log('🛣️ Opening route modal, current routes:', routes);
                  setShowRouteModal(true);
                }}
              >
                <Ionicons name="swap-horizontal" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Driver Location Tracking */}
      {isAuthenticated && selectedRoute && (
        <View style={styles.driverLocationSection}>
          <DriverLocationCard routeId={selectedRoute.id.toString()} />
        </View>
      )}

      {/* Quick Tips Section */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsText}>
          💡 Scan QR codes inside jeepneys for instant fare info and track driver locations in real-time.
        </Text>
      </View>

      {/* Debug: Clear Trip Data Button */}
      {activeTrip && (
        <TouchableOpacity 
          style={styles.debugClearButton} 
          onPress={() => {
            Alert.alert(
              'Clear All Trip Data',
              'This will clear all trip data and reset the app. Are you sure?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear All', style: 'destructive', onPress: clearAllTripData }
              ]
            );
          }}
        >
          <Ionicons name="trash-outline" size={16} color={COLORS.warning} />
          <Text style={styles.debugClearButtonText}>Clear All Trip Data (Debug)</Text>
        </TouchableOpacity>
      )}

      {activeTrip && ( // Test button for trip completion
        <TouchableOpacity 
          style={styles.debugClearButton} 
          onPress={() => {
            Alert.alert(
              'Test Trip Completion',
              'This will simulate the driver reaching the destination. Are you sure?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Test', style: 'default', onPress: testTripCompletion }
              ]
            );
          }}
        >
          <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.success} />
          <Text style={styles.debugClearButtonText}>Test Trip Completion (Debug)</Text>
        </TouchableOpacity>
      )}

      {/* Route Selection Modal */}
      <Modal
        visible={showRouteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRouteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Route</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowRouteModal(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.gray600} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.routesList}>
              {loadingRoutes ? (
                <Text style={styles.loadingText}>Loading routes...</Text>
              ) : routes.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No routes available</Text>
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={loadRoutes}
                  >
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                routes.map((route) => (
                  <TouchableOpacity
                    key={route.id}
                    style={[
                      styles.routeItem,
                      selectedRoute?.id === route.id && styles.selectedRouteItem
                    ]}
                    onPress={async () => {
                      console.log('🛣️ Route selected:', route);
                      setSelectedRoute(route);
                      await saveSelectedRoute(route);
                      setShowRouteModal(false);
                    }}
                  >
                    <View style={styles.routeItemContent}>
                      <Text style={styles.routeItemName}>{route.route_name}</Text>
                      <Text style={styles.routeItemDetails}>
                        {route.origin} → {route.destination}
                      </Text>
                      <Text style={styles.routeItemFare}>₱{route.fare_base || '8.00'}</Text>
                    </View>
                    {selectedRoute?.id === route.id && (
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default HomeScreen;