import { buildApiUrl } from '../../config/developerConfig';

export interface DiscountStatus {
  discount_applied: boolean;
  discount_status: 'pending' | 'approved' | 'rejected' | null;
  discount_type: string | null;
  discount_amount: number | null;
  discount_file_path: string | null;
  discount_verified: boolean;
}

export interface DiscountStatusResponse {
  status: 'success' | 'error';
  message?: string;
  data?: DiscountStatus;
}

class DiscountStatusService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = buildApiUrl().replace('/routes/api.php', '');
    console.log('DiscountStatusService initialized with baseUrl:', this.baseUrl);
  }

  /**
   * Get discount status for a specific user
   */
  async getUserDiscountStatus(userId: string | number): Promise<DiscountStatusResponse> {
    try {
      console.log(`📋 Fetching discount status for user ${userId}...`);
      
      const response = await fetch(`${this.baseUrl}/api/users/${userId}/discount`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Discount status fetch error:', errorText);
        return {
          status: 'error',
          message: `Failed to fetch discount status: ${response.status}`
        };
      }

      const data = await response.json();
      console.log('📋 Discount status response:', data);

      if (data.status === 'success') {
        return {
          status: 'success',
          data: data.data
        };
      } else {
        return {
          status: 'error',
          message: data.message || 'Failed to fetch discount status'
        };
      }
    } catch (error) {
      console.error('❌ Discount status fetch error:', error);
      return {
        status: 'error',
        message: 'Network error while fetching discount status'
      };
    }
  }

  /**
   * Get discount status display message
   */
  getDiscountStatusMessage(discountStatus: DiscountStatus): string {
    if (!discountStatus.discount_applied) {
      return 'No discount applied';
    }

    switch (discountStatus.discount_status) {
      case 'pending':
        return 'Your discount application is under review.';
      case 'approved':
        const percentage = discountStatus.discount_amount;
        return `Discount approved! You receive ${percentage ? percentage : '0'}% off your fare.`;
      case 'rejected':
        return 'Your discount application was not approved.';
      default:
        return 'Discount status unknown';
    }
  }

  /**
   * Get discount status color for UI
   */
  getDiscountStatusColor(discountStatus: DiscountStatus): string {
    if (!discountStatus.discount_applied) {
      return '#6B7280'; // Gray
    }

    switch (discountStatus.discount_status) {
      case 'pending':
        return '#F59E0B'; // Orange/Yellow
      case 'approved':
        return '#10B981'; // Green
      case 'rejected':
        return '#EF4444'; // Red
      default:
        return '#6B7280'; // Gray
    }
  }

  /**
   * Get discount status icon
   */
  getDiscountStatusIcon(discountStatus: DiscountStatus): string {
    if (!discountStatus.discount_applied) {
      return '💳'; // Credit card
    }

    switch (discountStatus.discount_status) {
      case 'pending':
        return '⏳'; // Hourglass
      case 'approved':
        return '✅'; // Check mark
      case 'rejected':
        return '❌'; // X mark
      default:
        return '❓'; // Question mark
    }
  }
}

const discountStatusService = new DiscountStatusService();
export { discountStatusService };
export default discountStatusService;
