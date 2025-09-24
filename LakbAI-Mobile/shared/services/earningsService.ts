import { Alert } from 'react-native';
// Removed old notificationService - using only localNotificationService for driver app notifications
import { localNotificationService } from './localNotificationService';

export interface EarningsUpdate {
  driverId: string;
  amount: number;
  tripId: string;
  passengerId: string;
  timestamp: string;
  paymentMethod: 'xendit' | 'cash' | 'other';
  pickupLocation: string;
  destination: string;
  originalFare: number;
  discountAmount?: number;
  finalFare: number;
  incrementTripCount?: boolean; // IMPORTANT: Only set to true for trip completion, NOT for passenger payments
}

export interface DriverEarnings {
  todayEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  yearlyEarnings: number;
  totalEarnings: number; // Lifetime earnings across all shifts
  totalTrips: number;
  todayTrips: number;
  weeklyTrips: number;
  monthlyTrips: number;
  yearlyTrips: number;
  averageFarePerTrip: number;
  lastUpdate: string;
}

class EarningsService {
  private earnings: Map<string, DriverEarnings> = new Map();
  private previousEarnings: Map<string, DriverEarnings> = new Map(); // Track previous earnings for comparison
  private listeners = new Set<(driverId: string) => void>();
  private lastResetDate: string = new Date().toDateString(); // Track last reset date

  /**
   * Get driver earnings from database API
   */
  async getDriverEarningsFromAPI(driverId: string): Promise<DriverEarnings | null> {
    try {
      const { getBaseUrl } = await import('../../config/apiConfig');
      const baseUrl = getBaseUrl().replace('/routes/api.php', '');
      const apiUrl = `${baseUrl}/api/earnings/driver/${driverId}`;
      
      console.log('💰 Fetching earnings from API:', apiUrl);
      
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const result = await response.json();
        console.log('💰 API earnings response:', result);
        
        if (result.status === 'success' && result.earnings) {
          return {
            todayEarnings: result.earnings.todayEarnings,
            todayTrips: result.earnings.todayTrips,
            weeklyEarnings: result.earnings.weeklyEarnings,
            weeklyTrips: result.earnings.weeklyTrips || 0,
            monthlyEarnings: result.earnings.monthlyEarnings,
            monthlyTrips: result.earnings.monthlyTrips || 0,
            yearlyEarnings: result.earnings.yearlyEarnings || 0,
            yearlyTrips: result.earnings.yearlyTrips || 0,
            totalEarnings: result.earnings.totalEarnings || 0,
            totalTrips: result.earnings.totalTrips,
            averageFarePerTrip: result.earnings.averageFarePerTrip,
            lastUpdate: result.earnings.lastUpdate,
          };
        }
      } else {
        console.warn('⚠️ Earnings API error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Failed to fetch earnings from API:', error);
    }
    
    return null;
  }

  /**
   * Save earnings to database API
   */
  async saveEarningsToAPI(update: EarningsUpdate): Promise<boolean> {
    try {
      const { getBaseUrl } = await import('../../config/apiConfig');
      const baseUrl = getBaseUrl().replace('/routes/api.php', '');
      const apiUrl = `${baseUrl}/api/earnings/add`;
      
      const payload = {
        driverId: update.driverId,
        tripId: update.tripId,
        passengerId: update.passengerId,
        finalFare: update.finalFare,
        originalFare: update.originalFare,
        discountAmount: update.discountAmount,
        paymentMethod: update.paymentMethod,
        pickupLocation: update.pickupLocation,
        destination: update.destination,
        incrementTripCount: update.incrementTripCount // 🔥 CRITICAL FIX: Send incrementTripCount to API
      };
      
      console.log('💾 Saving earnings to API:', apiUrl, payload);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Earnings saved to database:', result);
        return result.status === 'success';
      } else {
        console.error('❌ Failed to save earnings:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
      }
    } catch (error) {
      console.error('❌ Error saving earnings to API:', error);
    }
    
    return false;
  }

