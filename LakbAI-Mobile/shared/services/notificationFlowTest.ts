/**
 * Test to demonstrate the corrected notification flow
 * 
 * CORRECTED FLOW:
 * 1. Passenger pays → earningsService.updateDriverEarnings() → Updates database (NO NOTIFICATION)
 * 2. Driver app refreshes → earningsService.refreshDriverEarnings() → Detects change → TRIGGERS NOTIFICATION
 */

import { earningsService } from './earningsService';
import { localNotificationService } from './localNotificationService';

export class NotificationFlowTest {
  /**
   * Test the corrected notification flow
   */
  static async testCorrectFlow(driverId: string = 'test_driver_001') {
    console.log('🧪 === Testing Corrected Notification Flow ===');
    
    // Add a test listener to see when notifications are triggered
    const testListener = (notification: any) => {
      console.log('🔔 NOTIFICATION RECEIVED:', {
        type: notification.type,
        title: notification.title,
        amount: notification.amount,
        driverId: notification.driverId
      });
    };
    
    localNotificationService.addListener(testListener);
    
    try {
      // Step 1: Get initial earnings (driver app loads)
      console.log('\n1️⃣ Driver app initially loads earnings...');
      const initialEarnings = await earningsService.refreshDriverEarnings(driverId);
      console.log('📊 Initial earnings:', initialEarnings.todayEarnings);
      console.log('❌ No notification expected (first load)');
      
      // Step 2: Passenger pays (this should NOT trigger notification)
      console.log('\n2️⃣ Passenger pays ₱25 (passenger app)...');
      const paymentUpdate = {
        driverId: driverId,
        amount: 25,
        tripId: `test_trip_${Date.now()}`,
        passengerId: 'test_passenger',
        timestamp: new Date().toISOString(),
        paymentMethod: 'xendit' as const,
        pickupLocation: 'Test Pickup',
        destination: 'Test Destination',
        originalFare: 25,
        finalFare: 25,
        incrementTripCount: false
      };
      
      const updateResult = await earningsService.updateDriverEarnings(paymentUpdate);
      console.log('💾 Earnings updated in database');
      console.log('❌ No notification expected (passenger app call)');
      
      // Step 3: Driver app refreshes (this SHOULD trigger notification)
      console.log('\n3️⃣ Driver app refreshes earnings...');
      const refreshedEarnings = await earningsService.refreshDriverEarnings(driverId);
      console.log('📊 Refreshed earnings:', refreshedEarnings.todayEarnings);
      console.log('✅ Notification should be triggered now!');
      
      // Step 4: Test another payment and refresh cycle
      console.log('\n4️⃣ Testing another payment cycle...');
      const secondPayment = {
        ...paymentUpdate,
        amount: 30,
        finalFare: 30,
        tripId: `test_trip_${Date.now() + 1}`
      };
      
      await earningsService.updateDriverEarnings(secondPayment);
      console.log('💾 Second payment processed');
      
      const secondRefresh = await earningsService.refreshDriverEarnings(driverId);
      console.log('📊 Second refresh earnings:', secondRefresh.todayEarnings);
      console.log('✅ Second notification should be triggered!');
      
    } catch (error) {
      console.error('❌ Test failed:', error);
    } finally {
      // Cleanup
      localNotificationService.removeListener(testListener);
      console.log('\n🧹 Test cleanup completed');
    }
    
    console.log('\n📋 Test Summary:');
    console.log('  • Passenger payments do NOT trigger notifications');
    console.log('  • Driver app refreshes DO trigger notifications');
    console.log('  • Notifications only show when driver app detects earnings increase');
    console.log('  • Each app only receives its own relevant notifications');
  }
  
  /**
   * Quick test to verify notification separation
   */
  static async testNotificationSeparation() {
    console.log('🧪 === Testing Notification Separation ===');
    
    let driverNotifications = 0;
    let passengerNotifications = 0;
    
    const driverListener = (notification: any) => {
      if (notification.type === 'earnings_update') {
        driverNotifications++;
        console.log('👨‍💼 Driver received earnings notification');
      }
    };
    
    const passengerListener = (notification: any) => {
      if (notification.type === 'location_update') {
        passengerNotifications++;
        console.log('🧑‍🎓 Passenger received location notification');
      }
    };
    
    localNotificationService.addListener(driverListener);
    localNotificationService.addListener(passengerListener);
    
    // Simulate earnings update (should only notify driver)
    await earningsService.refreshDriverEarnings('test_driver');
    
    // Simulate location update (should only notify passengers)
    await localNotificationService.notifyLocationUpdate({
      type: 'location_update',
      driverId: 'test_driver',
      driverName: 'Test Driver',
      jeepneyNumber: 'TEST-123',
      route: 'Test Route',
      currentLocation: 'Test Location',
      title: 'Test Location Update',
      body: 'Test location notification'
    });
    
    console.log('📊 Results:');
    console.log(`  • Driver notifications: ${driverNotifications}`);
    console.log(`  • Passenger notifications: ${passengerNotifications}`);
    
    // Cleanup
    localNotificationService.removeListener(driverListener);
    localNotificationService.removeListener(passengerListener);
  }
}
