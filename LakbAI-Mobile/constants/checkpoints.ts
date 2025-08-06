export const CHECKPOINTS = [
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
  'Robinson Pala-pala'
] as const;

export type Checkpoint = typeof CHECKPOINTS[number];