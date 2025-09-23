import { fareMatrixService } from '../services/fareMatrixService';
import { CHECKPOINTS } from '../../constants/checkpoints';
import { FareInfo } from '../types';

// Legacy fare matrix for fallback
const LEGACY_FARE_MATRIX = [
  { from: 'Robinson Tejero', to: 'Malabon', fare: 12 },
  { from: 'Malabon', to: 'Riverside', fare: 14 },
  { from: 'Riverside', to: 'Lancaster New City', fare: 16 },
  { from: 'Lancaster New City', to: 'Pasong Camachile I', fare: 18 },
  { from: 'Pasong Camachile I', to: 'Open Canal', fare: 20 },
  { from: 'Open Canal', to: 'Santiago', fare: 22 },
  { from: 'Santiago', to: 'Bella Vista', fare: 24 },
  { from: 'Bella Vista', to: 'San Francisco', fare: 26 },
  { from: 'San Francisco', to: 'Country Meadow', fare: 28 },
  { from: 'Country Meadow', to: 'Pabahay', fare: 30 },
  { from: 'Pabahay', to: 'Monterey', fare: 33 },
  { from: 'Monterey', to: 'Langkaan', fare: 36 },
  { from: 'Langkaan', to: 'Tierra Vista', fare: 40 },
  { from: 'Tierra Vista', to: 'Robinson Pala-pala', fare: 45 },
  { from: 'Robinson Tejero', to: 'Robinson Pala-pala', fare: 500 },
  { from: 'Lancaster New City', to: 'Robinson Pala-pala', fare: 30 },
];

/**
 * Calculate fare using dynamic fare matrix service
 */
export const calculateFare = async (
  from: string, 
  to: string, 
  routeId?: number
): Promise<number | null> => {
  try {
    console.log('🔄 Calculating fare from', from, 'to', to);
    
    // First try to get checkpoint IDs from names (with route context)
    const fromCheckpointId = getCheckpointIdByName(from, routeId);
    const toCheckpointId = getCheckpointIdByName(to, routeId);

    console.log('📍 Checkpoint IDs:', { fromCheckpointId, toCheckpointId });

    if (fromCheckpointId && toCheckpointId) {
      // Use dynamic fare matrix service
      console.log('🌐 Calling fareMatrixService...');
      const result = await fareMatrixService.getFareBetweenCheckpoints(
        fromCheckpointId,
        toCheckpointId,
        routeId
      );

      console.log('📊 FareMatrixService result:', result);

      if (result.status === 'success' && result.fare_info) {
        console.log(`✅ Dynamic fare from ${from} to ${to}: ₱${result.fare_info.fare_amount}`);
        return result.fare_info.fare_amount;
      } else {
        console.log('❌ Dynamic fare failed:', result.message);
      }
    } else {
      console.log('❌ Could not find checkpoint IDs for:', from, to);
    }

    // Fallback to legacy calculation
    console.log('🔄 Falling back to legacy calculation...');
    return calculateLegacyFare(from, to);
  } catch (error) {
    console.error('💥 Error calculating fare:', error);
    return calculateLegacyFare(from, to);
  }
};

/**
 * Legacy fare calculation (fallback)
 */
const calculateLegacyFare = (from: string, to: string): number | null => {
  // First try direct route
  const directFare = LEGACY_FARE_MATRIX.find(f => f.from === from && f.to === to);
  if (directFare) {
    return directFare.fare;
  }

  // Calculate multi-hop fare
  const fromIndex = CHECKPOINTS.indexOf(from as any);
  const toIndex = CHECKPOINTS.indexOf(to as any);
  
  if (fromIndex === -1 || toIndex === -1) {
    console.warn(`Invalid locations: ${from} or ${to}`);
    return null;
  }

  if (fromIndex === toIndex) {
    return 13; // Base fare for same location
  }

  // Calculate cumulative fare for the route
  let totalFare = 13; // Base fare
  const startIndex = Math.min(fromIndex, toIndex);
  const endIndex = Math.max(fromIndex, toIndex);

  for (let i = startIndex; i < endIndex; i++) {
    const currentStop = CHECKPOINTS[i];
    const nextStop = CHECKPOINTS[i + 1];
    
    const segmentFare = LEGACY_FARE_MATRIX.find(f => f.from === currentStop && f.to === nextStop);
    if (segmentFare) {
      totalFare += segmentFare.fare;
    } else {
      // Fallback: base fare per segment if not found
      totalFare += 2.5; // Incremental fare
    }
  }

  console.log(`Legacy calculated fare from ${from} to ${to}: ₱${totalFare}`);
  return totalFare;
};

