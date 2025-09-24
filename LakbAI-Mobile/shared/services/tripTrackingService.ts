import { Alert } from 'react-native';
import { earningsService } from './earningsService';
// Removed notificationService - using API polling approach instead


export interface TripCheckpoint {
  id: string;
  name: string;
  type: 'start' | 'end' | 'checkpoint';
  coordinates: {
    latitude: number;
    longitude: number;
  };
  scannedAt: string;
}

export interface ActiveTrip {
  id: string;
  driverId: string;
  driverName: string;
  jeepneyNumber: string;
  route: string;
  startCheckpoint: TripCheckpoint;
  endCheckpoint?: TripCheckpoint;
  intermediateCheckpoints: TripCheckpoint[];
  status: 'in_progress' | 'completed' | 'cancelled';
  startTime: string;
  endTime?: string;
  duration?: number; // in minutes
  distanceCovered?: number; // in kilometers
  passengersPickedUp?: number;
  fareCollected?: number;
}

export interface TripSummary {
  totalTrips: number;
  completedTrips: number;
  incompleteTrips: number;
  totalDistance: number;
  totalDuration: number;
  totalEarnings: number;
  averageTripDuration: number;
  mostFrequentRoute: string;
}

class TripTrackingService {
  private activeTrips: Map<string, ActiveTrip> = new Map();
  private completedTrips: Map<string, ActiveTrip[]> = new Map();
  private listeners = new Set<(driverId: string, action: 'trip_cleared' | 'trip_started' | 'trip_completed' | 'checkpoint_added') => void>();

  /**
   * Start a new trip when driver scans a start checkpoint
   */
  async startTrip(
    driverId: string,
    driverInfo: {
      name: string;
      jeepneyNumber: string;
      route: string;
    },
    startCheckpoint: Omit<TripCheckpoint, 'scannedAt'>
  ): Promise<{
    success: boolean;
    tripId?: string;
    message: string;
    activeTrip?: ActiveTrip;
  }> {
    try {
      console.log('🚀 TripTrackingService.startTrip called for driver:', driverId);
      console.log('🚀 Driver info:', driverInfo);
      console.log('🚀 Start checkpoint:', startCheckpoint);
      
      // Check if driver already has an active trip
      const existingTrip = this.getActiveTrip(driverId);
      console.log('🚀 Existing trip check:', existingTrip);
      
      if (existingTrip) {
        console.log('❌ Driver already has active trip:', existingTrip.id);
        return {
          success: false,
          message: `You already have an active trip from ${existingTrip.startCheckpoint.name}. Please complete or cancel it first.`
        };
      }

      const tripId = `trip_${driverId}_${Date.now()}`;
      const now = new Date().toISOString();

      const activeTrip: ActiveTrip = {
        id: tripId,
        driverId,
        driverName: driverInfo.name,
        jeepneyNumber: driverInfo.jeepneyNumber,
        route: driverInfo.route,
        startCheckpoint: {
          ...startCheckpoint,
          scannedAt: now
        },
        intermediateCheckpoints: [],
        status: 'in_progress',
        startTime: now
      };

      this.activeTrips.set(driverId, activeTrip);

      // Notify listeners that trip was started
      this.notifyListeners(driverId, 'trip_started');

      // Increment trip count when starting a trip (NEW LOGIC)
      try {
        // Don't increment trip count on start - only on completion
        // Trip start doesn't count as a completed trip
        console.log('🚀 Trip started - trip count will be incremented on completion');
      } catch (error) {
        console.error('❌ Error on trip start:', error);
      }

      // Log trip start
      console.log(`🚍 Trip Started:`, {
        tripId,
        driver: driverInfo.name,
        jeepney: driverInfo.jeepneyNumber,
        startPoint: startCheckpoint.name
      });

      // Location update stored in database - passenger apps will detect via API polling

      return {
        success: true,
        tripId,
        message: `Trip started from ${startCheckpoint.name}`,
        activeTrip
      };

    } catch (error) {
      console.error('Failed to start trip:', error);
      return {
        success: false,
        message: 'Failed to start trip. Please try again.'
      };
    }
  }

