import { Alert } from 'react-native';
// Removed old notificationService - using only localNotificationService for driver app notifications
import { localNotificationService } from './localNotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBaseUrl } from '../../config/apiConfig';

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
  private lastPaymentSender: Map<string, string> = new Map(); // Track last payment sender for each driver

  /**
   * Store the last payment sender name for a driver
   */
  async setLastPaymentSender(driverId: string, senderName: string): Promise<void> {
    try {
      // Store in memory
      this.lastPaymentSender.set(driverId, senderName);
      
      // Store in AsyncStorage for persistence
      const key = `last_payment_sender_${driverId}`;
      await AsyncStorage.setItem(key, senderName);
      
      console.log('💰 Stored payment sender for driver', driverId, ':', senderName);
    } catch (error) {
      console.error('❌ Error storing payment sender:', error);
    }
  }

  /**
   * Get the last payment sender name for a driver
   */
  async getLastPaymentSender(driverId: string): Promise<string | undefined> {
    try {
      // First check memory
      const memorySender = this.lastPaymentSender.get(driverId);
      if (memorySender) {
        console.log('💰 Retrieved payment sender from memory for driver', driverId, ':', memorySender);
        return memorySender;
      }
      
      // Then check AsyncStorage
      const key = `last_payment_sender_${driverId}`;
      const storedSender = await AsyncStorage.getItem(key);
      
      if (storedSender) {
        // Update memory cache
        this.lastPaymentSender.set(driverId, storedSender);
        console.log('💰 Retrieved payment sender from storage for driver', driverId, ':', storedSender);
        return storedSender;
      }
      
      console.log('💰 No payment sender found for driver', driverId);
      return undefined;
    } catch (error) {
      console.error('❌ Error retrieving payment sender:', error);
      return undefined;
    }
  }

  /**
   * Clear the last payment sender name for a driver (after notification is sent)
   */
  async clearLastPaymentSender(driverId: string): Promise<void> {
    try {
      // Clear from memory
      this.lastPaymentSender.delete(driverId);
      
      // Clear from AsyncStorage
      const key = `last_payment_sender_${driverId}`;
      await AsyncStorage.removeItem(key);
      
      console.log('💰 Cleared payment sender for driver', driverId);
    } catch (error) {
      console.error('❌ Error clearing payment sender:', error);
    }
  }

  /**
   * Get driver earnings from database API
   */
  async getDriverEarningsFromAPI(driverId: string): Promise<DriverEarnings | null> {
    try {
      const { getBaseUrl } = await import('../../config/apiConfig');
      const apiUrl = `${getBaseUrl()}/earnings/driver/${driverId}`;
      
      console.log('💰 Fetching earnings from API:', apiUrl);
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
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
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          console.error('❌ Earnings API request timed out after 10 seconds');
        } else {
          console.error('❌ Earnings API fetch error:', fetchError);
        }
        throw fetchError;
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch earnings from API:', error);
      
      // Check if it's a network timeout error
      if (error.message?.includes('timeout') || error.name === 'AbortError') {
        console.warn('⚠️ Network timeout detected - will retry with fallback data');
      }
    }
    
    return null;
  }

  /**
   * Save earnings to database API
   */
  async saveEarningsToAPI(update: EarningsUpdate): Promise<any> {
    try {
      const { getBaseUrl } = await import('../../config/apiConfig');
      const apiUrl = `${getBaseUrl()}/earnings/add`;
      
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
        incrementTripCount: update.incrementTripCount 
      };
      
      console.log('💾 Saving earnings to API:', apiUrl, payload);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      console.log('📡 API Response status:', response.status);
      console.log('📡 API Response ok:', response.ok);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Earnings saved to database:', result);
        return result;
      } else {
        console.error('❌ Failed to save earnings:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        return { status: 'error', message: errorText };
      }
    } catch (error) {
      console.error('❌ Error saving earnings to API:', error);
      return { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Initialize or get driver earnings (fallback to memory)
   */
  private getDriverEarnings(driverId: string): DriverEarnings {
    // Only check for daily reset if we haven't checked today
    const currentDate = new Date().toDateString();
    if (this.lastResetDate !== currentDate) {
      this.checkAndResetDailyTrips(driverId);
    }
    
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
      console.log('🔄 5:00 AM reset time reached - resetting today\'s trips for driver:', driverId);
      
      // Only reset for the specific driver, not all drivers
      const currentEarnings = this.earnings.get(driverId);
      if (currentEarnings) {
        const updatedEarnings = {
          ...currentEarnings,
          todayEarnings: 0,
          todayTrips: 0,
          lastUpdate: new Date().toISOString()
        };
        this.earnings.set(driverId, updatedEarnings);
        console.log(`🔄 Reset today\'s data for driver ${driverId}:`, {
          todayEarnings: updatedEarnings.todayEarnings,
          todayTrips: updatedEarnings.todayTrips
        });
        
        // Notify listeners about the reset for this specific driver
        this.listeners.forEach(listener => {
          try {
            listener(driverId);
          } catch (error) {
            console.error('❌ Error notifying listener about daily reset:', error);
          }
        });
      }
      
      // Update last reset date only once per day
      this.lastResetDate = currentDate;
    }
  }

  /**
   * Update driver earnings when a passenger pays
   */
  async updateDriverEarnings(update: EarningsUpdate, senderName?: string): Promise<{
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

      const existingEarnings = this.getDriverEarnings(update.driverId);

      // Validate the update data
      // Allow 0 fare only when incrementing trip count (trip completion)
      // Otherwise, require positive fare for earnings updates
      if (update.incrementTripCount && update.finalFare === 0) {
        // Trip completion with no fare - this is valid
        console.log('✅ Trip completion detected - allowing 0 fare for trip count increment only');
      } else if (!update.finalFare || isNaN(update.finalFare) || update.finalFare <= 0) {
        throw new Error(`Invalid finalFare: ${update.finalFare}`);
      }

      // Calculate trip count increment (only when explicitly requested)
      // DEFAULT: Do NOT increment trip count unless explicitly set to true
      // This ensures payments don't accidentally increment trip counts
      const tripIncrement = update.incrementTripCount === true ? 1 : 0;
      
      // Calculate new earnings
      console.log('💰 Current earnings before update:', existingEarnings);
      console.log('💰 Update details:', { finalFare: update.finalFare, tripIncrement });
      
      // For trip completion (incrementTripCount = true, finalFare = 0), only update trip counts
      // For payment updates (finalFare > 0), update both earnings and trip counts
      const fareIncrement = update.finalFare || 0;
      
      const newEarnings: DriverEarnings = {
        todayEarnings: existingEarnings.todayEarnings + fareIncrement,
        weeklyEarnings: existingEarnings.weeklyEarnings + fareIncrement,
        monthlyEarnings: existingEarnings.monthlyEarnings + fareIncrement,
        yearlyEarnings: existingEarnings.yearlyEarnings + fareIncrement,
        totalEarnings: existingEarnings.totalEarnings + fareIncrement,
        totalTrips: existingEarnings.totalTrips + tripIncrement,
        todayTrips: existingEarnings.todayTrips + tripIncrement,
        weeklyTrips: existingEarnings.weeklyTrips + tripIncrement,
        monthlyTrips: existingEarnings.monthlyTrips + tripIncrement,
        yearlyTrips: existingEarnings.yearlyTrips + tripIncrement,
        averageFarePerTrip: (existingEarnings.todayTrips + tripIncrement) > 0 
          ? Math.round((existingEarnings.todayEarnings + fareIncrement) / (existingEarnings.todayTrips + tripIncrement))
          : 0,
        lastUpdate: update.timestamp,
      };
      
      console.log('💰 New earnings calculated:', newEarnings);

      console.log('🔄 Trip count update:', {
        driverId: update.driverId,
        incrementTripCount: update.incrementTripCount,
        tripIncrement: tripIncrement,
        previousTodayTrips: existingEarnings.todayTrips,
        newTodayTrips: newEarnings.todayTrips,
        previousTotalTrips: existingEarnings.totalTrips,
        newTotalTrips: newEarnings.totalTrips,
        context: update.passengerId === 'trip_completion' ? 'TRIP_COMPLETION' : 'PASSENGER_PAYMENT',
        shouldIncrementTrips: tripIncrement > 0 ? 'YES - Trip completed' : 'NO - Payment only'
      });

      // Get current earnings before updating (for notification calculation)
      const currentEarnings = this.getDriverEarnings(update.driverId);
      
      // Update stored earnings
      this.earnings.set(update.driverId, newEarnings);

      // Store the passenger name for the driver notification
      if (senderName) {
        await this.setLastPaymentSender(update.driverId, senderName);
      }

      // Trigger notification only for payment updates (not for trip completion)
      if (fareIncrement > 0) {
        console.log('💰 Payment processed - triggering notification immediately');
        await this.checkAndNotifyEarningsChange(update.driverId, newEarnings, senderName, currentEarnings);
      } else {
        console.log('🚗 Trip completion - no notification needed (only trip count updated)');
      }
      
      // Save to database API
      console.log('💾 Saving earnings to API:', `${getBaseUrl()}/api/earnings/add`, {
        destination: update.destination,
        discountAmount: update.discountAmount,
        driverId: update.driverId,
        finalFare: update.finalFare,
        incrementTripCount: update.incrementTripCount,
        originalFare: update.originalFare,
        passengerId: update.passengerId,
        paymentMethod: update.paymentMethod,
        pickupLocation: update.pickupLocation,
        tripId: update.tripId
      });
      
      const saveResult = await this.saveEarningsToAPI(update);
      console.log('✅ Earnings saved to database:', saveResult);
      
      // Check if the save was successful
      if (saveResult && saveResult.status === 'error') {
        throw new Error(`Database save failed: ${saveResult.message}`);
      }
      
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
        error: error instanceof Error ? error.message : 'Failed to update earnings',
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
  private async checkAndNotifyEarningsChange(driverId: string, newEarnings: DriverEarnings, senderName?: string, currentEarnings?: DriverEarnings): Promise<void> {
    const previousEarnings = this.previousEarnings.get(driverId);
    
    console.log('🔍 Earnings comparison for driver:', {
      driverId,
      hasPreviousEarnings: !!previousEarnings,
      previousTodayEarnings: previousEarnings?.todayEarnings,
      newTodayEarnings: newEarnings.todayEarnings,
      willTriggerNotification: previousEarnings && newEarnings.todayEarnings > previousEarnings.todayEarnings,
      localEarnings: this.earnings.get(driverId)?.todayEarnings,
      senderNameProvided: !!senderName
    });
    
    // Check if this is a driver app earnings refresh (no senderName provided)
    // In this case, we should check for stored sender name and show notification
    if (!senderName) {
      console.log('💰 Driver app earnings refresh detected for driver:', driverId);
      
      // Check if earnings increased
      const hasEarningsIncrease = previousEarnings && newEarnings.todayEarnings > previousEarnings.todayEarnings;
      
      if (hasEarningsIncrease) {
        const earningsIncrease = newEarnings.todayEarnings - previousEarnings.todayEarnings;
        
        // Try to get the stored sender name
        const storedSenderName = await this.getLastPaymentSender(driverId);
        
        console.log('💰 Driver app earnings increase detected:', {
          driverId,
          previousEarnings: previousEarnings.todayEarnings,
          newEarnings: newEarnings.todayEarnings,
          earningsIncrease,
          storedSenderName
        });
        
        if (earningsIncrease > 0) {
          const notificationTitle = '💰 Payment Received!';
          const notificationBody = storedSenderName 
            ? `${storedSenderName} paid ₱${earningsIncrease.toFixed(2)}. Today's earnings: ₱${newEarnings.todayEarnings.toFixed(2)}`
            : `You received ₱${earningsIncrease.toFixed(2)}. Today's earnings: ₱${newEarnings.todayEarnings.toFixed(2)}`;

          // Trigger local notification for the driver
          await localNotificationService.notifyEarningsUpdate({
            type: 'earnings_update',
            driverId: driverId,
            amount: earningsIncrease,
            tripId: `earnings_${Date.now()}`,
            paymentMethod: 'passenger_payment',
            previousEarnings: previousEarnings.todayEarnings,
            newEarnings: newEarnings.todayEarnings,
            senderName: storedSenderName,
            title: notificationTitle,
            body: notificationBody,
            data: {
              driverId: driverId,
              amount: earningsIncrease,
              newTotal: newEarnings.todayEarnings,
              previousTotal: previousEarnings.todayEarnings,
              paymentMethod: 'passenger_payment',
              senderName: storedSenderName
            }
          });

          console.log('✅ Driver app notification sent:', notificationBody);
          
          // Clear the stored sender name after notification
          if (storedSenderName) {
            await this.clearLastPaymentSender(driverId);
          }
        }
      }
      
      // Update previous earnings for future comparisons
      this.previousEarnings.set(driverId, { ...newEarnings });
      return;
    }
    
    // Update previous earnings for next comparison
    this.previousEarnings.set(driverId, { ...newEarnings });
  }

  /**
   * Get current earnings for a driver (async version - tries API first with retry logic)
   */
  async getEarningsAsync(driverId: string, senderName?: string): Promise<DriverEarnings> {
    // Try to get from API first with retry logic
    let apiEarnings = null;
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount <= maxRetries && !apiEarnings) {
      try {
        console.log(`💰 Attempting to fetch earnings from API (attempt ${retryCount + 1}/${maxRetries + 1})`);
        apiEarnings = await this.getDriverEarningsFromAPI(driverId);
        
        if (apiEarnings) {
          console.log('💰 Successfully fetched earnings from API');
          break;
        }
      } catch (error: any) {
        console.warn(`⚠️ API fetch attempt ${retryCount + 1} failed:`, error.message);
        
        if (retryCount < maxRetries) {
          console.log(`🔄 Retrying in ${(retryCount + 1) * 2} seconds...`);
          await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
        }
      }
      
      retryCount++;
    }
    
    if (apiEarnings) {
      // Initialize previous earnings if not set (first time loading)
      if (!this.previousEarnings.has(driverId)) {
        console.log('💰 Initializing previous earnings for driver:', driverId, 'with current earnings:', apiEarnings.todayEarnings);
        this.previousEarnings.set(driverId, { ...apiEarnings });
        // Don't check for changes on first load - just initialize
        this.earnings.set(driverId, apiEarnings);
        console.log('💰 Updated local earnings cache from API for driver:', driverId);
        return apiEarnings;
      }
      
      // Check for earnings changes and notify driver if increased
      await this.checkAndNotifyEarningsChange(driverId, apiEarnings, senderName);
      
      // Update local cache with API data
      this.earnings.set(driverId, apiEarnings);
      console.log('💰 Updated local earnings cache from API for driver:', driverId);
      return apiEarnings;
    }
    
    // Fallback to local cache
    console.log('💰 API failed after retries, using fallback local earnings for driver:', driverId);
    const localEarnings = this.getDriverEarnings(driverId);
    
    // Initialize previous earnings if not set (first time loading)
    if (!this.previousEarnings.has(driverId)) {
      console.log('💰 Initializing previous earnings for driver:', driverId, 'with local earnings:', localEarnings.todayEarnings);
      this.previousEarnings.set(driverId, { ...localEarnings });
      // Don't check for changes on first load - just initialize
      return localEarnings;
    }
    
    // Check for earnings changes even with local data
    await this.checkAndNotifyEarningsChange(driverId, localEarnings, senderName);
    
    return localEarnings;
  }

  /**
   * Refresh earnings for driver and check for updates (should be called by driver app)
   * This will trigger notifications if earnings have increased
   */
  async refreshDriverEarnings(driverId: string, senderName?: string): Promise<DriverEarnings> {
    console.log('🔄 Driver app refreshing earnings for:', driverId);
    return await this.getEarningsAsync(driverId, senderName);
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
      
      // getDriverEarnings already handles daily reset check, no need to call it again
      const currentEarnings = this.getDriverEarnings(driverId);
      
      // Update stored earnings (preserve today's data unless reset by 5:00 AM logic)
      this.earnings.set(driverId, {
        ...currentEarnings,
        lastUpdate: new Date().toISOString(),
      });
      
      // Save to database API
      await this.saveShiftStartToAPI(driverId);
      
      // Notify listeners
      this.notifyListeners(driverId);
      
      console.log('✅ Shift started successfully. Today earnings preserved:', currentEarnings.todayEarnings);
      
      return {
        success: true,
        message: `Shift started. Today's earnings: ₱${currentEarnings.todayEarnings}, Trips: ${currentEarnings.todayTrips}`
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
