export const CHECKPOINTS = [
  'Tejero Terminal',
  'Barangay San Jose',
  'Town Center',
  'SM Dasmariñas',
  'De La Salle University',
  'Ayala Malls',
  'Pala-pala Terminal'
] as const;

export type Checkpoint = typeof CHECKPOINTS[number];