  /**
   * Initialize or get driver earnings (fallback to memory)
   */
  private getDriverEarnings(driverId: string): DriverEarnings {
    // Check if we need to reset today's trips (24-hour reset)
    this.checkAndResetDailyTrips(driverId);
    
    if (!this.earnings.has(driverId)) {
      // Initialize with zeros as requested (real earnings will be updated when payments are made)
      this.earnings.set(driverId, {
        todayEarnings: 0,
        weeklyEarnings: 0,
        monthlyEarnings: 0,
        yearlyEarnings: 0,
        totalEarnings: 0,
        totalTrips: 0,
        todayTrips: 0,
        weeklyTrips: 0,
        monthlyTrips: 0,
        yearlyTrips: 0,
        averageFarePerTrip: 0,
        lastUpdate: new Date().toISOString(),
      });
    }
    return this.earnings.get(driverId)!;
  }

  /**
   * Check if we need to reset today's trips (5:00 AM reset)
   */
  private checkAndResetDailyTrips(driverId: string): void {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDate = now.toDateString();
    
    // Check if it's 5:00 AM or later and we haven't reset today
    const shouldReset = currentHour >= 5 && this.lastResetDate !== currentDate;
    
    if (shouldReset) {
      console.log('🔄 5:00 AM reset time reached - resetting today\'s trips for all drivers');
      
      // Reset today's trips for all drivers
      this.earnings.forEach((earnings, id) => {
        const updatedEarnings = {
          ...earnings,
          todayEarnings: 0,
          todayTrips: 0,
          lastUpdate: new Date().toISOString()
        };
        this.earnings.set(id, updatedEarnings);
        console.log(`🔄 Reset today\'s data for driver ${id}:`, {
          todayEarnings: updatedEarnings.todayEarnings,
          todayTrips: updatedEarnings.todayTrips
        });
      });
      
      // Update last reset date
      this.lastResetDate = currentDate;
      
      // Notify all listeners about the reset
      this.listeners.forEach(listener => {
        try {
          listener(driverId);
        } catch (error) {
          console.error('❌ Error notifying listener about daily reset:', error);
        }
      });
    }
  }

  /**
   * Update driver earnings when a passenger pays
   */
  async updateDriverEarnings(update: EarningsUpdate): Promise<{
    success: boolean;
    newEarnings?: DriverEarnings;
    error?: string;
  }> {
    try {
      console.log('💰 Processing earnings update:', update);
      console.log('🔍 Call stack trace:', new Error().stack);
      console.log('🔍 incrementTripCount value:', update.incrementTripCount, 'type:', typeof update.incrementTripCount);
      console.log('🔍 DETAILED ANALYSIS:');
      console.log('  - incrementTripCount present:', 'incrementTripCount' in update);
      console.log('  - incrementTripCount undefined:', update.incrementTripCount === undefined);
      console.log('  - incrementTripCount null:', update.incrementTripCount === null);
      console.log('  - incrementTripCount true:', update.incrementTripCount === true);
      console.log('  - incrementTripCount false:', update.incrementTripCount === false);
      console.log('  - Payment context:', update.passengerId?.includes('passenger') ? 'PASSENGER_PAYMENT' : 'OTHER');

      const currentEarnings = this.getDriverEarnings(update.driverId);

      // Calculate trip count increment (only when explicitly requested)
      // DEFAULT: Do NOT increment trip count unless explicitly set to true
      // This ensures payments don't accidentally increment trip counts
      const tripIncrement = update.incrementTripCount === true ? 1 : 0;
      
      // Calculate new earnings
      const newEarnings: DriverEarnings = {
        todayEarnings: currentEarnings.todayEarnings + update.finalFare,
        weeklyEarnings: currentEarnings.weeklyEarnings + update.finalFare,
        monthlyEarnings: currentEarnings.monthlyEarnings + update.finalFare,
        yearlyEarnings: currentEarnings.yearlyEarnings + update.finalFare,
        totalEarnings: currentEarnings.totalEarnings + update.finalFare,
        totalTrips: currentEarnings.totalTrips + tripIncrement,
        todayTrips: currentEarnings.todayTrips + tripIncrement,
        weeklyTrips: currentEarnings.weeklyTrips + tripIncrement,
        monthlyTrips: currentEarnings.monthlyTrips + tripIncrement,
        yearlyTrips: currentEarnings.yearlyTrips + tripIncrement,
        averageFarePerTrip: (currentEarnings.todayTrips + tripIncrement) > 0 
          ? Math.round((currentEarnings.todayEarnings + update.finalFare) / (currentEarnings.todayTrips + tripIncrement))
          : 0,
        lastUpdate: update.timestamp,
      };

      console.log('🔄 Trip count update:', {
        driverId: update.driverId,
        incrementTripCount: update.incrementTripCount,
        tripIncrement: tripIncrement,
        previousTodayTrips: currentEarnings.todayTrips,
        newTodayTrips: newEarnings.todayTrips,
        previousTotalTrips: currentEarnings.totalTrips,
        newTotalTrips: newEarnings.totalTrips,
        context: update.passengerId === 'trip_completion' ? 'TRIP_COMPLETION' : 'PASSENGER_PAYMENT',
        shouldIncrementTrips: tripIncrement > 0 ? 'YES - Trip completed' : 'NO - Payment only'
      });

      // Update stored earnings
      this.earnings.set(update.driverId, newEarnings);

      // Note: Local notification will be triggered when driver app refreshes earnings data
      // This prevents passenger app from triggering notifications meant for drivers

      // Removed direct payment notification - driver will be notified when their app refreshes earnings
      console.log('💰 Payment processed - driver will be notified when their app refreshes earnings data');
      
      // Save to database API
      await this.saveEarningsToAPI(update);
      
      // Trigger driver profile refresh event
      console.log('📱 Driver profile should refresh now to show updated earnings');
      console.log('🔔 Notifying', this.listeners.size, 'listeners about earnings update for driver:', update.driverId);
      this.notifyListeners(update.driverId);
      console.log('✅ Listener notifications sent successfully');

      // Log the transaction (in real app, this would be saved to backend)
      this.logTransaction(update);

      console.log('✅ Driver earnings updated successfully');
      console.log('New earnings:', newEarnings);

      return {
        success: true,
        newEarnings,
      };
    } catch (error) {
      console.error('❌ Failed to update driver earnings:', error);
      return {
        success: false,
        error: 'Failed to update earnings',
      };
    }
  }

