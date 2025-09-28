import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import sessionManager from './sessionManager';

export interface LocalNotificationData {
  id: string;
  title: string;
  body: string;
  data?: any;
  timestamp: string;
}

export interface EarningsNotificationData extends LocalNotificationData {
  type: 'earnings_update';
  driverId: string;
  amount: number;
  tripId?: string;
  paymentMethod?: string;
  previousEarnings: number;
  newEarnings: number;
  senderName?: string; // Name of the passenger who made the payment
}

export interface LocationNotificationData extends LocalNotificationData {
  type: 'location_update';
  driverId: string;
  driverName: string;
  jeepneyNumber: string;
  route: string;
  currentLocation: string;
  previousLocation?: string;
  coordinates?: { latitude: number; longitude: number };
}

type NotificationListener = (notification: LocalNotificationData) => void;

class LocalNotificationService {
  private listeners: NotificationListener[] = [];
  private notificationHistory: LocalNotificationData[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Request notification permissions first
      const { status } = await Notifications.requestPermissionsAsync();
      console.log('📱 Notification permission status:', status);
      
      if (status !== 'granted') {
        console.warn('⚠️ Notification permissions not granted, notifications may not work');
      }

      // Configure notification settings for Expo notifications
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
      console.log('✅ LocalNotificationService initialized with Expo notifications');
    } catch (error) {
      console.error('❌ Failed to initialize LocalNotificationService:', error);
    }
  }

  /**
   * Check if we're running in the driver app
   */
  private async isDriverApp(): Promise<boolean> {
    try {
      console.log('🔍 App type detection: checking for driver app context');
      
      // Get the current user session to determine app type
      const session = await sessionManager.getUserSession();
      
      if (session && session.userType === 'driver') {
        console.log('✅ Driver app detected via session: showing Expo notifications');
        return true;
      } else {
        console.log('🚫 Passenger app detected via session: not showing system notifications');
        return false;
      }
    } catch (error) {
      // If we can't determine the app type, default to NOT showing notifications
      // This prevents the passenger app from receiving unwanted notifications
      console.log('⚠️ Could not determine app type, defaulting to NOT showing system notifications');
      return false;
    }
  }

  /**
   * Create a passenger-friendly payment notification
   */
  private createPassengerPaymentNotification(earningsNotification: EarningsNotificationData): LocalNotificationData {
    const senderName = earningsNotification.senderName || 'Unknown';
    const amount = earningsNotification.amount;
    
    return {
      id: `passenger_payment_${Date.now()}`,
      title: 'Payment Successful!',
      body: `Sent ₱${amount} to ${senderName}`,
      data: {
        type: 'payment_confirmation',
        amount: amount,
        driverName: senderName,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Add a listener for local notifications
   */
  addListener(listener: NotificationListener) {
    this.listeners.push(listener);
    console.log(`📱 Added notification listener (total: ${this.listeners.length})`);
  }

  /**
   * Remove a listener
   */
  removeListener(listener: NotificationListener) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
      console.log(`📱 Removed notification listener (total: ${this.listeners.length})`);
    }
  }

  /**
   * Send a local notification about driver earnings update
   */
  async notifyEarningsUpdate(data: Omit<EarningsNotificationData, 'id' | 'timestamp'>): Promise<void> {
    await this.initialize();

    const notification: EarningsNotificationData = {
      ...data,
      id: `earnings_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    // Add to history
    this.notificationHistory.unshift(notification);
    
    // Keep only last 50 notifications
    if (this.notificationHistory.length > 50) {
      this.notificationHistory = this.notificationHistory.slice(0, 50);
    }

    console.log('💰 Earnings notification:', {
      driverId: notification.driverId,
      amount: notification.amount,
      previousEarnings: notification.previousEarnings,
      newEarnings: notification.newEarnings,
      difference: notification.newEarnings - notification.previousEarnings
    });

    // Notify all listeners (this will trigger the EarningsNotificationDisplay component)
    this.listeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('❌ Error in notification listener:', error);
      }
    });

    // Only show system notifications for driver app
    // Passenger app will only show in-app notifications through LocationNotificationDisplay
    const isDriverApp = await this.isDriverApp();
    
    if (isDriverApp) {
      try {
        // Driver app: Show earnings notification as system notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: notification.title,
            body: notification.body,
            data: notification.data || {},
          },
          trigger: null,
        });
        console.log(`📱 ${notification.type} Expo notification sent to DRIVER app:`, notification.title);
      } catch (error) {
        console.error('❌ Failed to show Expo notification:', error);
        // Fallback to alert
        Alert.alert(notification.title, notification.body);
      }
    } else {
      // Passenger app: Do NOT show system notifications
      // The passenger app will handle notifications through LocationNotificationDisplay component
      console.log(`🚫 Skipping system notification for PASSENGER app - using in-app notifications only`);
    }
  }

  /**
   * Send a local notification about driver location update
   */
  async notifyLocationUpdate(data: Omit<LocationNotificationData, 'id' | 'timestamp'>): Promise<void> {
    await this.initialize();

    console.log('📱 LocalNotificationService: Sending location notification:', {
      driver: data.driverName,
      from: data.previousLocation,
      to: data.currentLocation
    });

    const notification: LocationNotificationData = {
      ...data,
      id: `location_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    // Add to history
    this.notificationHistory.unshift(notification);
    
    // Keep only last 50 notifications
    if (this.notificationHistory.length > 50) {
      this.notificationHistory = this.notificationHistory.slice(0, 50);
    }

    console.log('📍 Location notification:', {
      driverId: notification.driverId,
      driverName: notification.driverName,
      currentLocation: notification.currentLocation,
      previousLocation: notification.previousLocation,
      route: notification.route
    });

    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('❌ Error in notification listener:', error);
      }
    });

    // Show Expo notification
    try {
      console.log('📱 Attempting to show Expo notification:', {
        title: notification.title,
        body: notification.body,
        type: notification.type
      });
      
      const notificationRequest = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
        },
        trigger: null,
      });
      
      console.log(`✅ Expo notification scheduled successfully:`, {
        id: notificationRequest,
        title: notification.title,
        body: notification.body
      });
    } catch (error) {
      console.error('❌ Failed to show Expo notification:', error);
      console.error('❌ Error details:', error.message);
      
      // Fallback to alert for debugging
      Alert.alert(
        `🔔 ${notification.title}`, 
        `${notification.body}\n\n(Notification failed: ${error.message})`
      );
    }
  }

  /**
   * Get notification history
   */
  getNotificationHistory(): LocalNotificationData[] {
    return [...this.notificationHistory];
  }

  /**
   * Clear notification history
   */
  clearNotificationHistory(): void {
    this.notificationHistory = [];
    console.log('🗑️ Cleared notification history');
  }

  /**
   * Get notifications of a specific type
   */
  getNotificationsByType(type: string): LocalNotificationData[] {
    return this.notificationHistory.filter(notification => 
      'type' in notification && (notification as any).type === type
    );
  }
}

export const localNotificationService = new LocalNotificationService();
