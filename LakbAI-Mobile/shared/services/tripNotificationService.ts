import AsyncStorage from '@react-native-async-storage/async-storage';
import sessionManager from './sessionManager';
import { getBaseUrl } from '../../config/apiConfig';
import { webSocketService, TripUpdate, QRScanNotification } from './webSocketService';

export interface TripNotification {
  id?: string;
  type: 'driver_arrived' | 'trip_started' | 'trip_completed' | 'driver_at_destination' | 'location_update' | 'endpoint_reached';
  tripId: string;
  driverId: string;
  driverName: string;
  jeepneyNumber: string;
  checkpointName?: string;
  timestamp: string;
  message: string;
  data?: any;
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
      console.log('🔌 Setting up WebSocket listeners for trip notifications...');

      // WebSocket event handlers
      const handleTripCompleted = (data: TripUpdate) => {
        console.log('🔔 WebSocket trip-completed event received:', data);
        console.log('🔔 Checking trip ID match:', { receivedTripId: data.tripId, expectedTripId: tripId });
        
        if (data.tripId === tripId || !tripId) {
          const notification: TripNotification = {
            id: `trip_completed_${data.tripId}`,
            type: 'trip_completed',
            tripId: data.tripId,
            driverId: data.driverId,
            driverName: 'Driver', // We can enhance this later
            jeepneyNumber: 'Unknown', // We can enhance this later
            timestamp: data.timestamp,
            message: `Trip completed. Earnings: ₱${data.earnings}`,
            data: data
          };
          console.log('🔔 Trip completion notification created:', notification);
          callback(notification);
        } else {
          console.log('🔔 Trip completion event ignored - trip ID mismatch');
        }
      };

      const handleQRScanNotification = (data: QRScanNotification) => {
        if (data.tripId === tripId || !tripId) {
          const notification: TripNotification = {
            id: `qr_scan_${data.timestamp}`,
            type: 'driver_arrived',
            tripId: data.tripId || '',
            driverId: data.driverId,
            driverName: 'Driver',
            jeepneyNumber: 'Unknown',
            checkpointName: data.checkpoint,
            timestamp: data.timestamp,
            message: `Driver scanned QR at ${data.checkpoint}. Amount: ₱${data.amount}`,
            data: data
          };
          console.log('🔔 QR scan notification received:', notification);
          callback(notification);
        }
      };

      const handleDriverLocationUpdate = (data: any) => {
        const notification: TripNotification = {
          id: `location_update_${data.timestamp}`,
          type: 'location_update',
          tripId: tripId || '',
          driverId: data.driverId,
          driverName: 'Driver',
          jeepneyNumber: data.jeepneyNumber || 'Unknown',
          checkpointName: data.location,
          timestamp: data.timestamp,
          message: `Driver is now at ${data.location}`,
          data: data
        };
        console.log('🔔 Location update notification received:', notification);
        callback(notification);
      };

      // Set up WebSocket listeners
      console.log('🔌 Setting up WebSocket listeners for trip notifications...');
      webSocketService.on('trip-completed', handleTripCompleted);
      webSocketService.on('qr-scan-notification', handleQRScanNotification); // Disabled to prevent duplicate notifications
      webSocketService.on('driver-location-update', handleDriverLocationUpdate);
      console.log('✅ WebSocket listeners set up successfully');

      // Fallback: Keep polling as backup for now (we can remove this later)
      const fallbackInterval = setInterval(async () => {
        // Only use fallback if WebSocket is not connected
        if (!webSocketService.isSocketConnected()) {
          console.log('🔍 WebSocket not connected, using fallback polling...');
          
          const completionNotification = await this.checkForDriverUpdates(tripId);
          if (completionNotification) {
            callback(completionNotification);
          }
          
          const locationNotification = await this.checkForLocationUpdates(tripId);
          if (locationNotification) {
            callback(locationNotification);
          }
        }
      }, 5000); // Less frequent fallback polling