  /**
   * Get current driver earnings
   */
  getEarnings(driverId: string): DriverEarnings {
    return this.getDriverEarnings(driverId);
  }

  /**
   * Check for earnings changes and trigger notification if driver earnings increased
   * This should only be called from the driver app
   */
  private async checkAndNotifyEarningsChange(driverId: string, newEarnings: DriverEarnings): Promise<void> {
    const previousEarnings = this.previousEarnings.get(driverId);
    
    if (previousEarnings && newEarnings.todayEarnings > previousEarnings.todayEarnings) {
      const earningsIncrease = newEarnings.todayEarnings - previousEarnings.todayEarnings;
      
      console.log('💰 Earnings increase detected for driver:', {
        driverId,
        previousEarnings: previousEarnings.todayEarnings,
        newEarnings: newEarnings.todayEarnings,
        increase: earningsIncrease
      });

      // Trigger local notification for the driver
      await localNotificationService.notifyEarningsUpdate({
        type: 'earnings_update',
        driverId: driverId,
        amount: earningsIncrease,
        tripId: `earnings_${Date.now()}`,
        paymentMethod: 'passenger_payment',
        previousEarnings: previousEarnings.todayEarnings,
        newEarnings: newEarnings.todayEarnings,
        title: '💰 Earnings Updated!',
        body: `You received ₱${earningsIncrease.toFixed(2)}. Today's earnings: ₱${newEarnings.todayEarnings.toFixed(2)}`,
        data: {
          driverId: driverId,
          amount: earningsIncrease,
          newTotal: newEarnings.todayEarnings,
          previousTotal: previousEarnings.todayEarnings,
          paymentMethod: 'passenger_payment'
        }
      });
    }
    
    // Update previous earnings for next comparison
    this.previousEarnings.set(driverId, { ...newEarnings });
  }