/**
 * Get checkpoint ID by name (matching database IDs)
 */
const getCheckpointIdByName = (checkpointName: string, routeId?: number): number | null => {
  // Route 1: SM Epza → SM Dasmariñas (IDs 46-62)
  const route1Map: { [key: string]: number } = {
    'SM Epza': 46,
    'Robinson Tejero': 47,
    'Malabon': 48,
    'Riverside': 49,
    'Lancaster New City': 50,
    'Pasong Camachile I': 51,
    'Open Canal': 52,
    'Santiago': 53,
    'Bella Vista': 54,
    'San Francisco': 55,
    'Country Meadow': 56,
    'Pabahay': 57,
    'Monterey': 58,
    'Langkaan': 59,
    'Tierra Vista': 60,
    'Robinson Dasmariñas': 61,
    'SM Dasmariñas': 62,
  };

  // Route 2: SM Dasmariñas → SM Epza (IDs 63-79)
  const route2Map: { [key: string]: number } = {
    'SM Dasmariñas': 63,
    'Robinson Dasmariñas': 64,
    'Tierra Vista': 65,
    'Langkaan': 66,
    'Monterey': 67,
    'Pabahay': 68,
    'Country Meadow': 69,
    'San Francisco': 70,
    'Bella Vista': 71,
    'Santiago': 72,
    'Open Canal': 73,
    'Pasong Camachile I': 74,
    'Lancaster New City': 75,
    'Riverside': 76,
    'Malabon': 77,
    'Robinson Tejero': 78,
    'SM Epza': 79,
  };

  // Use route-specific mapping if route ID is provided
  if (routeId === 1) {
    return route1Map[checkpointName] || null;
  } else if (routeId === 2) {
    return route2Map[checkpointName] || null;
  }

  // Default to Route 1 mapping for backward compatibility
  return route1Map[checkpointName] || null;
};

/**
 * Get fare info with dynamic calculation
 */
export const getFareInfo = async (
  from: string, 
  to: string, 
  routeId?: number
): Promise<FareInfo | null> => {
  const fare = await calculateFare(from, to, routeId);
  if (fare !== null) {
    return { from, to, fare };
  }
  return null;
};

/**
 * Calculate fare with discount applied
 */
export const calculateFareWithDiscount = (
  baseFare: number,
  discountType?: 'PWD' | 'Senior Citizen' | 'Student',
  discountAmount?: number
): number => {
  return fareMatrixService.calculateFareWithDiscount(baseFare, discountType, discountAmount);
};

/**
 * Format fare amount for display
 */
export const formatFareAmount = (amount: number): string => {
  return fareMatrixService.formatFareAmount(amount);
};

/**
 * Get comprehensive fare calculation summary
 */
export const getFareCalculationSummary = async (
  from: string,
  to: string,
  routeId?: number,
  discountType?: string,
  discountPercentage?: number
): Promise<{
  from: string;
  to: string;
  baseFare: number;
  discountType?: string;
  discountPercentage?: number;
  finalFare: number;
  savings?: number;
  calculationMethod: string;
} | null> => {
  try {
    const baseFare = await calculateFare(from, to, routeId);
    if (baseFare === null) {
      return null;
    }

    // Calculate discount amount from percentage
    const discountAmount = discountPercentage ? (baseFare * discountPercentage / 100) : 0;
    const finalFare = calculateFareWithDiscount(baseFare, discountType as any, discountAmount);
    const savings = discountAmount > 0 ? baseFare - finalFare : 0;

    return {
      from,
      to,
      baseFare,
      discountType,
      discountPercentage,
      finalFare,
      savings: savings > 0 ? savings : undefined,
      calculationMethod: 'dynamic_matrix'
    };
  } catch (error) {
    console.error('Error getting fare calculation summary:', error);
    return null;
  }
};