  /**
   * Add intermediate checkpoint when driver scans checkpoint QR
   */
  async addCheckpoint(
    driverId: string,
    checkpoint: Omit<TripCheckpoint, 'scannedAt'>
  ): Promise<{
    success: boolean;
    message: string;
    activeTrip?: ActiveTrip;
  }> {
    try {
      const activeTrip = this.getActiveTrip(driverId);
      if (!activeTrip) {
        return {
          success: false,
          message: 'No active trip found. Please start a trip first by scanning a start checkpoint.'
        };
      }

      const now = new Date().toISOString();
      const scannedCheckpoint: TripCheckpoint = {
        ...checkpoint,
        scannedAt: now
      };

      activeTrip.intermediateCheckpoints.push(scannedCheckpoint);
      this.activeTrips.set(driverId, activeTrip);

      // Notify listeners about checkpoint addition
      this.notifyListeners(driverId, 'checkpoint_added');

      console.log(`📍 Checkpoint Added:`, {
        tripId: activeTrip.id,
        checkpoint: checkpoint.name,
        totalCheckpoints: activeTrip.intermediateCheckpoints.length
      });

      // Location update stored in database - passenger apps will detect via API polling
      console.log('📍 Driver location updated in database:', {
        driverId,
        driverName: activeTrip.driverName,
        jeepneyNumber: activeTrip.jeepneyNumber,
        currentLocation: checkpoint.name,
        route: activeTrip.route,
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ Location update stored - passenger apps will detect via API polling');

      return {
        success: true,
        message: `Location updated: ${checkpoint.name}`,
        activeTrip
      };

    } catch (error) {
      console.error('Failed to add checkpoint:', error);
      return {
        success: false,
        message: 'Failed to update location. Please try again.'
      };
    }
  }

  /**
   * End trip when driver scans an end checkpoint
   */
  async endTrip(
    driverId: string,
    endCheckpoint: Omit<TripCheckpoint, 'scannedAt'>,
    tripData?: {
      passengersPickedUp?: number;
      fareCollected?: number;
    }
  ): Promise<{
    success: boolean;
    message: string;
    completedTrip?: ActiveTrip;
    tripSummary?: {
      duration: number;
      checkpoints: number;
      distance: string;
    };
  }> {
    try {
      console.log('🏁 TripTrackingService.endTrip called for driver:', driverId);
      console.log('🏁 End checkpoint:', endCheckpoint);
      
      const activeTrip = this.getActiveTrip(driverId);
      console.log('🏁 Active trip found:', activeTrip);
      
      if (!activeTrip) {
        console.log('❌ No active trip found for driver:', driverId);
        return {
          success: false,
          message: 'No active trip found to complete.'
        };
      }

      const now = new Date().toISOString();
      const startTime = new Date(activeTrip.startTime);
      const endTime = new Date(now);
      const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)); // minutes

      // Complete the trip
      const completedTrip: ActiveTrip = {
        ...activeTrip,
        endCheckpoint: {
          ...endCheckpoint,
          scannedAt: now
        },
        status: 'completed',
        endTime: now,
        duration,
        distanceCovered: this.calculateDistance(activeTrip.startCheckpoint, endCheckpoint),
        passengersPickedUp: tripData?.passengersPickedUp || 0,
        fareCollected: tripData?.fareCollected || 0
      };

      // Remove from active trips
      this.activeTrips.delete(driverId);

      // Add to completed trips
      const driverCompletedTrips = this.completedTrips.get(driverId) || [];
      driverCompletedTrips.push(completedTrip);
      this.completedTrips.set(driverId, driverCompletedTrips);

      // Notify listeners that trip was completed
      this.notifyListeners(driverId, 'trip_completed');

      console.log(`✅ Trip Completed:`, {
        tripId: completedTrip.id,
        duration: `${duration} minutes`,
        route: `${activeTrip.startCheckpoint.name} → ${endCheckpoint.name}`,
        checkpoints: activeTrip.intermediateCheckpoints.length
      });

      // Update driver earnings and increment trip count on completion
      const earningsUpdate = await earningsService.updateDriverEarnings({
        driverId,
        amount: tripData?.fareCollected || 0,
        tripId: completedTrip.id,
        passengerId: 'trip_completion',
        timestamp: now,
        paymentMethod: 'cash',
        pickupLocation: activeTrip.startCheckpoint.name,
        destination: endCheckpoint.name,
        originalFare: tripData?.fareCollected || 0,
        finalFare: tripData?.fareCollected || 0,
        incrementTripCount: true // Increment trip count when trip is completed
      });

      // Send real-time earnings notification
      if (earningsUpdate.success) {
        console.log('✅ Trip completed and trip count incremented:', {
          tripId: completedTrip.id,
          fareCollected: tripData?.fareCollected || 0,
          newTripCount: earningsUpdate.newEarnings?.todayTrips,
          route: `${activeTrip.startCheckpoint.name} → ${endCheckpoint.name}`
        });
      } else {
        console.error('❌ Failed to update earnings on trip completion:', earningsUpdate.error);
      }

      // Trip completed - location update stored in database for passenger apps to detect via API polling
      console.log('🔔 Trip completed:', {
        driver: activeTrip.driverName,
        jeepneyNumber: activeTrip.jeepneyNumber,
        start: activeTrip.startCheckpoint.name,
        end: endCheckpoint.name,
        duration
      });

      const tripSummary = {
        duration,
        checkpoints: activeTrip.intermediateCheckpoints.length,
        distance: `${completedTrip.distanceCovered?.toFixed(1) || 0} km`
      };

      return {
        success: true,
        message: `Trip completed! Duration: ${duration} minutes`,
        completedTrip,
        tripSummary
      };

    } catch (error) {
      console.error('Failed to end trip:', error);
      return {
        success: false,
        message: 'Failed to complete trip. Please try again.'
      };
    }
  }