  /**
   * Get current earnings for a driver (async version - tries API first)
   */
  async getEarningsAsync(driverId: string): Promise<DriverEarnings> {
    // Try to get from API first
    const apiEarnings = await this.getDriverEarningsFromAPI(driverId);
    
    if (apiEarnings) {
      // Check for earnings changes and notify driver if increased
      await this.checkAndNotifyEarningsChange(driverId, apiEarnings);
      
      // Update local cache with API data
      this.earnings.set(driverId, apiEarnings);
      console.log('💰 Updated local earnings cache from API for driver:', driverId);
      return apiEarnings;
    }
    
    // Fallback to local cache
    console.log('💰 Using fallback local earnings for driver:', driverId);
    const localEarnings = this.getDriverEarnings(driverId);
    
    // Check for earnings changes even with local data
    await this.checkAndNotifyEarningsChange(driverId, localEarnings);
    
    return localEarnings;
  }

  /**
   * Refresh earnings for driver and check for updates (should be called by driver app)
   * This will trigger notifications if earnings have increased
   */
  async refreshDriverEarnings(driverId: string): Promise<DriverEarnings> {
    console.log('🔄 Driver app refreshing earnings for:', driverId);
    return await this.getEarningsAsync(driverId);
  }

  /**
   * Log transaction for auditing purposes
   */
  private logTransaction(update: EarningsUpdate) {
    const transaction = {
      id: `txn_${Date.now()}`,
      driverId: update.driverId,
      passengerId: update.passengerId,
      tripId: update.tripId,
      amount: update.finalFare,
      originalFare: update.originalFare,
      discountAmount: update.discountAmount || 0,
      paymentMethod: update.paymentMethod,
      route: `${update.pickupLocation} → ${update.destination}`,
      timestamp: update.timestamp,
    };

    console.log('📝 Transaction logged:', transaction);
    
    // In real implementation, this would be saved to local storage or sent to backend
    // localStorage.setItem(`transaction_${transaction.id}`, JSON.stringify(transaction));
  }

  /**
   * Get earnings summary for a specific period
   */
  getEarningsSummary(driverId: string, period: 'today' | 'week' | 'month'): {
    earnings: number;
    trips: number;
    average: number;
  } {
    const earnings = this.getDriverEarnings(driverId);

    switch (period) {
      case 'today':
        return {
          earnings: earnings.todayEarnings,
          trips: earnings.todayTrips,
          average: earnings.averageFarePerTrip,
        };
      case 'week':
        return {
          earnings: earnings.weeklyEarnings,
          trips: Math.floor(earnings.totalTrips * 0.2), // Mock weekly trips
          average: Math.round(earnings.weeklyEarnings / (earnings.totalTrips * 0.2)),
        };
      case 'month':
        return {
          earnings: earnings.monthlyEarnings,
          trips: earnings.totalTrips,
          average: Math.round(earnings.monthlyEarnings / earnings.totalTrips),
        };
      default:
        return { earnings: 0, trips: 0, average: 0 };
    }
  }

  /**
   * Simulate payment completion from Xendit
   */
  async processPaymentFromXendit(paymentData: {
    external_id: string;
    amount: number;
    status: 'PAID' | 'EXPIRED' | 'FAILED';
    paid_at?: string;
    payment_method?: string;
    customer_email?: string;
    description?: string;
  }): Promise<{
    success: boolean;
    earningsUpdate?: EarningsUpdate;
    error?: string;
  }> {
    try {
      if (paymentData.status !== 'PAID') {
        return {
          success: false,
          error: `Payment not completed: ${paymentData.status}`,
        };
      }

      // Parse trip information from external_id or description
      // In real implementation, this would come from the payment description or external_id
      const tripInfo = this.parsePaymentDescription(paymentData.description || '');

      const earningsUpdate: EarningsUpdate = {
        driverId: tripInfo.driverId || 'driver_001',
        amount: paymentData.amount,
        tripId: paymentData.external_id,
        passengerId: tripInfo.passengerId || 'passenger_001',
        timestamp: paymentData.paid_at || new Date().toISOString(),
        paymentMethod: 'xendit',
        pickupLocation: tripInfo.pickup || 'Unknown',
        destination: tripInfo.destination || 'Unknown',
        originalFare: tripInfo.originalFare || paymentData.amount,
        discountAmount: tripInfo.discountAmount || 0,
        finalFare: paymentData.amount,
        incrementTripCount: false // Don't increment trip count for Xendit payments
      };

      const result = await this.updateDriverEarnings(earningsUpdate);

      return {
        success: result.success,
        earningsUpdate: result.success ? earningsUpdate : undefined,
        error: result.error,
      };
    } catch (error) {
      console.error('Failed to process Xendit payment:', error);
      return {
        success: false,
        error: 'Failed to process payment',
      };
    }
  }

