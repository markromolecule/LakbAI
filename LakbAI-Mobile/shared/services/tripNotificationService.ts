import AsyncStorage from '@react-native-async-storage/async-storage';
import sessionManager from './sessionManager';
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

  // Check for driver updates from backend API
  private async checkForDriverUpdates(tripId: string): Promise<TripNotification | null> {
    try {
      const activeTrip = await this.getActiveTrip();
      if (!activeTrip || activeTrip.id !== tripId) {
        return null;
      }

      // Get passenger ID from session
      const session = await sessionManager.getUserSession();
      if (!session?.dbUserData?.id) {
        return null;
      }

      const passengerId = session.dbUserData.id;

      // Check backend for trip completion notifications
      try {
        const response = await fetch(`${getBaseUrl()}/mobile/passenger/notifications/${passengerId}?trip_id=${tripId}&type=driver_at_destination&limit=1`);
        
        if (!response.ok) {
          console.log('📡 No trip completion notifications found (response not ok)');
          return null;
        }

        const data = await response.json();
        
        if (data.notifications && data.notifications.length > 0) {
          const notification = data.notifications[0];
          const notificationData = JSON.parse(notification.data || '{}');
          
          console.log('🔔 Found trip completion notification:', notification);
          
          // Mark notification as read
          try {
            await fetch(`${getBaseUrl()}/mobile/passenger/notifications/${notification.id}/read`, {
              method: 'POST'
            });
          } catch (markReadError) {
            console.warn('⚠️ Failed to mark notification as read:', markReadError);
          }
          
          return {
            id: notification.id,
            type: 'driver_at_destination',
            tripId: notificationData.trip_id || tripId,
            driverId: notificationData.driver_id,
            message: notification.message,
            timestamp: notification.created_at,
            data: notificationData
          };
        } else {
          console.log('📡 No trip completion notifications found in response');
        }
      } catch (fetchError) {
        console.error('📡 Failed to fetch notifications from backend:', fetchError);
        return null;
      }
      
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
