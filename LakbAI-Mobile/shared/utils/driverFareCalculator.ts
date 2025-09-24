import { driverFareMatrixService } from '../services/driverFareMatrixService';
import { FareInfo } from '../types';

/**
 * Calculate fare using dynamic fare matrix service for drivers
 */
export const calculateDriverFare = async (
  from: string, 
  to: string, 
  routeId?: number
): Promise<number | null> => {
  try {
    console.log('🔄 Driver calculating fare from', from, 'to', to);
    
    // Get route ID from route name if not provided
    if (!routeId) {
      routeId = driverFareMatrixService.getRouteIdFromRouteName('SM Epza → SM Dasmariñas'); // Default route
    }

    // Get checkpoint IDs from names (with route context)
    const fromCheckpointId = getDriverCheckpointIdByName(from, routeId);
    const toCheckpointId = getDriverCheckpointIdByName(to, routeId);

    console.log('📍 Driver Checkpoint IDs:', { fromCheckpointId, toCheckpointId });

    if (fromCheckpointId && toCheckpointId) {
      // Use dynamic fare matrix service
      console.log('🌐 Calling driverFareMatrixService...');
      const result = await driverFareMatrixService.getFareBetweenCheckpoints(
        fromCheckpointId,
        toCheckpointId,
        routeId
      );

      if (result.status === 'success' && result.fare_info) {
        const fare = parseFloat(result.fare_info.fare_amount);
        console.log('✅ Driver fare calculated successfully:', fare);
        return fare;
      } else {
        console.error('❌ Driver fare calculation failed:', result.message);
        return null;
      }
    } else {
      console.error('❌ Driver checkpoint IDs not found for:', from, 'to', to);
      return null;
    }
  } catch (error) {
    console.error('❌ Error in driver fare calculation:', error);
    return null;
  }
};

/**
 * Get checkpoint ID by name (matching database IDs for drivers)
 */
const getDriverCheckpointIdByName = (checkpointName: string, routeId?: number): number | null => {
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
 * Get fare info with dynamic calculation for drivers
 */
export const getDriverFareInfo = async (
  from: string, 
  to: string, 
  routeId?: number
): Promise<FareInfo | null> => {
  const fare = await calculateDriverFare(from, to, routeId);
  if (fare !== null) {
    return { from, to, fare };
  }
  return null;
};

/**
 * Format fare amount for display in driver app
 */
export const formatDriverFareAmount = (amount: number): string => {
  return driverFareMatrixService.formatFareAmount(amount);
};