  /**
   * Parse payment description to extract trip information
   */
  private parsePaymentDescription(description: string): {
    driverId?: string;
    passengerId?: string;
    pickup?: string;
    destination?: string;
    originalFare?: number;
    discountAmount?: number;
  } {
    // Simple parsing logic - in real app, this would be more sophisticated
    const info: any = {};

    if (description.includes('LKB-')) {
      const jeepneyMatch = description.match(/LKB-(\d+)/);
      if (jeepneyMatch) {
        info.driverId = `driver_${jeepneyMatch[1]}`;
      }
    }

    if (description.includes('→')) {
      const routeMatch = description.match(/(.+?)\s*→\s*(.+?)(?:\s|$)/);
      if (routeMatch) {
        info.pickup = routeMatch[1].trim();
        info.destination = routeMatch[2].trim();
      }
    }

    return info;
  }

  /**
   * Get mock earnings data for testing
   */
  getMockEarningsUpdate(): EarningsUpdate {
    return {
      driverId: 'driver_001',
      amount: 25,
      tripId: `trip_${Date.now()}`,
      passengerId: 'passenger_001',
      timestamp: new Date().toISOString(),
      paymentMethod: 'xendit',
      pickupLocation: 'Robinson Galleria Cebu',
      destination: 'Ayala Center Cebu',
      originalFare: 30,
      discountAmount: 5,
      finalFare: 25,
      incrementTripCount: false // Mock payments should not increment trip count
    };
  }

