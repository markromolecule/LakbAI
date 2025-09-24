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
      const response = await fetch(`${getBaseUrl()}/mobile/locations/route/${route}?t=${Date.now()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.driver_locations && Array.isArray(data.driver_locations)) {
        return data.driver_locations.map((location: any) => ({
          driverId: location.driver_id.toString(),
          driverName: location.driver_name || 'Unknown Driver',
          jeepneyNumber: location.jeepney_number || 'Unknown',
          plateNumber: location.plate_number || 'Unknown',
          shiftStatus: location.shift_status || 'unknown',
          lastScannedCheckpoint: location.last_scanned_checkpoint || 'Unknown Location',
          estimatedArrival: location.estimated_arrival || 'Unknown',
          lastUpdate: location.last_update || new Date().toISOString(),
          minutesSinceUpdate: location.minutes_since_update || 0,
          status: location.status || 'unknown',
          statusMessage: location.status_message || 'Unknown status',
          route: data.route_name || `Route ${route}`,
          coordinates: location.coordinates
        }));
      }
      
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
      
      for (const currentLocation of currentLocations) {
        const previousLocation = this.previousLocations.get(currentLocation.driverId);
        
        if (previousLocation && this.hasLocationChanged(previousLocation, currentLocation)) {
          console.log('📍 Location change detected for driver:', {
            driverId: currentLocation.driverId,
            driverName: currentLocation.driverName,
            previousLocation: previousLocation.lastScannedCheckpoint,
            currentLocation: currentLocation.lastScannedCheckpoint,
            timestamp: currentLocation.lastUpdate
          });
          
          // Trigger local notification for passengers
          await this.notifyLocationChange(previousLocation, currentLocation);
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
    
    return locationChanged || timeChanged;
  }

  /**
   * Send location change notification (passenger app only)
   */
  private async notifyLocationChange(previous: DriverLocationInfo, current: DriverLocationInfo): Promise<void> {
    if (!this.isPassengerApp) return;
    
    try {
      await localNotificationService.notifyLocationUpdate({
        type: 'location_update',
        driverId: current.driverId,
        driverName: current.driverName,
        jeepneyNumber: current.jeepneyNumber,
        route: current.route,
        currentLocation: current.lastScannedCheckpoint,
        previousLocation: previous.lastScannedCheckpoint,
        coordinates: current.coordinates,
        title: '📍 Jeepney Location Updated',
        body: `${current.driverName} (${current.jeepneyNumber}) moved from ${previous.lastScannedCheckpoint} to ${current.lastScannedCheckpoint}`,
        data: {
          driverId: current.driverId,
          driverName: current.driverName,
          jeepneyNumber: current.jeepneyNumber,
          route: current.route,
          currentLocation: current.lastScannedCheckpoint,
          previousLocation: previous.lastScannedCheckpoint,
          coordinates: current.coordinates,
          timestamp: current.lastUpdate
        }
      });
      
      console.log('🔔 Location notification sent to passenger app');
    } catch (error) {
      console.error('❌ Failed to send location notification:', error);
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
