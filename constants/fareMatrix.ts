import { FareInfo } from '../shared/types';

export const FARE_MATRIX: FareInfo[] = [
  { from: 'Tejero Terminal', to: 'Barangay San Jose', fare: 12 },
  { from: 'Tejero Terminal', to: 'Town Center', fare: 15 },
  { from: 'Tejero Terminal', to: 'SM Dasmariñas', fare: 18 },
  { from: 'Barangay San Jose', to: 'Town Center', fare: 12 },
  { from: 'Town Center', to: 'SM Dasmariñas', fare: 15 },
  { from: 'SM Dasmariñas', to: 'De La Salle University', fare: 12 },
  { from: 'De La Salle University', to: 'Ayala Malls', fare: 15 },
  { from: 'Ayala Malls', to: 'Pala-pala Terminal', fare: 18 }
];