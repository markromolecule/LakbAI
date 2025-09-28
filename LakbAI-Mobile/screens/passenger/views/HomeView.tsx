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
import styles from '../styles/HomeScreen.styles';
import DriverLocationCard from '../components/DriverLocationCard';
import { getBaseUrl } from '../../../config/apiConfig';
import { searchService, RouteSearchResult } from '../../../shared/services/searchService';
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
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([]);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [routeSearchQuery, setRouteSearchQuery] = useState<string>('');
  const [routeSearchResults, setRouteSearchResults] = useState<RouteSearchResult[]>([]);
  const [isSearchingRoutes, setIsSearchingRoutes] = useState<boolean>(false);
  
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
          setFilteredRoutes(data.routes);
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

  const handleRouteSearch = async (query: string) => {
    setRouteSearchQuery(query);
    
    if (query.trim() === '') {
      setFilteredRoutes(routes);
      setRouteSearchResults([]);
      return;
    }

    // First try local filtering for immediate results
    const localFiltered = routes.filter(route => {
      const nameMatch = route.route_name.toLowerCase().includes(query.toLowerCase());
      const originMatch = route.origin.toLowerCase().includes(query.toLowerCase());
      const destinationMatch = route.destination.toLowerCase().includes(query.toLowerCase());
      const fareMatch = route.fare_base?.toString().includes(query);
      
      return nameMatch || originMatch || destinationMatch || fareMatch;
    });
    
    setFilteredRoutes(localFiltered);

    // Then search the database for more comprehensive results
    if (query.length >= 2) { // Only search database for queries with 2+ characters
      setIsSearchingRoutes(true);
      try {
        // For now, simulate database search with expanded route data
        // This will be replaced with actual API call once the backend is fixed
        const expandedResults = await simulateRouteDatabaseSearch(query);
        setRouteSearchResults(expandedResults);
        console.log('🔍 Simulated database route search found:', expandedResults.length, 'results');
      } catch (error) {
        console.error('❌ Database route search error:', error);
        setRouteSearchResults([]);
      } finally {
        setIsSearchingRoutes(false);
      }
    }
  };

  const clearRouteSearch = () => {
    setRouteSearchQuery('');
    setFilteredRoutes(routes);
    setRouteSearchResults([]);
  };

  // Simulate database search with comprehensive route data
  const simulateRouteDatabaseSearch = async (query: string): Promise<RouteSearchResult[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create comprehensive route data that would come from database
    const comprehensiveRoutes: RouteSearchResult[] = [
      { id: 1, route_name: 'SM Epza → SM Dasmariñas', origin: 'SM Epza', destination: 'SM Dasmariñas', status: 'active', created_at: '2024-01-01', checkpoint_count: 17 },
      { id: 2, route_name: 'SM Dasmariñas → SM Epza', origin: 'SM Dasmariñas', destination: 'SM Epza', status: 'active', created_at: '2024-01-01', checkpoint_count: 17 },
      { id: 3, route_name: 'Lancaster New City → SM Dasmariñas', origin: 'Lancaster New City', destination: 'SM Dasmariñas', status: 'active', created_at: '2024-01-01', checkpoint_count: 8 },
      { id: 4, route_name: 'SM Dasmariñas → Lancaster New City', origin: 'SM Dasmariñas', destination: 'Lancaster New City', status: 'active', created_at: '2024-01-01', checkpoint_count: 8 },
      { id: 5, route_name: 'Robinson Tejero → SM Epza', origin: 'Robinson Tejero', destination: 'SM Epza', status: 'active', created_at: '2024-01-01', checkpoint_count: 5 },
      { id: 6, route_name: 'SM Epza → Robinson Tejero', origin: 'SM Epza', destination: 'Robinson Tejero', status: 'active', created_at: '2024-01-01', checkpoint_count: 5 },
      { id: 7, route_name: 'Riverside → Lancaster New City', origin: 'Riverside', destination: 'Lancaster New City', status: 'active', created_at: '2024-01-01', checkpoint_count: 3 },
      { id: 8, route_name: 'Lancaster New City → Riverside', origin: 'Lancaster New City', destination: 'Riverside', status: 'active', created_at: '2024-01-01', checkpoint_count: 3 },
    ];
    
    // Filter the comprehensive data based on query
    const filtered = comprehensiveRoutes.filter(route => {
      const nameMatch = route.route_name.toLowerCase().includes(query.toLowerCase());
      const originMatch = route.origin.toLowerCase().includes(query.toLowerCase());
      const destinationMatch = route.destination.toLowerCase().includes(query.toLowerCase());
      
      return nameMatch || originMatch || destinationMatch;
    });
    
    return filtered;
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
          
          // Check if trip should be completed when driver location updates
          await checkTripCompletion(driverLocation.current_location);
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
        
        // Trigger trip completion notification
        if (!notificationShown) {
          setNotificationShown(true);
          setTripStatus('completed');
          
          // Show loading screen immediately
          setIsCompletingTrip(true);
          console.log('🔄 Loading screen triggered for trip completion');
          
          // Automatically complete the trip after a short delay
          setTimeout(() => {
            console.log('🏁 Calling completeTrip() with isAutoComplete=true');
            completeTrip(true); // Explicitly pass true for automatic completion
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
      
      // Show loading screen for automatic completion
      if (isAutoComplete) {
        console.log('🔄 Setting isCompletingTrip to true for loading screen');
        setIsCompletingTrip(true);
        console.log('🔄 Starting trip completion process...');
        
        // Add a small delay to show the loading screen
        await new Promise(resolve => setTimeout(resolve, 1500));
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
        }, 300);
      }
    } catch (error) {
      console.error('Error completing trip:', error);
      setIsCompletingTrip(false); // Make sure to hide loading on error
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
              
              // Trigger trip completion with loading screen
              if (!notificationShown) {
                setNotificationShown(true);
                setTripStatus('completed');
                
                setTimeout(() => {
                  completeTrip(); // This will show the loading screen
                }, 500);
              }
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

  // Listen for driver QR scan notifications (backup method)
  useEffect(() => {
    if (activeTrip) {
      let cleanup: (() => void) | undefined;
      let simpleCleanup: (() => void) | undefined;
      
      const handleTripCompletion = (notification: any) => {
        console.log('🔔 Received trip completion notification:', notification);
        
        if (notification.type === 'driver_at_destination' && !notificationShown) {
          // Driver has reached the destination - automatically complete the trip
          setNotificationShown(true);
          setTripStatus('completed');
          
          // Automatically complete the trip after a short delay
          setTimeout(() => {
            completeTrip();
          }, 1000);
        }
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
            
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={20} color={COLORS.gray500} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search routes, origins, destinations..."
                  placeholderTextColor={COLORS.gray500}
                  value={routeSearchQuery}
                  onChangeText={handleRouteSearch}
                  returnKeyType="search"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {routeSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={clearRouteSearch} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={20} color={COLORS.gray500} />
                  </TouchableOpacity>
                )}
              </View>
              {routeSearchQuery.length > 0 && (
                <Text style={styles.searchResultsText}>
                  {isSearchingRoutes 
                    ? 'Searching database...' 
                    : routeSearchResults.length > 0 
                      ? `${routeSearchResults.length} database route${routeSearchResults.length !== 1 ? 's' : ''} found`
                      : `${filteredRoutes.length} local route${filteredRoutes.length !== 1 ? 's' : ''} found`
                  }
                </Text>
              )}
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
              ) : routeSearchResults.length > 0 ? (
                // Show database search results
                <View>
                  <View style={styles.searchResultsHeader}>
                    <Text style={styles.searchResultsTitle}>
                      Database Results ({routeSearchResults.length})
                    </Text>
                    {isSearchingRoutes && (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    )}
                  </View>
                  {routeSearchResults.map((route) => (
                    <TouchableOpacity
                      key={`db-route-${route.id}`}
                      style={[
                        styles.routeItem,
                        selectedRoute?.id === route.id && styles.selectedRouteItem
                      ]}
                      onPress={async () => {
                        console.log('🛣️ Database route selected:', route);
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
                  ))}
                </View>
              ) : filteredRoutes.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="search" size={48} color={COLORS.gray400} />
                  <Text style={styles.emptyStateText}>No routes found</Text>
                  <Text style={styles.emptyStateSubtext}>Try searching for different keywords</Text>
                </View>
              ) : (
                filteredRoutes.map((route) => (
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