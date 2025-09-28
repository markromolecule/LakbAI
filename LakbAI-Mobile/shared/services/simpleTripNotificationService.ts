/**
 * Simplified Trip Notification Service
 * Fallback implementation that doesn't rely on complex backend integration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TripNotification {
  id: string;
  type: 'driver_at_destination';
  tripId: string;
  message: string;
  timestamp: string;
}

class SimpleTripNotificationService {
  private static instance: SimpleTripNotificationService;
  private listeners: Map<string, (notification: TripNotification) => void> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): SimpleTripNotificationService {
    if (!SimpleTripNotificationService.instance) {
      SimpleTripNotificationService.instance = new SimpleTripNotificationService();
    }
    return SimpleTripNotificationService.instance;
  }

  // Listen for trip completion by checking if trip is still active
  async listenForDriverNotifications(tripId: string, callback: (notification: TripNotification) => void) {
    try {
      console.log('🔔 Setting up simple trip notification listener for trip:', tripId);
      
      // Store the callback
      this.listeners.set(tripId, callback);
      
      // Check for trip completion every 10 seconds
      const interval = setInterval(async () => {
        await this.checkTripStatus(tripId);
      }, 10000);
      
      this.intervals.set(tripId, interval);

      // Return cleanup function
      return () => {
        console.log('🔔 Cleaning up trip notification listener for trip:', tripId);
        this.listeners.delete(tripId);
        const intervalId = this.intervals.get(tripId);
        if (intervalId) {
          clearInterval(intervalId);
          this.intervals.delete(tripId);
        }
      };
    } catch (error) {
      console.error('Error setting up simple trip notification listener:', error);
    }
  }

  private async checkTripStatus(tripId: string): Promise<void> {
    try {
      // Get the active trip from storage
      const storedTrip = await AsyncStorage.getItem('active_trip');
      if (!storedTrip) {
        console.log('🔔 No active trip found - trip may have been completed');
        return;
      }

      const activeTrip = JSON.parse(storedTrip);
      
      // Check if this is still the same trip
      if (activeTrip.id !== tripId) {
        console.log('🔔 Trip ID changed - original trip may have been completed');
        this.triggerNotification(tripId, 'Trip completed - new trip started');
        return;
      }

      // Check if trip status is completed
      if (activeTrip.status === 'completed') {
        console.log('🔔 Trip status is completed - triggering notification');
        this.triggerNotification(tripId, 'Trip completed successfully!');
        return;
      }

      console.log('🔔 Trip still active, continuing to monitor...');
    } catch (error) {
      console.error('Error checking trip status:', error);
    }
  }

  private triggerNotification(tripId: string, message: string): void {
    const callback = this.listeners.get(tripId);
    if (callback) {
      const notification: TripNotification = {
        id: `notification_${Date.now()}`,
        type: 'driver_at_destination',
        tripId: tripId,
        message: message,
        timestamp: new Date().toISOString()
      };

      console.log('🔔 Triggering trip completion notification:', notification);
      callback(notification);
      
      // Clean up after notification
      this.listeners.delete(tripId);
      const intervalId = this.intervals.get(tripId);
      if (intervalId) {
        clearInterval(intervalId);
        this.intervals.delete(tripId);
      }
    }
  }

  // Manual trigger for testing
  async triggerManualCompletion(tripId: string): Promise<void> {
    console.log('🧪 Manually triggering trip completion for testing:', tripId);
    this.triggerNotification(tripId, 'Trip manually completed for testing');
  }
}

export const simpleTripNotificationService = SimpleTripNotificationService.getInstance();
