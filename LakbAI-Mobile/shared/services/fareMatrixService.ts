import { getBaseUrl } from '../../config/apiConfig';

export interface FareMatrixEntry {
  id: number;
  from_checkpoint_id: number;
  from_checkpoint: string;
  to_checkpoint_id: number;
  to_checkpoint: string;
  fare_amount: string;
  is_base_fare: number;
  effective_date: string;
  expiry_date?: string;
  status: string;
}

export interface FareInfo {
  from_checkpoint_id: number;
  to_checkpoint_id: number;
  from_checkpoint: string;
  to_checkpoint: string;
  fare_amount: number;
  route_name: string;
  is_base_fare: boolean;
  calculation_method: string;
}

export interface RouteFareMatrix {
  route: {
    id: number;
    route_name: string;
    origin: string;
    destination: string;
  };
  checkpoints: Array<{
    id: number;
    checkpoint_name: string;
    sequence_order: number;
    fare_from_origin: number;
    is_origin: boolean;
    is_destination: boolean;
  }>;
  fare_matrix: FareMatrixEntry[];
  matrix_size: number;
}

export interface FareMatrixStats {
  total_entries: number;
  base_fare_entries: number;
  route_statistics: Array<{
    route_name: string;
    entry_count: number;
    min_fare: number;
    max_fare: number;
    avg_fare: number;
  }>;
}

class FareMatrixService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${getBaseUrl()}/fare-matrix`;
    console.log('🏗️ FareMatrixService: Base URL constructed:', this.baseUrl);
  }

  /**
   * Get fare between two checkpoints
   */
  async getFareBetweenCheckpoints(
    fromCheckpointId: number,
    toCheckpointId: number,
    routeId?: number
  ): Promise<{ status: string; fare_info?: FareInfo; message?: string }> {
    try {
      const url = `${this.baseUrl}/fare/${fromCheckpointId}/${toCheckpointId}${
        routeId ? `?route_id=${routeId}` : ''
      }`;
      
      console.log('🌐 FareMatrixService: Fetching fare from URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 FareMatrixService: Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 FareMatrixService: Fare response data:', data);
      return data;
    } catch (error) {
      console.error('💥 FareMatrixService: Error getting fare between checkpoints:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get complete fare matrix for a route
   */
  async getFareMatrixForRoute(routeId: number): Promise<{ status: string; route?: RouteFareMatrix; fare_matrix?: FareMatrixEntry[]; checkpoints?: any[]; matrix_size?: number; message?: string }> {
    try {
      const url = `${this.baseUrl}/route/${routeId}`;
      console.log('🌐 FareMatrixService: Fetching from URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 FareMatrixService: Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 FareMatrixService: Response data:', data);
      return data;
    } catch (error) {
      console.error('💥 FareMatrixService: Error getting fare matrix for route:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get all fare matrices
   */
  async getAllFareMatrices(): Promise<{ status: string; fare_matrices?: RouteFareMatrix[]; total_routes?: number; message?: string }> {
    try {
      const url = this.baseUrl;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting all fare matrices:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Generate fare matrix for a route
   */
  async generateFareMatrixForRoute(
    routeId: number,
    baseFare: number = 13.00
  ): Promise<{ status: string; message?: string; created_entries?: number; total_possible_entries?: number; errors?: string[] }> {
    try {
      const url = `${this.baseUrl}/generate/${routeId}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base_fare: baseFare
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error generating fare matrix:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Create or update fare matrix entry
   */
  async createOrUpdateFareEntry(fareData: {
    from_checkpoint_id: number;
    to_checkpoint_id: number;
    fare_amount: number;
    route_id: number;
    is_base_fare?: boolean;
    effective_date?: string;
    expiry_date?: string;
    status?: string;
  }): Promise<{ status: string; message?: string; fare_matrix_id?: number }> {
    try {
      const url = `${this.baseUrl}/create`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fareData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating/updating fare entry:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update fare matrix entry
   */
  async updateFareEntry(
    fareMatrixId: number,
    fareData: {
      fare_amount: number;
      is_base_fare?: boolean;
      effective_date?: string;
      expiry_date?: string;
      status?: string;
    }
  ): Promise<{ status: string; message?: string }> {
    try {
      const url = `${this.baseUrl}/${fareMatrixId}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fareData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating fare entry:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Delete fare matrix entry
   */
  async deleteFareEntry(fareMatrixId: number): Promise<{ status: string; message?: string }> {
    try {
      const url = `${this.baseUrl}/${fareMatrixId}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting fare entry:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get fare matrix statistics
   */
  async getFareMatrixStats(): Promise<{ status: string; stats?: FareMatrixStats; message?: string }> {
    try {
      const url = `${this.baseUrl}/stats`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting fare matrix stats:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get fare matrix history
   */
  async getFareMatrixHistory(
    fareMatrixId?: number,
    limit: number = 50
  ): Promise<{ status: string; history?: any[]; count?: number; message?: string }> {
    try {
      const url = fareMatrixId 
        ? `${this.baseUrl}/history/${fareMatrixId}?limit=${limit}`
        : `${this.baseUrl}/history?limit=${limit}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting fare matrix history:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Calculate fare with discount applied
   */
  calculateFareWithDiscount(
    baseFare: number,
    discountType?: 'PWD' | 'Senior Citizen' | 'Student',
    discountAmount?: number
  ): number {
    if (!discountType || !discountAmount) {
      return baseFare;
    }

    // Apply discount
    const discountedFare = baseFare - discountAmount;
    
    // Ensure fare doesn't go below base fare (13.00)
    return Math.max(discountedFare, 13.00);
  }

  /**
   * Format fare amount for display
   */
  formatFareAmount(amount: number): string {
    return `₱${amount.toFixed(2)}`;
  }

  /**
   * Get fare calculation summary
   */
  getFareCalculationSummary(
    fromCheckpoint: string,
    toCheckpoint: string,
    baseFare: number,
    discountType?: string,
    discountAmount?: number
  ): {
    from: string;
    to: string;
    baseFare: number;
    discountType?: string;
    discountAmount?: number;
    finalFare: number;
    savings?: number;
  } {
    const finalFare = this.calculateFareWithDiscount(baseFare, discountType as any, discountAmount);
    const savings = discountAmount ? baseFare - finalFare : 0;

    return {
      from: fromCheckpoint,
      to: toCheckpoint,
      baseFare,
      discountType,
      discountAmount,
      finalFare,
      savings: savings > 0 ? savings : undefined
    };
  }
}

// Export singleton instance
export const fareMatrixService = new FareMatrixService();
export default fareMatrixService;
