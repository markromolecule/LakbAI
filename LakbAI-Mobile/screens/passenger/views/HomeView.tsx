// screens/passenger/views/HomeScreen.tsx
import React, { useCallback, useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert, Modal, Platform, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { PassengerRoutes, PassengerRouteHref } from '../../../routes/PassengerRoutes';
import { COLORS, SPACING } from '../../../shared/styles';
import { globalStyles } from '../../../shared/styles/globalStyles';
import { useAuthContext } from '../../../shared/providers/AuthProvider';
import { LocationNotificationDisplay } from '../../../components/passenger/LocationNotificationDisplay';
import { googleMapsService, Coordinates } from '../../../shared/services/googleMapsService';
import { tripNotificationService, TripNotification } from '../../../shared/services/tripNotificationService';
import { simpleTripNotificationService } from '../../../shared/services/simpleTripNotificationService';
import { fareMatrixService } from '../../../shared/services/fareMatrixService';
import { localNotificationService } from '../../../shared/services/localNotificationService';
import { tripBookingService } from '../../../shared/services/tripBookingService';
import WebSocketInitializer from '../../../shared/services/webSocketInitializer';
import sessionManager from '../../../shared/services/sessionManager';
import styles from '../styles/HomeScreen.styles';
import DriverLocationCard from '../components/DriverLocationCard';
import { getBaseUrl } from '../../../config/apiConfig';
import { usePassengerState } from '../hooks/usePassengerState';
import type { Href } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';


// AsyncStorage keys
const SELECTED_ROUTE_KEY = 'selected_route';
const ACTIVE_TRIP_KEY = 'active_trip';

// Local type definition for route search results
interface RouteSearchResult {
  id: number;
  route_name: string;
  origin: string;
  destination: string;
  status: string;
  created_at: string;
  checkpoint_count: number;
  fare_base?: string;
}

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
  const { passengerProfile } = usePassengerState();
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
  const [isCompletingTrip, setIsCompletingTrip] = useState(false);
  const [lastNotificationTime, setLastNotificationTime] = useState<number>(0);
  const [tripCompletionTriggered, setTripCompletionTriggered] = useState(false);

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
          setTripCompletionTriggered(false); // Reset completion flag for new trip
          
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
          
          // Check if trip should be completed when driver location updates
          // Disabled to prevent duplicate trip completion - handled by notification system
          // await checkTripCompletion(driverLocation.current_location);
          console.log('📍 Driver location updated:', driverLocation.current_location);
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

      // Check if driver has reached the passenger's destination
      // For endpoint destinations, use exact name matching as primary check
      const isExactDestinationMatch = driverCurrentLocation === activeTrip.destination;
      const hasReachedOrPassedDestination = driverCheckpoint.sequence_order >= destinationCheckpoint.sequence_order;
      
      console.log('🔍 Destination matching analysis:', {
        exactMatch: isExactDestinationMatch,
        sequenceMatch: hasReachedOrPassedDestination,
        driverLocation: driverCurrentLocation,
        passengerDestination: activeTrip.destination,
        driverSequence: driverCheckpoint.sequence_order,
        destinationSequence: destinationCheckpoint.sequence_order
      });
      
      // Complete trip if driver is at exact destination OR has reached/passed it in sequence
      if (isExactDestinationMatch || hasReachedOrPassedDestination) {
        console.log('🏁 Driver has reached destination - completing trip');
        console.log('🏁 Match type:', isExactDestinationMatch ? 'exact name match' : 'sequence order match');
        
        // Only trigger trip completion if not already shown and not already completing
        if (!notificationShown && !isCompletingTrip && !tripCompletionTriggered) {
          setNotificationShown(true);
          setTripStatus('completed');
          setTripCompletionTriggered(true);
          
          // Show loading screen immediately
          setIsCompletingTrip(true);
          console.log('🔄 Loading screen triggered for trip completion');
          
          // Automatically complete the trip after a short delay
          setTimeout(() => {
            console.log('🏁 Calling completeTrip() with isAutoComplete=true');
            completeTrip(true); // Explicitly pass true for automatic completion
          }, 1000);
        } else {
          console.log('🔄 Trip completion already in progress or already shown');
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
              // Use completeTrip with isAutoComplete=false to avoid thank you message
              await completeTrip(false);
              
              // Show cancellation message instead
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


  const completeTrip = async (isAutoComplete: boolean = true) => {
    try {
      console.log('🔄 completeTrip called with isAutoComplete:', isAutoComplete);
      console.log('🔄 Current isCompletingTrip state:', isCompletingTrip);
      console.log('🔄 Current tripCompletionTriggered state:', tripCompletionTriggered);
      
      // Prevent duplicate completions
      if (tripCompletionTriggered || isCompletingTrip) {
        console.log('🔄 Trip completion already in progress or completed, ignoring duplicate call');
        return;
      }
      
      // Mark as triggered immediately to prevent duplicates
      setTripCompletionTriggered(true);
      
      // Show loading screen for automatic completion
      if (isAutoComplete) {
        console.log('🔄 Setting isCompletingTrip to true for loading screen');
        setIsCompletingTrip(true);
        console.log('🔄 Starting trip completion process...');
        
        // Show completion screen for longer duration (4 seconds)
        await new Promise(resolve => setTimeout(resolve, 4000));
      }

      // Remove active trip from storage
      await AsyncStorage.removeItem(ACTIVE_TRIP_KEY);
      setActiveTrip(null);
      // Don't clear driver location - driver might still be on route serving other passengers
      // setDriverLocation(null);
      setTripStatus('waiting');
      setShowActiveTripView(false);
      setIsCompletingTrip(false); // Hide loading screen
      onBackButtonPress?.(); // Notify parent to hide back button
      
      // Only show thank you message for automatic completion (when driver reaches destination)
      if (isAutoComplete) {
        console.log('✅ Trip completion process finished, showing thank you alert');
        // Add a small delay after hiding loading to ensure smooth transition
        setTimeout(() => {
          Alert.alert('You have reached your destination.', 'Thank you for using LakbAI!');
        }, 500);
      }
      
      // Reset completion trigger flag
      setTripCompletionTriggered(false);
    } catch (error) {
      console.error('Error completing trip:', error);
      setIsCompletingTrip(false); // Make sure to hide loading on error
      setTripCompletionTriggered(false); // Reset on error
    }
  };

  // Debug function to clear all trip data
  const clearAllTripData = async () => {
    try {
      Alert.alert(
        'Clear Trip Data',
        'This will clear all active trip data. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear',
            style: 'destructive',
            onPress: async () => {
              try {
                // Clear trips from API
                console.log('🧹 Clearing trips from API...');
                const clearResult = await tripBookingService.clearActiveTrips(21); // TODO: Get from auth
                console.log('API clear result:', clearResult);
              } catch (error) {
                console.error('❌ Error clearing trips from API:', error);
              }

              // Clear AsyncStorage
              await AsyncStorage.multiRemove([
                ACTIVE_TRIP_KEY,
                SELECTED_ROUTE_KEY,
                'trip_notifications',
                'driver_locations',
                'passenger_trips'
              ]);
              
              // Reset state
              setActiveTrip(null);
              setShowActiveTripView(false);
              setTripStatus('waiting');
              setDriverLocation(null);
              
              console.log('🧹 All trip data cleared');
              Alert.alert('Success', 'All trip data has been cleared');
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Error clearing trip data:', error);
      Alert.alert('Error', 'Failed to clear trip data');
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

  // Initialize WebSocket when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔌 User authenticated, initializing WebSocket...');
      initializeWebSocket();
    } else {
      console.log('🔌 User not authenticated, disconnecting WebSocket...');
      WebSocketInitializer.disconnect();
    }
  }, [isAuthenticated]);

  // Initialize WebSocket connection
  const initializeWebSocket = async () => {
    try {
      console.log('🔌 Starting WebSocket initialization...');
      
      // Check if user is authenticated first
      if (!isAuthenticated) {
        console.log('⚠️ User not authenticated, skipping WebSocket initialization');
        return;
      }
      
      // Check session
      const session = await sessionManager.getUserSession();
      if (!session) {
        console.log('⚠️ No user session found, skipping WebSocket initialization');
        return;
      }
      
      console.log('🔍 User session found:', {
        userId: session.userId,
        userType: session.userType,
        isAuthenticated
      });
      
      const wsConnected = await WebSocketInitializer.initialize();
      if (wsConnected) {
        console.log('✅ WebSocket connected - real-time trip notifications enabled');
      } else {
        console.log('⚠️ WebSocket connection failed - using fallback polling');
        console.log('🔍 WebSocket status:', WebSocketInitializer.getStatus());
      }
    } catch (error) {
      console.error('❌ Error initializing WebSocket:', error);
      console.log('🔍 WebSocket status after error:', WebSocketInitializer.getStatus());
    }
  };

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

  // Check for trip completion events from location tracking service
  useEffect(() => {
    if (activeTrip) {
      const checkForCompletionEvents = async () => {
        try {
          const eventData = await AsyncStorage.getItem('trip_completion_event');
          if (eventData) {
            const event = JSON.parse(eventData);
            if (!event.processed) {
              console.log('🎯 Processing trip completion event:', event);
              
              // Mark event as processed
              event.processed = true;
              await AsyncStorage.setItem('trip_completion_event', JSON.stringify(event));
              
              // Trigger trip completion with loading screen - DISABLED to prevent duplicates
              // if (!notificationShown) {
              //   setNotificationShown(true);
              //   setTripStatus('completed');
              //   
              //   setTimeout(() => {
              //     completeTrip(); // This will show the loading screen
              //   }, 500);
              // }
            }
          }
        } catch (error) {
          console.error('Error checking for completion events:', error);
        }
      };

      // Check for completion events every 2 seconds
      const completionInterval = setInterval(checkForCompletionEvents, 2000);
      
      return () => clearInterval(completionInterval);
    }
  }, [activeTrip, notificationShown]);

  // Listen for WebSocket trip completion notifications
  useEffect(() => {
    if (isAuthenticated && activeTrip) {
      console.log('🔌 Setting up trip notifications for trip ID:', activeTrip.id);
      
      // Add general WebSocket event listener for debugging
      const { webSocketService } = require('../../../shared/services/webSocketService');
      console.log('🔌 WebSocket connection status:', webSocketService.isSocketConnected());
      webSocketService.on('trip-completed', (data: any) => {
        console.log('🔔 GENERAL WebSocket trip-completed event received:', data);
      });
      
      const setupTripNotifications = async () => {
        const cleanup = await tripNotificationService.listenForDriverNotifications(
          activeTrip.id,
          (notification) => {
            console.log('🔔 Received trip notification:', notification);
            console.log('🔔 Notification type:', notification.type);
            console.log('🔔 Active trip ID:', activeTrip.id);
            
            if (notification.type === 'trip_completed') {
              console.log('✅ Trip completion notification received via WebSocket');
              console.log('✅ Trip ID match:', notification.tripId === activeTrip.id);
              
              // Only trigger if not already completing
              if (!tripCompletionTriggered && !isCompletingTrip) {
                setTripStatus('completed');
                setTripCompletionTriggered(true);
                
                // Complete the trip and close the view
                setTimeout(() => {
                  console.log('🔄 Calling completeTrip() from WebSocket notification');
                  completeTrip();
                }, 1000);
              } else {
                console.log('🔄 Trip completion already triggered, ignoring WebSocket notification');
              }
            } else if (notification.type === 'location_update') {
              console.log('📍 Location update notification received (trip-specific) - DISABLED to prevent duplicates');
              // DISABLED: Trip-specific location notifications to prevent duplicates with general listener
              // The general WebSocket listener already handles all location updates
            } else {
              console.log('🔔 Other notification type received:', notification.type);
            }
          }
        );
        return cleanup;
      };

      let cleanupPromise: Promise<(() => void) | undefined>;
      cleanupPromise = setupTripNotifications();

      return () => {
        cleanupPromise.then(cleanup => {
          if (cleanup && typeof cleanup === 'function') {
            cleanup();
          }
        });
      };
    }
  }, [isAuthenticated, activeTrip]);

  // Listen for general location update notifications (for all passengers)
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔌 Setting up general location update listener...');
      
      // Set up WebSocket listener for all driver location updates
      const { webSocketService } = require('../../../shared/services/webSocketService');
      
      const handleDriverLocationUpdate = (data: any) => {
        console.log('🔔 Received general driver location update:', data);
        
        // Update driver location in UI
        if (data && data.location) {
          setDriverLocation({
            checkpoint_name: data.location,
            coordinates: data.coordinates || { latitude: 0, longitude: 0 },
            lastUpdate: data.timestamp || new Date().toISOString(),
            status: 'active'
          });
          
          // Show Expo notification (with debouncing)
          const now = Date.now();
          const timeSinceLastNotification = now - (lastNotificationTime || 0);
          
          if (timeSinceLastNotification > 3000) { // 3 seconds debounce
            setLastNotificationTime(now);
            
            // Determine notification type and content based on data
            let title = 'Jeepney Location Update';
            let body = `Driver is now at ${data.location}`;
            
            // Check for special notification types
            if (data.is_origin || data.notification_priority === 'high') {
              title = '🚀 Driver Started Shift';
              body = `Driver ${data.jeepneyNumber || 'Unknown'} has started the route from ${data.location}`;
            } else if (data.is_endpoint) {
              title = '🏁 Route Endpoint Reached';
              body = `Driver ${data.jeepneyNumber || 'Unknown'} has reached the endpoint at ${data.location}`;
            }
            
            // Send proper Expo notification
            localNotificationService.notifyLocationUpdate({
              type: 'location_update',
              driverId: data.driverId || 'unknown',
              driverName: data.driverName || 'Driver',
              jeepneyNumber: data.jeepneyNumber || 'Unknown',
              route: data.routeId || '1',
              currentLocation: data.location,
              previousLocation: undefined,
              coordinates: data.coordinates,
              title: title,
              body: body,
              data: {
                driverId: data.driverId,
                driverName: data.driverName,
                jeepneyNumber: data.jeepneyNumber,
                route: data.routeId,
                currentLocation: data.location,
                timestamp: data.timestamp,
                type: 'general_location_update',
                is_origin: data.is_origin,
                is_endpoint: data.is_endpoint,
                notification_priority: data.notification_priority
              }
            }).catch(error => {
              console.error('❌ Failed to send location notification:', error);
            });
          } else {
            console.log('🔇 Location notification debounced - too soon since last notification');
          }
        }
      };
      
      // Add WebSocket listener
      webSocketService.on('driver-location-update', handleDriverLocationUpdate);
      
      return () => {
        console.log('🔌 Cleaning up general location update listener...');
        webSocketService.off('driver-location-update', handleDriverLocationUpdate);
      };
    }
  }, [isAuthenticated, lastNotificationTime]);

  // Listen for driver QR scan notifications (backup method)
  useEffect(() => {
    if (activeTrip) {
      let cleanup: (() => void) | undefined;
      let simpleCleanup: (() => void) | undefined;
      
      const handleTripCompletion = (notification: any) => {
        console.log('🔔 Received notification:', notification);
        
        // DISABLED to prevent duplicate completions - handled by location-based completion
        // if (notification.type === 'driver_at_destination' && !notificationShown) {
        //   // Driver has reached the destination - automatically complete the trip
        //   setNotificationShown(true);
        //   setTripStatus('completed');
        //   setIsCompletingTrip(true);
        //   
        //   // Automatically complete the trip after a short delay
        //   setTimeout(() => {
        //     completeTrip(true);
        //   }, 1000);
        // }
        // Location update and endpoint notifications are now handled by the general notification handler above
      };

      // Try the main notification service first
      tripNotificationService.listenForDriverNotifications(
        activeTrip.id,
        handleTripCompletion
      ).then((cleanupFn) => {
        cleanup = cleanupFn;
      }).catch((error) => {
        console.warn('⚠️ Main notification service failed, using simple fallback:', error);
      });

      // Also set up simple notification service as fallback
      simpleTripNotificationService.listenForDriverNotifications(
        activeTrip.id,
        handleTripCompletion
      ).then((cleanupFn) => {
        simpleCleanup = cleanupFn;
      }).catch((error) => {
        console.warn('⚠️ Simple notification service failed:', error);
      });

      return () => {
        if (cleanup) {
          cleanup();
        }
        if (simpleCleanup) {
          simpleCleanup();
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


  // Background location updates for trip completion (works even in My Trip section)
  useEffect(() => {
    if (!activeTrip || !routes.length) return;

    const interval = setInterval(async () => {
      try {
        // Get current route
        const currentRoute = routes.find(r => r.route_name === activeTrip.route);
        if (!currentRoute) return;

        console.log('🔄 Background location update check for trip:', activeTrip.id);

        // Fetch driver location updates
        const response = await fetch(`${getBaseUrl()}/mobile/passenger/real-time-drivers/${currentRoute.id}`);
        const data = await response.json();
        
        if (data.status === 'success' && data.driver_locations) {
          const driverLocation = data.driver_locations.find((driver: any) => driver.driver_id === activeTrip.driverId);
          
          if (driverLocation) {
            console.log('🔄 Background update - driver location:', driverLocation.current_location);
            
            setDriverLocation({
              checkpoint_name: driverLocation.current_location,
              coordinates: { latitude: 0, longitude: 0 },
              lastUpdate: driverLocation.last_updated,
              status: 'active'
            });
            
            // Check trip completion regardless of which view the user is on
            // Disabled to prevent duplicate trip completion - handled by notification system
            // await checkTripCompletion(driverLocation.current_location);
          }
        }
      } catch (error) {
        console.error('Error in background location update:', error);
      }
    }, 8000); // Check every 8 seconds to avoid conflicts with notification polling

    return () => clearInterval(interval);
  }, [activeTrip, routes]);

  // Listen for trip completion events from LocationTrackingService
  useEffect(() => {
    const handleTripCompletion = () => {
      console.log('🏁 Trip completion event received from LocationTrackingService');
      if (activeTrip) {
        setTripStatus('completed');
        setIsCompletingTrip(true);
        
        // DISABLED to prevent duplicate completions - handled by location-based completion
        // setTimeout(() => {
        //   console.log('🏁 Auto-completing trip from LocationTrackingService event');
        //   completeTrip(true);
        // }, 1000);
      }
    };

    // Listen for the custom event (for React Native, we'll use a different approach)
    // In React Native, we'll use AsyncStorage to trigger events
    const checkForTripCompletionEvent = async () => {
      try {
        const tripCompletionEvent = await AsyncStorage.getItem('trip_completion_event');
        if (tripCompletionEvent === 'triggered') {
          await AsyncStorage.removeItem('trip_completion_event');
          handleTripCompletion();
        }
      } catch (error) {
        console.error('Error checking trip completion event:', error);
      }
    };

    const interval = setInterval(checkForTripCompletionEvent, 1000);

    return () => clearInterval(interval);
  }, [activeTrip]);

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

      {/* Debug Button - Only show in development */}
      {__DEV__ && (
        <View style={styles.debugSection}>
          <TouchableOpacity 
            style={styles.debugButton} 
            onPress={clearAllTripData}
          >
            <Ionicons name="trash" size={16} color="#fff" />
            <Text style={styles.debugButtonText}>Clear Trip Data (Debug)</Text>
          </TouchableOpacity>
        </View>
      )}

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
                Base fare: ₱{selectedRoute.fare_base || '13.00'}
                {passengerProfile?.fareDiscount?.status === 'approved' && 
                  ` • ${passengerProfile.fareDiscount.percentage || 20}% discount applied`
                } • Tap to change route
              </Text>
            </View>
            <View style={styles.compactRouteActions}>
              <Text style={styles.compactRouteFare}>
                ₱{
                  passengerProfile?.fareDiscount?.status === 'approved' 
                    ? ((Number(selectedRoute.fare_base) || 13) * (1 - (passengerProfile.fareDiscount.percentage || 20) / 100)).toFixed(2)
                    : (selectedRoute.fare_base || '13.00')
                }
              </Text>
              {passengerProfile?.fareDiscount?.status === 'approved' && (
                <Text style={styles.originalFare}>
                  ₱{selectedRoute.fare_base || '13.00'}
                </Text>
              )}
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
      {isAuthenticated && (selectedRoute || activeTrip) && (
        <View style={styles.driverLocationSection}>
          <DriverLocationCard 
            routeId={activeTrip ? routes.find(r => r.route_name === activeTrip.route)?.id.toString() || '1' : selectedRoute?.id.toString() || '1'} 
          />
        </View>
      )}

      {/* Quick Tips Section */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsText}>
          💡 Scan QR codes inside jeepneys for instant fare info and track driver locations in real-time.
        </Text>
      </View>



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

      {/* Trip Completion Loading Overlay */}
      {isCompletingTrip && (
        <View style={styles.tripCompletionOverlay}>
          <View style={styles.tripCompletionContent}>
            <Ionicons 
              name="checkmark-circle" 
              size={80} 
              color={COLORS.success} 
            />
            <Text style={styles.tripCompletionTitle}>Trip Completed!</Text>
            <Text style={styles.tripCompletionSubtitle}>
              Your journey has been completed successfully
            </Text>
            <ActivityIndicator 
              size="large" 
              color={COLORS.primary} 
              style={{ marginTop: SPACING.lg }} 
            />
          </View>
        </View>
      )}
      
    </ScrollView>
  );
};

export default HomeScreen;