/**
 * Local Notification System Demo
 * 
 * This demonstrates the new local notification system that replaces device-to-device communication
 * with app-internal notifications triggered by data updates.
 */

import { localNotificationService } from './localNotificationService';
import { earningsService } from './earningsService';
import { tripTrackingService } from './tripTrackingService';

export class LocalNotificationDemo {
  /**
   * Demo Case 1: Driver Earnings Notification
   * 
   * Trigger: When driver app calls earningsService.refreshDriverEarnings() and detects earnings increase
   * Effect: Driver receives local notification about earnings update
   */
  static async demonstrateEarningsNotification(driverId: string) {
    console.log('🔔 === DEMO: Driver Earnings Notification ===');
    
    // Step 1: Simulate passenger payment (this happens in passenger app)
    const earningsUpdate = {
      driverId: driverId,
      amount: 15,
      tripId: `demo_trip_${Date.now()}`,
      passengerId: 'demo_passenger',
      timestamp: new Date().toISOString(),
      paymentMethod: 'xendit' as const,
      pickupLocation: 'SM City Mall',
      destination: 'Ayala Center',
      originalFare: 15,
      finalFare: 15,
      incrementTripCount: false
    };

    console.log('💰 Step 1: Simulating passenger payment (in passenger app):', earningsUpdate);
    
    // This updates earnings but does NOT trigger notification (passenger app)
    const updateResult = await earningsService.updateDriverEarnings(earningsUpdate);
    
    if (updateResult.success) {
      console.log('✅ Earnings updated in database (no notification yet)');
      
      // Step 2: Simulate driver app refreshing earnings (this WILL trigger notification)
      console.log('🔄 Step 2: Driver app refreshing earnings...');
      const refreshResult = await earningsService.refreshDriverEarnings(driverId);
      
      console.log('✅ Driver app loaded earnings');
      console.log('🔔 Driver should now receive notification: "💰 Earnings Updated! You received ₱15. Today\'s earnings: ₱XXX"');
    } else {
      console.error('❌ Failed to update earnings:', updateResult.error);
    }
  }

  /**
   * Demo Case 2: Driver Location Notification
   * 
   * Trigger: When driver scans QR code and tripTrackingService.addCheckpoint is called
   * Effect: Passengers receive local notification about driver location update
   */
  static async demonstrateLocationNotification(driverId: string) {
    console.log('🔔 === DEMO: Driver Location Notification ===');
    
    // Simulate driver scanning a checkpoint QR code
    const checkpoint = {
      id: 'checkpoint_001',
      name: 'SM City Mall',
      type: 'checkpoint' as const,
      coordinates: { latitude: 14.5995, longitude: 120.9842 }
    };

    console.log('📍 Simulating driver QR scan at:', checkpoint.name);
    
    // First, we need an active trip for the driver
    const tripStartResult = await tripTrackingService.startTrip(
      driverId,
      {
        name: 'Demo Driver',
        jeepneyNumber: 'ABC-123',
        route: 'Route 1'
      },
      {
        id: 'start_001',
        name: 'Starting Point',
        type: 'start',
        coordinates: { latitude: 14.5985, longitude: 120.9832 }
      }
    );

    if (tripStartResult.success) {
      console.log('✅ Trip started successfully');
      
      // Now add the checkpoint (this triggers location notification)
      const checkpointResult = await tripTrackingService.addCheckpoint(driverId, checkpoint);
      
      if (checkpointResult.success) {
        console.log('✅ Checkpoint added successfully');
        console.log('🔔 Passengers should receive notification: "📍 Driver Location Update - SM City Mall"');
      } else {
        console.error('❌ Failed to add checkpoint:', checkpointResult.message);
      }
    } else {
      console.error('❌ Failed to start trip:', tripStartResult.message);
    }
  }

  /**
   * Demo the notification history feature
   */
  static demonstrateNotificationHistory() {
    console.log('🔔 === DEMO: Notification History ===');
    
    const history = localNotificationService.getNotificationHistory();
    console.log(`📋 Total notifications in history: ${history.length}`);
    
    const earningsNotifications = localNotificationService.getNotificationsByType('earnings_update');
    console.log(`💰 Earnings notifications: ${earningsNotifications.length}`);
    
    const locationNotifications = localNotificationService.getNotificationsByType('location_update');
    console.log(`📍 Location notifications: ${locationNotifications.length}`);
    
    if (history.length > 0) {
      console.log('📄 Recent notifications:');
      history.slice(0, 5).forEach((notification, index) => {
        console.log(`  ${index + 1}. ${notification.title} - ${notification.timestamp}`);
      });
    }
  }

  /**
   * Demo listener functionality
   */
  static demonstrateNotificationListeners() {
    console.log('🔔 === DEMO: Notification Listeners ===');
    
    // Add a demo listener
    const demoListener = (notification: any) => {
      console.log(`🔔 RECEIVED NOTIFICATION:`, {
        type: notification.type,
        title: notification.title,
        body: notification.body,
        timestamp: notification.timestamp
      });
    };

    localNotificationService.addListener(demoListener);
    console.log('✅ Demo listener added');
    
    // Later, remove the listener
    setTimeout(() => {
      localNotificationService.removeListener(demoListener);
      console.log('🗑️ Demo listener removed');
    }, 10000);
  }

  /**
   * Run all demos
   */
  static async runAllDemos(driverId: string = 'demo_driver_001') {
    console.log('🚀 === STARTING LOCAL NOTIFICATION SYSTEM DEMO ===');
    console.log('');
    
    // Demo listeners
    this.demonstrateNotificationListeners();
    console.log('');
    
    // Demo earnings notification
    await this.demonstrateEarningsNotification(driverId);
    console.log('');
    
    // Demo location notification
    await this.demonstrateLocationNotification(driverId);
    console.log('');
    
    // Demo notification history
    this.demonstrateNotificationHistory();
    console.log('');
    
    console.log('✅ === DEMO COMPLETED ===');
    console.log('');
    console.log('📝 Summary:');
    console.log('  • Case 1: Driver earnings notifications triggered by passenger payments');
    console.log('  • Case 2: Passenger location notifications triggered by driver QR scans');
    console.log('  • No device-to-device communication required');
    console.log('  • All notifications are local and based on app state changes');
  }
}

/**
 * Usage Examples:
 * 
 * // Run all demos
 * LocalNotificationDemo.runAllDemos('driver_123');
 * 
 * // Run individual demos
 * LocalNotificationDemo.demonstrateEarningsNotification('driver_123');
 * LocalNotificationDemo.demonstrateLocationNotification('driver_123');
 * LocalNotificationDemo.demonstrateNotificationHistory();
 */
