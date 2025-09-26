import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBaseUrl } from '../../config/apiConfig';

export interface TripNotification {
  type: 'driver_arrived' | 'trip_started' | 'trip_completed' | 'driver_at_destination';
  tripId: string;
  driverId: string;
  driverName: string;
  jeepneyNumber: string;
  checkpointName?: string;
  timestamp: string;
  message: string;
}

class TripNotificationService {
  private static instance: TripNotificationService;
  
  static getInstance(): TripNotificationService {
    if (!TripNotificationService.instance) {
      TripNotificationService.instance = new TripNotificationService();
    }
    return TripNotificationService.instance;
  }

  // Listen for driver QR scan notifications
  async listenForDriverNotifications(tripId: string, callback: (notification: TripNotification) => void) {
    try {
      // In a real implementation, this would use WebSockets or push notifications
      // For now, we'll use polling to check for driver updates
      const interval = setInterval(async () => {
        const notification = await this.checkForDriverUpdates(tripId);
        if (notification) {
          callback(notification);
        }
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    } catch (error) {
      console.error('Error setting up driver notification listener:', error);
    }
  }

  // Check for driver updates (simulated - in real app this would be from server)
  private async checkForDriverUpdates(tripId: string): Promise<TripNotification | null> {
    try {
      // This would normally check with the server for driver location updates
      // For now, we'll only return notifications when explicitly triggered
      // (e.g., when driver scans QR code at destination)
      const activeTrip = await this.getActiveTrip();
      if (!activeTrip || activeTrip.id !== tripId) {
        return null;
      }

      // In a real implementation, this would check the server for:
      // 1. Driver's current location
      // 2. Whether driver scanned QR at passenger's destination
      // 3. Whether driver exceeded passenger's destination
      
      // For now, return null to prevent automatic trip completion
      return null;
    } catch (error) {
      console.error('Error checking for driver updates:', error);
      return null;
    }
  }

  // Get active trip from storage
  private async getActiveTrip() {
    try {
      const storedTrip = await AsyncStorage.getItem('active_trip');
      return storedTrip ? JSON.parse(storedTrip) : null;
    } catch (error) {
      console.error('Error getting active trip:', error);
      return null;
    }
  }

  // Update trip status
  async updateTripStatus(tripId: string, status: 'waiting' | 'in_progress' | 'completed') {
    try {
      const activeTrip = await this.getActiveTrip();
      if (activeTrip && activeTrip.id === tripId) {
        activeTrip.status = status;
        await AsyncStorage.setItem('active_trip', JSON.stringify(activeTrip));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating trip status:', error);
      return false;
    }
  }

  // Complete trip (remove from storage)
  async completeTrip(tripId: string) {
    try {
      const activeTrip = await this.getActiveTrip();
      if (activeTrip && activeTrip.id === tripId) {
        await AsyncStorage.removeItem('active_trip');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error completing trip:', error);
      return false;
    }
  }

  // Send notification to passenger (simulated)
  async sendPassengerNotification(notification: TripNotification) {
    try {
      // In a real app, this would send a push notification
      console.log('🔔 Trip Notification:', notification);
      
      // Store notification for display
      const notifications = await this.getStoredNotifications();
      notifications.push(notification);
      await AsyncStorage.setItem('trip_notifications', JSON.stringify(notifications));
      
      return true;
    } catch (error) {
      console.error('Error sending passenger notification:', error);
      return false;
    }
  }

  // Get stored notifications
  async getStoredNotifications(): Promise<TripNotification[]> {
    try {
      const stored = await AsyncStorage.getItem('trip_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting stored notifications:', error);
      return [];
    }
  }

  // Clear notifications
  async clearNotifications() {
    try {
      await AsyncStorage.removeItem('trip_notifications');
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  // Simulate driver reaching destination (for testing purposes)
  async simulateDriverAtDestination(tripId: string): Promise<TripNotification | null> {
    try {
      const activeTrip = await this.getActiveTrip();
      if (!activeTrip || activeTrip.id !== tripId) {
        return null;
      }

      const now = new Date();
      return {
        type: 'driver_at_destination',
        tripId: activeTrip.id,
        driverId: activeTrip.driverId,
        driverName: activeTrip.driverName,
        jeepneyNumber: activeTrip.jeepneyNumber,
        checkpointName: activeTrip.destination,
        timestamp: now.toISOString(),
        message: `Driver ${activeTrip.driverName} has reached your destination: ${activeTrip.destination}`
      };
    } catch (error) {
      console.error('Error simulating driver at destination:', error);
      return null;
    }
  }
}

export const tripNotificationService = TripNotificationService.getInstance();
