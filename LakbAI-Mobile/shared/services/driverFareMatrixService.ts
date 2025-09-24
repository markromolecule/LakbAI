import { FareInfo } from '../types';
import { getBaseUrl } from '../../config/apiConfig';

export interface DriverFareMatrixEntry {
  id: number;
  from_checkpoint_id: number;
  to_checkpoint_id: number;
  from_checkpoint: string;
  to_checkpoint: string;
  fare_amount: string;
  is_base_fare: number;
  effective_date: string;
  expiry_date: string | null;
  status: string;
}

export interface DriverFareMatrixResponse {
  status: string;
  route?: {
    id: number;
    route_name: string;
    origin: string;
    destination: string;
  };
  checkpoints?: Array<{
    id: number;
    checkpoint_name: string;
    sequence_order: number;
    fare_from_origin: string;
    is_origin: number;
    is_destination: number;
  }>;
  fare_matrix?: DriverFareMatrixEntry[];
  matrix_size?: number;
  message?: string;
}

class DriverFareMatrixService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${getBaseUrl()}/fare-matrix`;
  }

  /**
   * Get fare matrix for a specific route
   */
  async getFareMatrixForRoute(routeId: number): Promise<DriverFareMatrixResponse> {
    try {
      console.log('🔄 Driver fetching fare matrix for route:', routeId);
      
      const response = await fetch(`${this.baseUrl}/route/${routeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Driver fare matrix fetched successfully:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching driver fare matrix:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get fare between two checkpoints
   */
  async getFareBetweenCheckpoints(
    fromCheckpointId: number,
    toCheckpointId: number,
    routeId?: number
  ): Promise<{ status: string; fare_info?: any; message?: string }> {
    try {
      console.log('🔄 Driver calculating fare between checkpoints:', { fromCheckpointId, toCheckpointId, routeId });
      
      const url = routeId 
        ? `${this.baseUrl}/fare/${fromCheckpointId}/${toCheckpointId}?route_id=${routeId}`
        : `${this.baseUrl}/fare/${fromCheckpointId}/${toCheckpointId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Driver fare calculation successful:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Error calculating driver fare:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Convert fare matrix entries to FareInfo format for driver components
   * Limits to 12 entries and randomizes them for better display
   */
  convertToFareInfo(fareMatrix: DriverFareMatrixEntry[]): FareInfo[] {
    // Convert to FareInfo format
    const fareInfo = fareMatrix.map(entry => ({
      from: entry.from_checkpoint,
      to: entry.to_checkpoint,
      fare: parseFloat(entry.fare_amount)
    }));

    // Filter out same-to-same entries (e.g., SM Epza to SM Epza)
    const filteredFares = fareInfo.filter(fare => fare.from !== fare.to);

    // Shuffle the array to randomize
    const shuffledFares = this.shuffleArray([...filteredFares]);

    // Limit to 12 entries
    const limitedFares = shuffledFares.slice(0, 12);

    console.log(`🎲 Driver fare matrix: ${filteredFares.length} total entries, showing ${limitedFares.length} randomized entries`);
    
    return limitedFares;
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get route ID from route name
   */
  getRouteIdFromRouteName(routeName: string): number | undefined {
    const routeMap: { [key: string]: number } = {
      'SM Epza → SM Dasmariñas': 1,
      'SM Dasmariñas → SM Epza': 2,
    };
    return routeMap[routeName];
  }

  /**
   * Format fare amount for display
   */
  formatFareAmount(amount: number): string {
    return `₱${amount.toFixed(2)}`;
  }
}

export const driverFareMatrixService = new DriverFareMatrixService();