  /**
   * Add a listener for earnings changes
   */
  addListener(callback: (driverId: string) => void): () => void {
    this.listeners.add(callback);
    console.log('👂 Registered new earnings listener. Total listeners:', this.listeners.size);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
      console.log('🔇 Removed earnings listener. Remaining listeners:', this.listeners.size);
    };
  }

  /**
   * Reset today's data for a specific driver (used on logout)
   */
  resetTodaysData(driverId: string): void {
    const currentEarnings = this.getDriverEarnings(driverId);
    const resetEarnings = {
      ...currentEarnings,
      todayEarnings: 0,
      todayTrips: 0,
      lastUpdate: new Date().toISOString()
    };
    
    this.earnings.set(driverId, resetEarnings);
    console.log('🔄 Reset today\'s data for driver', driverId, ':', {
      todayEarnings: resetEarnings.todayEarnings,
      todayTrips: resetEarnings.todayTrips
    });
    
    // Notify listeners about the reset
    this.notifyListeners(driverId);
  }

  /**
   * Notify all listeners of earnings change
   */
  private notifyListeners(driverId: string): void {
    console.log('📢 Notifying', this.listeners.size, 'listeners about driver', driverId, 'earnings change');
    
    let notificationCount = 0;
    let listenerIndex = 1;
    this.listeners.forEach((callback) => {
      try {
        console.log('📨 Calling listener', listenerIndex, 'for driver', driverId);
        callback(driverId);
        notificationCount++;
        console.log('✅ Listener', listenerIndex, 'called successfully');
      } catch (error) {
        console.error('❌ Error in earnings listener', listenerIndex, ':', error);
      }
      listenerIndex++;
    });
    
    console.log('📡 Completed notifications:', notificationCount, 'out of', this.listeners.size, 'listeners');
  }

  /**
   * End shift - KEEP today's earnings and trips (only reset at 5:00 AM daily)
   */
  async endShift(driverId: string): Promise<{ success: boolean; message: string; totalEarnings?: number }> {
    try {
      console.log('🔄 Ending shift for driver:', driverId);
      
      const currentEarnings = this.getDriverEarnings(driverId);
      
      // Add today's earnings to total earnings but KEEP today's earnings for accumulation
      const newTotalEarnings = currentEarnings.totalEarnings + currentEarnings.todayEarnings;
      
      // KEEP today's earnings and trips - they should only reset at 5:00 AM daily
      const updatedEarnings: DriverEarnings = {
        ...currentEarnings,
        todayEarnings: currentEarnings.todayEarnings, // KEEP earnings for daily accumulation
        todayTrips: currentEarnings.todayTrips, // KEEP trip count
        totalEarnings: newTotalEarnings,
        lastUpdate: new Date().toISOString(),
      };
      
      console.log('🔄 Shift end - Earnings and trips preserved for daily accumulation:', {
        todayEarningsPreserved: currentEarnings.todayEarnings,
        todayTripsPreserved: currentEarnings.todayTrips,
        newTotalEarnings
      });
      
      // Update stored earnings
      this.earnings.set(driverId, updatedEarnings);
      
      // Save to database API
      await this.saveShiftEndToAPI(driverId, currentEarnings.todayEarnings, newTotalEarnings);
      
      // Notify listeners
      this.notifyListeners(driverId);
      
      console.log('✅ Shift ended successfully. Today earnings preserved:', currentEarnings.todayEarnings, 'Total earnings:', newTotalEarnings);
      
      return {
        success: true,
        message: `Shift ended. Today's earnings ₱${currentEarnings.todayEarnings} preserved for daily accumulation. Trip count preserved.`,
        totalEarnings: newTotalEarnings
      };
    } catch (error) {
      console.error('❌ Failed to end shift:', error);
      return {
        success: false,
        message: 'Failed to end shift. Please try again.'
      };
    }
  }

  /**
   * Start shift - driver can start earning again (preserve daily data)
   */
  async startShift(driverId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🚀 Starting shift for driver:', driverId);
      
      const currentEarnings = this.getDriverEarnings(driverId);
      
      // Check for daily reset first (5:00 AM reset)
      this.checkAndResetDailyTrips(driverId);
      
      // Get updated earnings after potential reset
      const updatedEarnings = this.getDriverEarnings(driverId);
      
      // Update stored earnings (preserve today's data unless reset by 5:00 AM logic)
      this.earnings.set(driverId, {
        ...updatedEarnings,
        lastUpdate: new Date().toISOString(),
      });
      
      // Save to database API
      await this.saveShiftStartToAPI(driverId);
      
      // Notify listeners
      this.notifyListeners(driverId);
      
      console.log('✅ Shift started successfully. Today earnings preserved:', updatedEarnings.todayEarnings);
      
      return {
        success: true,
        message: `Shift started. Today's earnings: ₱${updatedEarnings.todayEarnings}, Trips: ${updatedEarnings.todayTrips}`
      };
    } catch (error) {
      console.error('❌ Failed to start shift:', error);
      return {
        success: false,
        message: 'Failed to start shift. Please try again.'
      };
    }
  }

  /**
   * Save shift end to database API
   */
  private async saveShiftEndToAPI(driverId: string, todayEarnings: number, newTotalEarnings: number): Promise<boolean> {
    try {
      const { getBaseUrl } = await import('../../config/apiConfig');
      const baseUrl = getBaseUrl();
      const apiUrl = `${baseUrl}/earnings/shift/end`;
      
      console.log('💾 Saving shift end to API:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driverId,
          todayEarnings,
          totalEarnings: newTotalEarnings,
          timestamp: new Date().toISOString()
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Shift end saved to database:', result);
        return true;
      } else {
        console.warn('⚠️ Shift end API error:', response.status, response.statusText);
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to save shift end to API:', error);
      return false;
    }
  }

  /**
   * Save shift start to database API
   */
  private async saveShiftStartToAPI(driverId: string): Promise<boolean> {
    try {
      const { getBaseUrl } = await import('../../config/apiConfig');
      const baseUrl = getBaseUrl();
      const apiUrl = `${baseUrl}/earnings/shift/start`;
      
      console.log('💾 Saving shift start to API:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driverId,
          timestamp: new Date().toISOString()
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Shift start saved to database:', result);
        return true;
      } else {
        console.warn('⚠️ Shift start API error:', response.status, response.statusText);
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to save shift start to API:', error);
      return false;
    }
  }
}

export const earningsService = new EarningsService();
export default earningsService;
