import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';

export interface DriverLocationNotification {
  type: 'driver_location_update';
  driverId: string;
  driverName: string;
  jeepneyNumber: string;
  route: string;
  currentLocation: string;
  timestamp: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface PaymentNotification {
  type: 'payment_received';
  driverId: string;
  amount: number;
  passengerId: string;
  tripId: string;
  timestamp: string;
}

export interface ConflictResolutionData {
  location: string;
  drivers: Array<{
    id: string;
    name: string;
    jeepneyNumber: string;
    route: string;
    distance?: number;
    estimatedArrival?: string;
  }>;
}

class NotificationService {
  private initialized = false;
  private driverLocationNotifications: DriverLocationNotification[] = [];

  async initialize() {
    if (this.initialized) return;

    // Configure notification settings
    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    this.initialized = true;
  }

  /**
   * Send notification to passengers about driver location update
   * This is called when driver scans QR and updates location, so it should always show the notification
   */
  async notifyPassengerDriverLocation(notification: DriverLocationNotification) {
    try {
      await this.initialize();

      console.log('📍 Driver Location Notification (Location Updated):', notification);

      // Store the notification for passengers to view
      this.storeDriverLocationNotification(notification);

      // Since this is called when driver location is updated, always show the notification
      const passengerNotification = {
        title: `🚍 Jeepney ${notification.jeepneyNumber} Location Update!`,
        body: `${notification.driverName} is now at ${notification.currentLocation}`,
        data: {
          type: 'driver_location_update',
          driverId: notification.driverId,
          driverName: notification.driverName,
          jeepneyNumber: notification.jeepneyNumber,
          route: notification.route,
          currentLocation: notification.currentLocation,
          timestamp: notification.timestamp,
          source: 'location_update',
          target: 'passenger', // Specify this notification is for passenger
        },
      };

      await this.scheduleLocalNotification(passengerNotification);
      console.log('📱 Location notification sent - driver location updated:', notification.currentLocation);
      console.log('📱 NOTE: This notification should appear on the PASSENGER device');

      return {
        success: true,
        notificationsSent: 1,
        message: `Passengers notified about driver location: ${notification.currentLocation}`,
      };
    } catch (error) {
      console.error('Failed to send driver location notification:', error);
      return {
        success: false,
        error: 'Failed to send notifications',
      };
    }
  }

  /**
   * Send payment confirmation to driver
   * This is called when earnings are updated, so it should always show the notification
   */
  async notifyDriverPaymentReceived(notification: PaymentNotification) {
    try {
      await this.initialize();

      console.log('💰 Payment Notification (Earnings Updated):', notification);

      // Since this is called when earnings are updated, always show the notification
      const paymentNotification = {
        title: '💰 Payment Received!',
        body: `You received ₱${notification.amount} from a passenger`,
        data: {
          type: 'payment_received',
          amount: notification.amount,
          tripId: notification.tripId,
          driverId: notification.driverId,
          source: 'earnings_update',
          target: 'driver', // Specify this notification is for driver
        },
      };

      await this.scheduleLocalNotification(paymentNotification);
      console.log('📱 Payment notification sent - earnings updated for driver:', notification.driverId);
      console.log('📱 NOTE: This notification should appear on the DRIVER device');

      return {
        success: true,
        message: `Driver notified of ₱${notification.amount} payment`,
      };
    } catch (error) {
      console.error('Failed to send payment notification:', error);
      return {
        success: false,
        error: 'Failed to send payment notification',
      };
    }
  }

  /**
   * Handle location conflicts when multiple drivers are at same location
   */
  async handleLocationConflict(conflictData: ConflictResolutionData) {
    try {
      console.log('⚠️ Location Conflict Detected:', conflictData);

      // Strategy 1: Show nearest driver first
      const sortedDrivers = conflictData.drivers.sort((a, b) => 
        (a.distance || 0) - (b.distance || 0)
      );

      // Strategy 2: Provide passenger choice
      const choiceNotification = {
        title: `Multiple Jeepneys at ${conflictData.location}`,
        body: `${conflictData.drivers.length} jeepneys available. Choose your preferred option.`,
        data: {
          type: 'location_conflict',
          location: conflictData.location,
          drivers: sortedDrivers,
        },
      };

      await this.scheduleLocalNotification(choiceNotification);

      // For passengers in the app, show selection dialog
      this.showDriverSelectionDialog(conflictData);

      return {
        success: true,
        strategy: 'passenger_choice',
        drivers: sortedDrivers,
      };
    } catch (error) {
      console.error('Failed to handle location conflict:', error);
      return {
        success: false,
        error: 'Failed to resolve location conflict',
      };
    }
  }

