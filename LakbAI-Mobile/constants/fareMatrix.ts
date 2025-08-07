import { FareInfo } from '../shared/types';

export const FARE_MATRIX: FareInfo[] = [
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
Checkpoints (matching CHECKPOINTS constant)
Robinson Tejero
Malabon
Riverside
Lancaster New City
Pasong Camachile I
Open Canal
Santiago
Bella Vista
San Francisco
Country Meadow
Pabahay
Monterey
Langkaan
Tierra Vista
Robinson Pala-pala
 **/