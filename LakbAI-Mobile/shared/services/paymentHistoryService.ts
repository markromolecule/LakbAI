import { getBaseUrl } from '../../config/apiConfig';

export interface PaymentHistoryItem {
  id: number;
  trip_id: string;
  driver_id: number;
  amount: string;
  original_fare: string;
  discount_amount: string;
  final_fare: string;
  payment_method: string;
  pickup_location: string;
  destination: string;
  transaction_date: string;
  created_at: string;
  driver_first_name?: string;
  driver_last_name?: string;
  jeepney_number?: string;
}

export interface PaymentHistoryResponse {
  status: string;
  payments: PaymentHistoryItem[];
  total: number;
  limit: number;
  offset: number;
}

export class PaymentHistoryService {
  private static baseUrl = getBaseUrl();

  /**
   * Get passenger payment history
   */
  static async getPaymentHistory(
    passengerId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<PaymentHistoryResponse> {
    try {
      const url = `${this.baseUrl}/api/earnings/passenger/${passengerId}?limit=${limit}&offset=${offset}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  }

  /**
   * Format payment amount for display
   */
  static formatAmount(amount: number | string | undefined | null): string {
    if (amount === null || amount === undefined) {
      return '₱0.00';
    }
    
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numericAmount)) {
      return '₱0.00';
    }
    
    return `₱${numericAmount.toFixed(2)}`;
  }

  /**
   * Format date for display
   */
  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Get driver name for display
   */
  static getDriverName(payment: PaymentHistoryItem): string {
    if (payment.driver_first_name && payment.driver_last_name) {
      return `${payment.driver_first_name} ${payment.driver_last_name}`;
    }
    return 'Unknown Driver';
  }

  /**
   * Get jeepney info for display
   */
  static getJeepneyInfo(payment: PaymentHistoryItem): string {
    if (payment.jeepney_number) {
      return `Jeepney #${payment.jeepney_number}`;
    }
    return 'Jeepney Info N/A';
  }
}