  /**
   * Get active trip for a driver
   */
  getActiveTrip(driverId: string): ActiveTrip | null {
    return this.activeTrips.get(driverId) || null;
  }

  /**
   * Get completed trips for a driver
   */
  getCompletedTrips(driverId: string): ActiveTrip[] {
    return this.completedTrips.get(driverId) || [];
  }

  /**
   * Clear active trip for a driver (used when ending shift)
   */
  clearActiveTrip(driverId: string): {
    success: boolean;
    message: string;
  } {
    try {
      const activeTrip = this.activeTrips.get(driverId);
      if (activeTrip) {
        this.activeTrips.delete(driverId);
        console.log(`🧹 Active trip cleared for driver ${driverId}:`, activeTrip.id);
        
        // Notify listeners that trip was cleared
        this.notifyListeners(driverId, 'trip_cleared');
        
        return {
          success: true,
          message: 'Active trip cleared successfully'
        };
      } else {
        return {
          success: true,
          message: 'No active trip to clear'
        };
      }
    } catch (error) {
      console.error('Failed to clear active trip:', error);
      return {
        success: false,
        message: 'Failed to clear active trip'
      };
    }
  }

  /**
   * Get trip summary for a driver
   */
  getTripSummary(driverId: string): TripSummary {
    const completedTrips = this.getCompletedTrips(driverId);
    const activeTrip = this.getActiveTrip(driverId);

    const totalTrips = completedTrips.length + (activeTrip ? 1 : 0);
    const totalDistance = completedTrips.reduce((sum, trip) => sum + (trip.distanceCovered || 0), 0);
    const totalDuration = completedTrips.reduce((sum, trip) => sum + (trip.duration || 0), 0);
    const totalEarnings = completedTrips.reduce((sum, trip) => sum + (trip.fareCollected || 0), 0);

    // Find most frequent route
    const routeCounts: Record<string, number> = {};
    completedTrips.forEach(trip => {
      const route = `${trip.startCheckpoint.name} → ${trip.endCheckpoint?.name || 'Incomplete'}`;
      routeCounts[route] = (routeCounts[route] || 0) + 1;
    });
    
    const mostFrequentRoute = Object.keys(routeCounts).reduce((a, b) => 
      routeCounts[a] > routeCounts[b] ? a : b, 'No trips completed'
    );

    return {
      totalTrips,
      completedTrips: completedTrips.length,
      incompleteTrips: activeTrip ? 1 : 0,
      totalDistance: Math.round(totalDistance * 10) / 10, // Round to 1 decimal
      totalDuration,
      totalEarnings,
      averageTripDuration: completedTrips.length > 0 ? Math.round(totalDuration / completedTrips.length) : 0,
      mostFrequentRoute
    };
  }