  /**
   * Schedule a local notification (for demo purposes)
   */
  private async scheduleLocalNotification(notification: {
    title: string;
    body: string;
    data?: any;
  }) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to schedule local notification:', error);
      // Fallback to alert for demo
      Alert.alert(notification.title, notification.body);
    }
  }

  /**
   * Show driver selection dialog for location conflicts
   */
  private showDriverSelectionDialog(conflictData: ConflictResolutionData) {
    const driverOptions = conflictData.drivers.map(driver => ({
      text: `${driver.jeepneyNumber} - ${driver.name} ${driver.distance ? `(${driver.distance}m away)` : ''}`,
      onPress: () => {
        console.log('Passenger selected driver:', driver.id);
        // In real app, this would update passenger's preferred driver selection
      },
    }));

    Alert.alert(
      'Multiple Jeepneys Available',
      `Choose your preferred jeepney at ${conflictData.location}:`,
      [
        ...driverOptions,
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }

  /**
   * Mock function to simulate passenger count for a location
   */
  private getMockPassengerCount(location: string): number {
    // Simulate different passenger counts based on location
    const locationCounts: Record<string, number> = {
      'Robinson Galleria Cebu': 15,
      'Ayala Center Cebu': 22,
      'SM City Cebu': 18,
      'Colon Street': 8,
      'University of San Carlos': 12,
      'Cebu IT Park': 25,
    };

    return locationCounts[location] || Math.floor(Math.random() * 10) + 5;
  }

  /**
   * Request notification permissions
   */
  async requestPermissions() {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }

  /**
   * Subscribe passenger to driver location updates
   */
  async subscribeToDriverUpdates(passengerId: string, route: string, preferences?: {
    radius?: number; // notification radius in meters
    onlyWhenWaiting?: boolean;
  }) {
    // In real implementation, this would register the passenger for push notifications
    console.log(`Passenger ${passengerId} subscribed to updates for route: ${route}`);
    
    return {
      success: true,
      subscriptionId: `sub_${passengerId}_${Date.now()}`,
      route,
      preferences: preferences || { radius: 500, onlyWhenWaiting: true },
    };
  }

  /**
   * Unsubscribe passenger from driver location updates
   */
  async unsubscribeFromDriverUpdates(subscriptionId: string) {
    console.log(`Unsubscribed from driver updates: ${subscriptionId}`);
    return { success: true };
  }

  /**
   * Store driver location notification for passengers to view
   */
  private storeDriverLocationNotification(notification: DriverLocationNotification) {
    try {
      // Add new notification
      this.driverLocationNotifications.push(notification);
      
      // Keep only last 20 notifications to prevent memory issues
      if (this.driverLocationNotifications.length > 20) {
        this.driverLocationNotifications = this.driverLocationNotifications.slice(-20);
      }
      
      console.log('📱 Stored driver location notification for passengers:', notification.currentLocation);
    } catch (error) {
      console.error('❌ Failed to store driver location notification:', error);
    }
  }

  /**
   * Get stored driver location notifications
   */
  getStoredDriverLocationNotifications(): DriverLocationNotification[] {
    try {
      return this.driverLocationNotifications || [];
    } catch (error) {
      console.error('❌ Failed to get stored notifications:', error);
      return [];
    }
  }

  /**
   * Clear all stored driver location notifications
   */
  clearDriverLocationNotifications(): void {
    try {
      this.driverLocationNotifications = [];
      console.log('🧹 Cleared all driver location notifications');
    } catch (error) {
      console.error('❌ Failed to clear notifications:', error);
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
