import { FARE_MATRIX } from '../../constants/fareMatrix';
import { CHECKPOINTS } from '../../constants/checkpoints';
import { FareInfo } from '../types';

export const calculateFare = (from: string, to: string): number | null => {
  // First try direct route
  const directFare = FARE_MATRIX.find(f => f.from === from && f.to === to);
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
    return 0; // Same location
  }

  // Calculate cumulative fare for the route
  let totalFare = 0;
  const startIndex = Math.min(fromIndex, toIndex);
  const endIndex = Math.max(fromIndex, toIndex);

  for (let i = startIndex; i < endIndex; i++) {
    const currentStop = CHECKPOINTS[i];
    const nextStop = CHECKPOINTS[i + 1];
    
    const segmentFare = FARE_MATRIX.find(f => f.from === currentStop && f.to === nextStop);
    if (segmentFare) {
      totalFare += segmentFare.fare;
    } else {
      // Fallback: base fare per segment if not found
      totalFare += 12; // Base fare
    }
  }

  console.log(`Calculated fare from ${from} to ${to}: ₱${totalFare}`);
  return totalFare;
};

export const getFareInfo = (from: string, to: string): FareInfo | null => {
  const fare = calculateFare(from, to);
  if (fare !== null) {
    return { from, to, fare };
  }
  return null;
};