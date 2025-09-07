export const CHECKPOINTS = [
  'SM Epza',
  'Robinson Tejero',
  'Malabon',
  'Riverside',
  'Lancaster New City',
  'Pasong Camachile I',
  'Open Canal',
  'Santiago',
  'Bella Vista',
  'San Francisco',
  'Country Meadow',
  'Pabahay',
  'Monterey',
  'Langkaan',
  'Tierra Vista',
  'Robinson Dasmariñas',
  'SM Dasmariñas',
] as const;

export type Checkpoint = typeof CHECKPOINTS[number];