      // Return cleanup function
      return () => {
        console.log('🔌 Cleaning up trip notification listeners...');
        webSocketService.off('trip-completed', handleTripCompleted);
        // webSocketService.off('qr-scan-notification', handleQRScanNotification); // Disabled to prevent duplicate notifications
        webSocketService.off('driver-location-update', handleDriverLocationUpdate);
        clearInterval(fallbackInterval);
      };

    } catch (error) {
      console.error('Error setting up driver notification listener:', error);
      
      // Fallback to polling if WebSocket setup fails
      const interval = setInterval(async () => {
        const completionNotification = await this.checkForDriverUpdates(tripId);
        if (completionNotification) callback(completionNotification);
      }, 3000);
      
      return () => clearInterval(interval);
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
        
        // Handle route not found error gracefully
        if (data.status === 'error' && data.message === 'Route not found') {
          console.log('📡 Passenger notifications route not available, skipping notification check');
          return null;
        }
        
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
            driverName: notificationData.driver_name || 'Driver',
            jeepneyNumber: notificationData.jeepney_number || 'Unknown',
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

  // Check for location update notifications
  private async checkForLocationUpdates(tripId: string): Promise<TripNotification | null> {
    try {
      // Get passenger ID from session
      const session = await sessionManager.getUserSession();
      if (!session?.dbUserData?.id) {
        return null;
      }

      const passengerId = session.dbUserData.id;

      // Check backend for location update notifications
      // For location updates, don't filter by trip_id since they are general notifications
      try {
        const response = await fetch(`${getBaseUrl()}/mobile/passenger/notifications/${passengerId}?type=location_update&status=pending&limit=1`);
        
        if (!response.ok) {
          console.log('📡 No location update notifications found (response not ok)');
          return null;
        }

        const data = await response.json();
        
        // Handle route not found error gracefully
        if (data.status === 'error' && data.message === 'Route not found') {
          console.log('📡 Passenger notifications route not available, skipping location update check');
          return null;
        }
        
        if (data.notifications && data.notifications.length > 0) {
          const notification = data.notifications[0];
          const notificationData = JSON.parse(notification.data || '{}');
          
          console.log('🔔 Found location update notification:', notification);
          console.log('🔔 Notification data:', notificationData);
          
          // Mark notification as read immediately to prevent duplicates
          try {
            await fetch(`${getBaseUrl()}/mobile/passenger/notifications/${notification.id}/read`, {
              method: 'POST'
            });
            console.log('✅ Marked notification as read:', notification.id);
          } catch (markReadError) {
            console.warn('⚠️ Failed to mark location notification as read:', markReadError);
          }
          
          // Determine notification type based on data
          let notificationType: 'location_update' | 'endpoint_reached' = 'location_update';
          if (notificationData.is_endpoint) {
            notificationType = 'endpoint_reached';
          }

          return {
            id: notification.id,
            type: notificationType,
            tripId: notificationData.trip_id || 'general',
            driverId: notificationData.driver_id,
            driverName: notificationData.driver_name || 'Driver',
            jeepneyNumber: notificationData.jeepney_number || 'Unknown',
            checkpointName: notificationData.current_location,
            message: notification.message,
            timestamp: notification.created_at,
            data: notificationData
          };
        } else {
          console.log('📡 No location update notifications found in response');
        }
      } catch (fetchError) {
        console.error('📡 Failed to fetch location notifications from backend:', fetchError);
        return null;
      }
      
      return null;
    } catch (error) {
      console.error('Error checking for location updates:', error);
      return null;
    }
  }

  // Check for endpoint reached notifications
  private async checkForEndpointNotifications(tripId: string): Promise<TripNotification | null> {
    try {
      // Get passenger ID from session
      const session = await sessionManager.getUserSession();
      if (!session?.dbUserData?.id) {
        return null;
      }

      const passengerId = session.dbUserData.id;

      // Check backend for endpoint notifications
      try {
        const response = await fetch(`${getBaseUrl()}/mobile/passenger/notifications/${passengerId}?type=endpoint_reached&status=pending&limit=1`);
        
        if (!response.ok) {
          console.log('📡 No endpoint notifications found (response not ok)');
          return null;
        }

        const data = await response.json();
        
        // Handle route not found error gracefully
        if (data.status === 'error' && data.message === 'Route not found') {
          console.log('📡 Passenger notifications route not available, skipping endpoint check');
          return null;
        }
        
        if (data.notifications && data.notifications.length > 0) {
          const notification = data.notifications[0];
          const notificationData = JSON.parse(notification.data || '{}');
          
          console.log('🔔 Found endpoint notification:', notification);
          console.log('🔔 Endpoint notification data:', notificationData);
          
          // Mark notification as read immediately to prevent duplicates
          try {
            await fetch(`${getBaseUrl()}/mobile/passenger/notifications/${notification.id}/read`, {
              method: 'POST'
            });
            console.log('✅ Marked endpoint notification as read:', notification.id);
          } catch (markReadError) {
            console.warn('⚠️ Failed to mark endpoint notification as read:', markReadError);
          }

          return {
            id: notification.id,
            type: 'endpoint_reached',
            tripId: notificationData.trip_id || 'general',
            driverId: notificationData.driver_id,
            driverName: notificationData.driver_name || 'Driver',
            jeepneyNumber: notificationData.jeepney_number || 'Unknown',
            checkpointName: notificationData.current_location,
            message: notification.message,
            timestamp: notification.created_at,
            data: notificationData
          };
        } else {
          console.log('📡 No endpoint notifications found in response');
        }
      } catch (fetchError) {
        console.error('📡 Failed to fetch endpoint notifications from backend:', fetchError);
        return null;
      }
      
      return null;
    } catch (error) {
      console.error('Error checking for endpoint notifications:', error);
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
