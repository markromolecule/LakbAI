import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';

export interface DriverLocationNotification {
  type: 'driver_location_update';
  driverId: string;
  driverName: string;
  jeepneyNumber: string;
  route: string;
  location: string;
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

  async initialize() {
    if (this.initialized) return;

    // Configure notification settings
    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    this.initialized = true;
  }

  /**
   * Send notification to passengers about driver location update
   */
  async notifyPassengerDriverLocation(notification: DriverLocationNotification) {
    try {
      await this.initialize();

      // For development, we'll show a mock notification
      // In production, this would send push notifications to registered passengers
      console.log('📍 Driver Location Notification:', notification);

      // Simulate sending to nearby passengers
      const mockPassengerNotification = {
        title: `🚍 Jeepney ${notification.jeepneyNumber} Arrived!`,
        body: `${notification.driverName} is now at ${notification.location}`,
        data: {
          type: 'driver_location',
          driverId: notification.driverId,
          location: notification.location,
          jeepneyNumber: notification.jeepneyNumber,
        },
      };

      // In a real app, this would be sent via backend API to all subscribed passengers
      // For demo purposes, we'll show a local notification
      await this.scheduleLocalNotification(mockPassengerNotification);

      return {
        success: true,
        notificationsSent: this.getMockPassengerCount(notification.location),
        message: `Notified passengers about driver arrival at ${notification.location}`,
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
   */
  async notifyDriverPaymentReceived(notification: PaymentNotification) {
    try {
      await this.initialize();

      console.log('💰 Payment Notification:', notification);

      const paymentNotification = {
        title: '💰 Payment Received!',
        body: `You received ₱${notification.amount} from a passenger`,
        data: {
          type: 'payment_received',
          amount: notification.amount,
          tripId: notification.tripId,
        },
      };

      await this.scheduleLocalNotification(paymentNotification);

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
        trigger: { seconds: 1 },
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
}

export const notificationService = new NotificationService();
export default notificationService;
