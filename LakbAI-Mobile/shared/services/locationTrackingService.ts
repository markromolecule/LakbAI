/**
 * Location Tracking Service
 * 
 * Similar to earnings service, this manages location updates through database/API
 * rather than device-to-device communication:
 * 
 * Flow:
 * 1. Driver scans QR → updates location in database via API
 * 2. Passenger app polls/refreshes location data from API
 * 3. Service detects location changes and triggers local notifications
 * 4. Passenger app receives notifications and updates UI
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBaseUrl } from '../../config/apiConfig';
import { localNotificationService } from './localNotificationService';

export interface DriverLocationInfo {
  driverId: string;
  driverName: string;
  jeepneyNumber: string;
  plateNumber: string;
  shiftStatus: string;
  lastScannedCheckpoint: string;
  estimatedArrival: string;
  lastUpdate: string;
  minutesSinceUpdate: number;
  status: string;
  statusMessage: string;
  route: string;
  coordinates?: { latitude: number; longitude: number };
}

export interface LocationUpdate {
  driverId: string;
  driverName: string;
  jeepneyNumber: string;
  currentLocation: string;
  previousLocation?: string;
  timestamp: string;
  route: string;
}

class LocationTrackingService {
  private previousLocations: Map<string, DriverLocationInfo> = new Map();
  private isPassengerApp: boolean = false;
  private refreshInterval: NodeJS.Timeout | null = null;
  private routeId: string = '1'; // Default route
  private sentNotifications: Set<string> = new Set(); // Track sent notifications to prevent duplicates

  /**
   * Initialize the service
   */
  async initialize(isPassengerApp: boolean = false, routeId: string = '1'): Promise<void> {
    this.isPassengerApp = isPassengerApp;
    this.routeId = routeId;
    
    console.log(`🗺️ LocationTrackingService initialized for ${isPassengerApp ? 'PASSENGER' : 'DRIVER'} app on route ${routeId}`);
    
    if (isPassengerApp) {
      // Start auto-refresh for passenger app to monitor location changes
      this.startLocationMonitoring();
    }
  }

  /**
   * Start monitoring location changes (passenger app only)
   */
  private startLocationMonitoring(): void {
    if (!this.isPassengerApp) return;
    
    console.log('🔄 Starting location monitoring for passenger app...');
    
    // Initial load
    this.checkForLocationUpdates();
    
    // Check for updates every 2 seconds for faster response
    this.refreshInterval = setInterval(() => {
      this.checkForLocationUpdates();
    }, 2000);
  }

  /**
   * Stop location monitoring
   */
  stopLocationMonitoring(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log('⏹️ Location monitoring stopped');
    }
  }

  /**
   * Fetch current driver locations from API
   */
  async fetchDriverLocations(routeId?: string): Promise<DriverLocationInfo[]> {
    try {
      const route = routeId || this.routeId;
      const url = `${getBaseUrl()}/mobile/passenger/real-time-drivers/${route}?t=${Date.now()}&cache=${Math.random()}`;
      console.log('🔍 LocationTrackingService: Fetching from URL:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('🔍 LocationTrackingService: API response:', {
        status: data.status,
        driverCount: data.driver_locations?.length || 0,
        routeId: data.route_id
      });
      console.log('🔍 LocationTrackingService: Raw driver_locations:', data.driver_locations);
      console.log('🔍 LocationTrackingService: Full API response:', JSON.stringify(data, null, 2));
      console.log('🔍 LocationTrackingService: Timestamp check - API last_updated:', data.last_updated);
      console.log('🔍 LocationTrackingService: Current time:', new Date().toISOString());
      
      if (data.driver_locations && Array.isArray(data.driver_locations)) {
        const locations = data.driver_locations.map((location: any) => ({
          driverId: location.driver_id.toString(),
          driverName: `${location.first_name} ${location.last_name}` || 'Unknown Driver',
          jeepneyNumber: location.jeepney_number || 'Unknown',
          plateNumber: location.plate_number || 'Unknown',
          shiftStatus: location.shift_status || 'unknown',
          lastScannedCheckpoint: location.current_location || 'Unknown Location', // Use current_location field
          estimatedArrival: location.estimated_arrival || 'Unknown',
          lastUpdate: location.last_update_formatted || new Date().toISOString(),
          minutesSinceUpdate: location.minutes_since_update || 0,
          status: location.shift_status === 'on_shift' ? 'active' : 'inactive',
          statusMessage: location.shift_status === 'on_shift' ? 'On Duty' : 'Off Duty',
          route: location.route_name || `Route ${route}`,
          coordinates: location.coordinates
        }));
        
        console.log('🔍 LocationTrackingService: Mapped locations:', locations.map(l => ({
          id: l.driverId,
          name: l.driverName,
          location: l.lastScannedCheckpoint,
          time: l.lastUpdate
        })));
        
        return locations;
      }
      
      console.log('🔍 LocationTrackingService: No driver_locations in response');
      return [];
    } catch (error) {
      console.error('❌ Failed to fetch driver locations:', error);
      return [];
    }
  }

  /**
   * Check for location updates and notify if changes detected (passenger app only)
   */
  private async checkForLocationUpdates(): Promise<void> {
    if (!this.isPassengerApp) return;
    
    try {
      const currentLocations = await this.fetchDriverLocations();
      console.log(`🔍 LocationTrackingService: Checking ${currentLocations.length} drivers for location changes`);
      console.log(`🔍 Current locations:`, currentLocations.map(l => ({ id: l.driverId, location: l.lastScannedCheckpoint, time: l.lastUpdate })));
      
      for (const currentLocation of currentLocations) {
        const previousLocation = this.previousLocations.get(currentLocation.driverId);
        
        console.log(`🔍 Driver ${currentLocation.driverId} (${currentLocation.driverName}):`, {
          currentLocation: currentLocation.lastScannedCheckpoint,
          previousLocation: previousLocation?.lastScannedCheckpoint || 'NONE',
          currentUpdate: currentLocation.lastUpdate,
          previousUpdate: previousLocation?.lastUpdate || 'NONE',
          hasChanged: previousLocation ? this.hasLocationChanged(previousLocation, currentLocation) : false
        });
        
        if (previousLocation && this.hasLocationChanged(previousLocation, currentLocation)) {
          console.log('📍 Location change detected for driver:', {
            driverId: currentLocation.driverId,
            driverName: currentLocation.driverName,
            previousLocation: previousLocation.lastScannedCheckpoint,
            currentLocation: currentLocation.lastScannedCheckpoint,
            previousUpdate: previousLocation.lastUpdate,
            currentUpdate: currentLocation.lastUpdate
          });
          
          // Trigger local notification for passengers
          console.log('🔔 TRIGGERING NOTIFICATION: Driver moved from', previousLocation.lastScannedCheckpoint, 'to', currentLocation.lastScannedCheckpoint);
          await this.notifyLocationChange(previousLocation, currentLocation);
        } else if (previousLocation) {
          console.log('📍 No location change detected for driver:', currentLocation.driverId, '- same location:', currentLocation.lastScannedCheckpoint);
        } else {
          console.log('📍 First time seeing driver:', currentLocation.driverId, 'at location:', currentLocation.lastScannedCheckpoint);
          
          // Send notification for new driver appearance (when driver starts shift)
          console.log('🔔 TRIGGERING NOTIFICATION: New driver appeared at', currentLocation.lastScannedCheckpoint);
          await this.notifyLocationChange(null, currentLocation);
        }
        
        // Update previous location cache
        this.previousLocations.set(currentLocation.driverId, currentLocation);
      }
    } catch (error) {
      console.error('❌ Error checking for location updates:', error);
    }
  }

  /**
   * Check if driver location has actually changed
   */
  private hasLocationChanged(previous: DriverLocationInfo, current: DriverLocationInfo): boolean {
    // Check if location or update time changed
    const locationChanged = previous.lastScannedCheckpoint !== current.lastScannedCheckpoint;
    const timeChanged = previous.lastUpdate !== current.lastUpdate;
    
    console.log(`🔍 Change detection for driver ${current.driverId}:`, {
      locationChanged: locationChanged,
      timeChanged: timeChanged,
      previous: {
        location: previous.lastScannedCheckpoint,
        time: previous.lastUpdate
      },
      current: {
        location: current.lastScannedCheckpoint,
        time: current.lastUpdate
      }
    });
    
    return locationChanged || timeChanged;
  }

  /**
   * Send location change notification (passenger app only)
   */
  private async notifyLocationChange(previous: DriverLocationInfo | null, current: DriverLocationInfo): Promise<void> {
    if (!this.isPassengerApp) return;
    
    try {
      // Handle new driver appearance (when driver starts shift)
      if (!previous) {
        console.log('🔔 Preparing to send new driver notification:', {
          driver: current.driverName,
          jeepney: current.jeepneyNumber,
          location: current.lastScannedCheckpoint
        });
        console.log('🔔 NOTIFICATION: New driver appeared at', current.lastScannedCheckpoint);

        // Create unique notification key for new driver appearance
        const newDriverKey = `new_driver_${current.driverId}_${current.lastScannedCheckpoint}`;
        
        if (this.sentNotifications.has(newDriverKey)) {
          console.log('🔔 Duplicate new driver notification prevented for:', newDriverKey);
          return;
        }

        // Mark notification as sent
        this.sentNotifications.add(newDriverKey);

        // Ensure notification service is initialized
        await localNotificationService.initialize();
        
        await localNotificationService.notifyLocationUpdate({
          type: 'location_update',
          driverId: current.driverId,
          driverName: current.driverName,
          jeepneyNumber: current.jeepneyNumber,
          route: current.route,
          currentLocation: current.lastScannedCheckpoint,
          previousLocation: null,
          coordinates: current.coordinates,
          title: '🚌 Driver Started Shift',
          body: `${current.driverName} (${current.jeepneyNumber}) started their shift at ${current.lastScannedCheckpoint}`,
          data: {
            driverId: current.driverId,
            driverName: current.driverName,
            jeepneyNumber: current.jeepneyNumber,
            route: current.route,
            currentLocation: current.lastScannedCheckpoint,
            previousLocation: null,
            type: 'new_driver'
          }
        });
        return;
      }

      // Handle regular location changes
      console.log('🔔 Preparing to send location notification:', {
        from: previous.lastScannedCheckpoint,
        to: current.lastScannedCheckpoint,
        driver: current.driverName,
        jeepney: current.jeepneyNumber
      });
      console.log('🔔 NOTIFICATION: Driver location changed from', previous.lastScannedCheckpoint, 'to', current.lastScannedCheckpoint);

      // Create unique notification key for regular location updates
      const locationKey = `location_${current.driverId}_${previous.lastScannedCheckpoint}_${current.lastScannedCheckpoint}`;
      
      if (this.sentNotifications.has(locationKey)) {
        console.log('🔔 Duplicate location notification prevented for:', locationKey);
        return;
      }

      // Mark notification as sent
      this.sentNotifications.add(locationKey);

      // Ensure notification service is initialized
      await localNotificationService.initialize();
      
      await localNotificationService.notifyLocationUpdate({
        type: 'location_update',
        driverId: current.driverId,
        driverName: current.driverName,
        jeepneyNumber: current.jeepneyNumber,
        route: current.route,
        currentLocation: current.lastScannedCheckpoint,
        previousLocation: previous.lastScannedCheckpoint,
        coordinates: current.coordinates,
        title: '📍 Jeepney Location Update',
        body: `${current.driverName} (${current.jeepneyNumber}) moved from ${previous.lastScannedCheckpoint} to ${current.lastScannedCheckpoint}`,
        data: {
          driverId: current.driverId,
          driverName: current.driverName,
          jeepneyNumber: current.jeepneyNumber,
          route: current.route,
          currentLocation: current.lastScannedCheckpoint,
          previousLocation: previous.lastScannedCheckpoint,
          coordinates: current.coordinates,
          timestamp: current.lastUpdate,
          notificationKey: locationKey
        }
      });
      
      console.log('✅ Location notification sent with key:', locationKey);
      
      // Special handling for endpoint destinations
      await this.handleEndpointNotification(current);
    } catch (error) {
      console.error('❌ Failed to send location notification:', error);
      console.error('❌ Error details:', error.message);
    }
  }

  /**
   * Handle special notification for route endpoints
   */
  private async handleEndpointNotification(location: DriverLocationInfo): Promise<void> {
    try {
      // Get passenger's active trip to determine their destination
      const storedTrip = await AsyncStorage.getItem('active_trip');
      if (!storedTrip) {
        console.log('🏁 No active trip found - skipping endpoint notification');
        return;
      }

      const activeTrip = JSON.parse(storedTrip);
      console.log('🏁 Checking endpoint for active trip:', {
        destination: activeTrip.destination,
        driverCurrentLocation: location.lastScannedCheckpoint,
        driverRoute: location.route
      });

      // The key insight: Only notify when driver reaches the PASSENGER'S destination
      // Not based on route endpoints, but on where the passenger is actually going
      
      if (!activeTrip.destination) {
        console.log('🏁 No destination in active trip - skipping endpoint notification');
        return;
      }

      // Normalize location names for comparison
      const normalizeLocation = (loc: string): string => {
        return loc.toLowerCase()
          .replace(/\s+/g, ' ')
          .trim()
          .replace('sm dasmariñas', 'sm dasmarinas')
          .replace('sm das', 'sm dasmarinas')
          .replace('sm dasma', 'sm dasmarinas')
          .replace('lancaster new city', 'lancaster')
          .replace('pasong camachile i', 'pasong camachile')
          .replace('robinson dasmariñas', 'robinson dasmarinas')
          .replace('robinson das', 'robinson dasmarinas');
      };

      const passengerDestination = normalizeLocation(activeTrip.destination);
      const driverCurrentLocation = normalizeLocation(location.lastScannedCheckpoint);

      console.log('🏁 Normalized comparison:', {
        passengerDestination,
        driverCurrentLocation,
        match: passengerDestination === driverCurrentLocation
      });

      // Only notify if driver reached the passenger's actual destination
      if (passengerDestination === driverCurrentLocation) {
        console.log('🏁 Driver reached passenger destination:', location.lastScannedCheckpoint);
        
        // Create unique notification key to prevent duplicates
        const notificationKey = `endpoint_${location.driverId}_${passengerDestination}_${Date.now().toString().slice(-6)}`;
        
        if (this.sentNotifications.has(notificationKey)) {
          console.log('🏁 Duplicate endpoint notification prevented for:', notificationKey);
          return;
        }
        
        // Mark notification as sent
        this.sentNotifications.add(notificationKey);
        
        // Clean up old notifications (keep only last 10)
        if (this.sentNotifications.size > 10) {
          const oldestKeys = Array.from(this.sentNotifications).slice(0, this.sentNotifications.size - 10);
          oldestKeys.forEach(key => this.sentNotifications.delete(key));
        }
        
        // Send special endpoint notification
        await localNotificationService.notifyLocationUpdate({
          type: 'location_update',
          driverId: location.driverId,
          driverName: location.driverName,
          jeepneyNumber: location.jeepneyNumber,
          route: location.route,
          currentLocation: location.lastScannedCheckpoint,
          previousLocation: 'En Route',
          coordinates: location.coordinates,
          title: '🎯 Your Destination Reached',
          body: `${location.driverName} (${location.jeepneyNumber}) has arrived at your destination: ${location.lastScannedCheckpoint}`,
          data: {
            driverId: location.driverId,
            driverName: location.driverName,
            jeepneyNumber: location.jeepneyNumber,
            route: location.route,
            currentLocation: location.lastScannedCheckpoint,
            isEndpoint: true,
            isPassengerDestination: true,
            timestamp: location.lastUpdate,
            notificationKey: notificationKey
          }
        });

        // Also trigger trip completion directly
        await this.triggerTripCompletion(location);
        
        console.log('🏁 Passenger destination notification sent with key:', notificationKey);
      } else {
        console.log('🏁 Driver at', location.lastScannedCheckpoint, 'but passenger destination is', activeTrip.destination, '- no endpoint notification');
      }
    } catch (error) {
      console.error('❌ Failed to send endpoint notification:', error);
    }
  }

  /**
   * Trigger trip completion directly (for passenger app)
   */
  private async triggerTripCompletion(location: DriverLocationInfo): Promise<void> {
    if (!this.isPassengerApp) return;

    try {
      console.log('🎯 Triggering direct trip completion for passenger');

      // Store trip completion event in AsyncStorage for HomeView to pick up
      const completionEvent = {
        type: 'trip_completion',
        driverId: location.driverId,
        driverName: location.driverName,
        jeepneyNumber: location.jeepneyNumber,
        destination: location.lastScannedCheckpoint,
        timestamp: new Date().toISOString(),
        processed: false
      };

      await AsyncStorage.setItem('trip_completion_event', JSON.stringify(completionEvent));
      
      console.log('🎯 Trip completion event stored for HomeView to process');
      
    } catch (error) {
      console.error('❌ Failed to trigger trip completion:', error);
    }
  }

  /**
   * Manually refresh locations and check for updates (can be called by passenger app)
   */
  async refreshLocations(routeId?: string): Promise<DriverLocationInfo[]> {
    const locations = await this.fetchDriverLocations(routeId);
    
    if (this.isPassengerApp) {
      // Check for updates when manually refreshing
      await this.checkForLocationUpdates();
    }
    
    return locations;
  }

  /**
   * Get cached previous locations
   */
  getPreviousLocations(): Map<string, DriverLocationInfo> {
    return new Map(this.previousLocations);
  }

  /**
   * Check if monitoring is active
   */
  isMonitoring(): boolean {
    return this.refreshInterval !== null;
  }

  /**
   * Get service status for debugging
   */
  getStatus(): {
    isPassengerApp: boolean;
    isMonitoring: boolean;
    routeId: string;
    cachedLocationsCount: number;
  } {
    return {
      isPassengerApp: this.isPassengerApp,
      isMonitoring: this.isMonitoring(),
      routeId: this.routeId,
      cachedLocationsCount: this.previousLocations.size
    };
  }

  /**
   * Clear location cache
   */
  clearLocationCache(): void {
    this.previousLocations.clear();
    console.log('🗑️ Location cache cleared');
  }

  /**
   * Update location for a specific driver (called after driver scans QR)
   * This doesn't send notifications - the passenger app will detect the change via API polling
   */
  async updateDriverLocation(driverId: string, checkpoint: string): Promise<void> {
    console.log('📍 Driver location updated in database:', {
      driverId,
      checkpoint,
      timestamp: new Date().toISOString()
    });
    
    // Note: The actual database update happens in tripTrackingService.addCheckpoint()
    // This service focuses on detection and notification, not database updates
  }

  /**
   * Get service status
   */
  getStatus(): {
    isInitialized: boolean;
    isPassengerApp: boolean;
    isMonitoring: boolean;
    routeId: string;
    trackedDrivers: number;
  } {
    return {
      isInitialized: true,
      isPassengerApp: this.isPassengerApp,
      isMonitoring: this.refreshInterval !== null,
      routeId: this.routeId,
      trackedDrivers: this.previousLocations.size
    };
  }
}

// Export singleton instance
export const locationTrackingService = new LocationTrackingService();

// Export class for testing
export { LocationTrackingService };
