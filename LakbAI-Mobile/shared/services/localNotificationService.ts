import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';

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
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
        },
        trigger: null,
      });
      console.log(`📱 ${notification.type} Expo notification sent:`, notification.title);
    } catch (error) {
      console.error('❌ Failed to show Expo notification:', error);
      // Fallback to alert
      Alert.alert(notification.title, notification.body);
    }
  }

  /**
   * Send a local notification about driver location update
   */
  async notifyLocationUpdate(data: Omit<LocationNotificationData, 'id' | 'timestamp'>): Promise<void> {
    await this.initialize();

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
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
        },
        trigger: null,
      });
      console.log(`📱 ${notification.type} Expo notification sent:`, notification.title);
    } catch (error) {
      console.error('❌ Failed to show Expo notification:', error);
      // Fallback to alert
      Alert.alert(notification.title, notification.body);
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
