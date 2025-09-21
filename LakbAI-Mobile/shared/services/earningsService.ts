import { Alert } from 'react-native';
import { notificationService, PaymentNotification } from './notificationService';

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
  incrementTripCount?: boolean; // New parameter to control trip count increment
}

export interface DriverEarnings {
  todayEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  yearlyEarnings: number;
  totalEarnings: number; // Lifetime earnings across all shifts
  totalTrips: number;
  todayTrips: number;
  averageFarePerTrip: number;
  lastUpdate: string;
}

class EarningsService {
  private earnings: Map<string, DriverEarnings> = new Map();
  private listeners = new Set<(driverId: string) => void>();

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
            monthlyEarnings: result.earnings.monthlyEarnings,
            yearlyEarnings: result.earnings.yearlyEarnings || 0,
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
        destination: update.destination
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
        averageFarePerTrip: 0,
        lastUpdate: new Date().toISOString(),
      });
    }
    return this.earnings.get(driverId)!;
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

      const currentEarnings = this.getDriverEarnings(update.driverId);

      // Calculate trip count increment (only when explicitly requested)
      const tripIncrement = update.incrementTripCount ? 1 : 0;
      
      // Calculate new earnings
      const newEarnings: DriverEarnings = {
        todayEarnings: currentEarnings.todayEarnings + update.finalFare,
        weeklyEarnings: currentEarnings.weeklyEarnings + update.finalFare,
        monthlyEarnings: currentEarnings.monthlyEarnings + update.finalFare,
        yearlyEarnings: currentEarnings.yearlyEarnings + update.finalFare,
        totalEarnings: currentEarnings.totalEarnings + update.finalFare,
        totalTrips: currentEarnings.totalTrips + tripIncrement,
        todayTrips: currentEarnings.todayTrips + tripIncrement,
        averageFarePerTrip: Math.round(
          (currentEarnings.todayEarnings + update.finalFare) / (currentEarnings.todayTrips + tripIncrement)
        ),
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
        context: update.passengerId === 'trip_completion' ? 'TRIP_COMPLETION' : 'PASSENGER_PAYMENT'
      });

      // Update stored earnings
      this.earnings.set(update.driverId, newEarnings);

      // Send notification to driver
      const paymentNotification: PaymentNotification = {
        type: 'payment_received',
        driverId: update.driverId,
        amount: update.finalFare,
        passengerId: update.passengerId,
        tripId: update.tripId,
        timestamp: update.timestamp,
      };

      await notificationService.notifyDriverPaymentReceived(paymentNotification);
      
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
   * Get current earnings for a driver (async version - tries API first)
   */
  async getEarningsAsync(driverId: string): Promise<DriverEarnings> {
    // Try to get from API first
    const apiEarnings = await this.getDriverEarningsFromAPI(driverId);
    
    if (apiEarnings) {
      // Update local cache with API data
      this.earnings.set(driverId, apiEarnings);
      console.log('💰 Updated local earnings cache from API for driver:', driverId);
      return apiEarnings;
    }
    
    // Fallback to local cache
    console.log('💰 Using fallback local earnings for driver:', driverId);
    return this.getDriverEarnings(driverId);
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
   * End shift - reset today's earnings and add to total earnings
   */
  async endShift(driverId: string): Promise<{ success: boolean; message: string; totalEarnings?: number }> {
    try {
      console.log('🔄 Ending shift for driver:', driverId);
      
      const currentEarnings = this.getDriverEarnings(driverId);
      
      // Add today's earnings to total earnings before resetting
      const newTotalEarnings = currentEarnings.totalEarnings + currentEarnings.todayEarnings;
      
      // Reset today's earnings and trips
      const updatedEarnings: DriverEarnings = {
        ...currentEarnings,
        todayEarnings: 0,
        todayTrips: 0,
        totalEarnings: newTotalEarnings,
        lastUpdate: new Date().toISOString(),
      };
      
      // Update stored earnings
      this.earnings.set(driverId, updatedEarnings);
      
      // Save to database API
      await this.saveShiftEndToAPI(driverId, currentEarnings.todayEarnings, newTotalEarnings);
      
      // Notify listeners
      this.notifyListeners(driverId);
      
      console.log('✅ Shift ended successfully. Today earnings:', currentEarnings.todayEarnings, 'added to total:', newTotalEarnings);
      
      return {
        success: true,
        message: `Shift ended. Today's earnings ₱${currentEarnings.todayEarnings} added to total earnings.`,
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
   * Start shift - driver can start earning again
   */
  async startShift(driverId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🚀 Starting shift for driver:', driverId);
      
      const currentEarnings = this.getDriverEarnings(driverId);
      
      // Ensure today's earnings are reset (in case they weren't properly reset)
      const updatedEarnings: DriverEarnings = {
        ...currentEarnings,
        todayEarnings: 0,
        todayTrips: 0,
        lastUpdate: new Date().toISOString(),
      };
      
      // Update stored earnings
      this.earnings.set(driverId, updatedEarnings);
      
      // Save to database API
      await this.saveShiftStartToAPI(driverId);
      
      // Notify listeners
      this.notifyListeners(driverId);
      
      console.log('✅ Shift started successfully');
      
      return {
        success: true,
        message: 'Shift started. You can now start earning!'
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
      const baseUrl = getBaseUrl().replace('/routes/api.php', '');
      const apiUrl = `${baseUrl}/api/earnings/shift/end`;
      
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
      const baseUrl = getBaseUrl().replace('/routes/api.php', '');
      const apiUrl = `${baseUrl}/api/earnings/shift/start`;
      
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
