import { Alert } from 'react-native';
import { earningsService } from './earningsService';
import { notificationService } from './notificationService';


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
      // Check if driver already has an active trip
      const existingTrip = this.getActiveTrip(driverId);
      if (existingTrip) {
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

      // Log trip start
      console.log(`🚍 Trip Started:`, {
        tripId,
        driver: driverInfo.name,
        jeepney: driverInfo.jeepneyNumber,
        startPoint: startCheckpoint.name
      });

      // Send notification to passengers
      await notificationService.notifyPassengerDriverLocation({
        type: 'driver_location_update',
        driverId,
        driverName: driverInfo.name,
        jeepneyNumber: driverInfo.jeepneyNumber,
        route: driverInfo.route,
        location: startCheckpoint.name,
        timestamp: now,
        coordinates: startCheckpoint.coordinates
      });

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

      console.log(`📍 Checkpoint Added:`, {
        tripId: activeTrip.id,
        checkpoint: checkpoint.name,
        totalCheckpoints: activeTrip.intermediateCheckpoints.length
      });

      // Send location update notification
      await notificationService.notifyPassengerDriverLocation({
        type: 'driver_location_update',
        driverId,
        driverName: activeTrip.driverName,
        jeepneyNumber: activeTrip.jeepneyNumber,
        route: activeTrip.route,
        location: checkpoint.name,
        timestamp: now,
        coordinates: checkpoint.coordinates
      });

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
      const activeTrip = this.getActiveTrip(driverId);
      if (!activeTrip) {
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

      console.log(`✅ Trip Completed:`, {
        tripId: completedTrip.id,
        duration: `${duration} minutes`,
        route: `${activeTrip.startCheckpoint.name} → ${endCheckpoint.name}`,
        checkpoints: activeTrip.intermediateCheckpoints.length
      });

      // Update driver earnings if fare was collected
      if (tripData?.fareCollected && tripData.fareCollected > 0) {
        const earningsUpdate = await earningsService.updateDriverEarnings({
          driverId,
          amount: tripData.fareCollected,
          tripId: completedTrip.id,
          passengerId: 'manual_collection',
          timestamp: now,
          paymentMethod: 'cash',
          pickupLocation: activeTrip.startCheckpoint.name,
          destination: endCheckpoint.name,
          originalFare: tripData.fareCollected,
          finalFare: tripData.fareCollected,
          incrementTripCount: false // Don't increment trip count for fare collection
        });

        // Send real-time earnings notification
        if (earningsUpdate.success) {
          console.log('🔔 Would notify driver about payment:', {
            fare: tripData.fareCollected,
            source: 'Manual Collection',
            route: `${activeTrip.startCheckpoint.name} → ${endCheckpoint.name}`
          });
        }
      }

      // Send final location update and trip completion notification
      await Promise.all([
        // Legacy notification system
        notificationService.notifyPassengerDriverLocation({
          type: 'driver_location_update',
          driverId,
          driverName: activeTrip.driverName,
          jeepneyNumber: activeTrip.jeepneyNumber,
          route: activeTrip.route,
          location: endCheckpoint.name,
          timestamp: now,
          coordinates: endCheckpoint.coordinates
        }),
        
        // Real-time trip completion notification
        console.log('🔔 Would notify trip completion:', {
          driver: activeTrip.driverName,
          jeepneyNumber: activeTrip.jeepneyNumber,
          start: activeTrip.startCheckpoint.name,
          end: endCheckpoint.name,
          duration
        })
      ]);

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