  /**
   * Cancel active trip
   */
  async cancelTrip(driverId: string, reason: string = 'Cancelled by driver'): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const activeTrip = this.getActiveTrip(driverId);
      if (!activeTrip) {
        return {
          success: false,
          message: 'No active trip to cancel.'
        };
      }

      // Mark trip as cancelled
      const cancelledTrip: ActiveTrip = {
        ...activeTrip,
        status: 'cancelled',
        endTime: new Date().toISOString()
      };

      // Remove from active trips and add to completed (as cancelled)
      this.activeTrips.delete(driverId);
      const driverCompletedTrips = this.completedTrips.get(driverId) || [];
      driverCompletedTrips.push(cancelledTrip);
      this.completedTrips.set(driverId, driverCompletedTrips);

      console.log(`❌ Trip Cancelled:`, {
        tripId: activeTrip.id,
        reason,
        startPoint: activeTrip.startCheckpoint.name
      });

      return {
        success: true,
        message: `Trip cancelled: ${reason}`
      };

    } catch (error) {
      console.error('Failed to cancel trip:', error);
      return {
        success: false,
        message: 'Failed to cancel trip. Please try again.'
      };
    }
  }

  /**
   * Calculate approximate distance between two checkpoints
   */
  private calculateDistance(
    start: { coordinates: { latitude: number; longitude: number } },
    end: { coordinates: { latitude: number; longitude: number } }
  ): number {
    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(end.coordinates.latitude - start.coordinates.latitude);
    const dLon = this.toRad(end.coordinates.longitude - start.coordinates.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(start.coordinates.latitude)) * 
      Math.cos(this.toRad(end.coordinates.latitude)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Add a listener for trip changes
   */
  addTripListener(callback: (driverId: string, action: 'trip_cleared' | 'trip_started' | 'trip_completed' | 'checkpoint_added') => void): () => void {
    this.listeners.add(callback);
    console.log('👂 Registered new trip listener. Total listeners:', this.listeners.size);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
      console.log('🔇 Removed trip listener. Remaining listeners:', this.listeners.size);
    };
  }

  /**
   * Notify all listeners of trip changes
   */
  private notifyListeners(driverId: string, action: 'trip_cleared' | 'trip_started' | 'trip_completed' | 'checkpoint_added'): void {
    console.log('📢 Notifying', this.listeners.size, 'listeners about trip change:', action, 'for driver', driverId);
    
    this.listeners.forEach((callback) => {
      try {
        callback(driverId, action);
      } catch (error) {
        console.error('❌ Error in trip listener:', error);
      }
    });
  }

  /**
   * Get mock trip data for testing
   */
  getMockTripData(): {
    startCheckpoint: Omit<TripCheckpoint, 'scannedAt'>;
    endCheckpoint: Omit<TripCheckpoint, 'scannedAt'>;
    intermediateCheckpoints: Omit<TripCheckpoint, 'scannedAt'>[];
  } {
    return {
      startCheckpoint: {
        id: 'rt_start',
        name: 'Robinson Galleria Cebu',
        type: 'start',
        coordinates: { latitude: 10.3157, longitude: 123.9054 }
      },
      endCheckpoint: {
        id: 'rt_end',
        name: 'Robinson Pala-pala',
        type: 'end',
        coordinates: { latitude: 10.2844, longitude: 123.8856 }
      },
      intermediateCheckpoints: [
        {
          id: 'rt_mid1',
          name: 'Ayala Center Cebu',
          type: 'checkpoint',
          coordinates: { latitude: 10.3181, longitude: 123.9068 }
        },
        {
          id: 'rt_mid2',
          name: 'Colon Street',
          type: 'checkpoint',
          coordinates: { latitude: 10.2952, longitude: 123.9019 }
        }
      ]
    };
  }
}

export const tripTrackingService = new TripTrackingService();
export default tripTrackingService;
