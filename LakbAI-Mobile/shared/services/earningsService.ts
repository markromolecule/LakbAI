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
}

export interface DriverEarnings {
  todayEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  totalTrips: number;
  todayTrips: number;
  averageFarePerTrip: number;
  lastUpdate: string;
}

class EarningsService {
  private earnings: Map<string, DriverEarnings> = new Map();

  /**
   * Initialize or get driver earnings
   */
  private getDriverEarnings(driverId: string): DriverEarnings {
    if (!this.earnings.has(driverId)) {
      // Initialize with mock data (in real app, this would come from backend)
      this.earnings.set(driverId, {
        todayEarnings: 1840,
        weeklyEarnings: 12500,
        monthlyEarnings: 45600,
        totalTrips: 1247,
        todayTrips: 12,
        averageFarePerTrip: 35,
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

      const currentEarnings = this.getDriverEarnings(update.driverId);

      // Calculate new earnings
      const newEarnings: DriverEarnings = {
        todayEarnings: currentEarnings.todayEarnings + update.finalFare,
        weeklyEarnings: currentEarnings.weeklyEarnings + update.finalFare,
        monthlyEarnings: currentEarnings.monthlyEarnings + update.finalFare,
        totalTrips: currentEarnings.totalTrips + 1,
        todayTrips: currentEarnings.todayTrips + 1,
        averageFarePerTrip: Math.round(
          (currentEarnings.todayEarnings + update.finalFare) / (currentEarnings.todayTrips + 1)
        ),
        lastUpdate: update.timestamp,
      };

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
}

export const earningsService = new EarningsService();
export default earningsService;
