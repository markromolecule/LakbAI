export interface FareInfo {
  from: string;
  to: string;
  fare: number;
}

export interface ChatMessage {
  type: "user" | "bot";
  message: string;
  timestamp?: Date;
}

export type ViewType = "home" | "scanner" | "chat" | "fare" | "route";

export interface QuickQuestion {
  id: string;
  text: string;
  category?: "fare" | "route" | "time" | "emergency";
}

// Driver-related interfaces
export interface DriverProfile {
  name: string;
  license: string;
  jeepneyNumber: string;
  rating: number;
  totalTrips: number;
  yearsExperience: number;
  todayTrips: number;
  todayEarnings: number;
  route: string;
}

export interface TripLog {
  time: string;
  location: string;
  passengers: number;
}

export interface EmergencyContact {
  label: string;
  number: string;
  type: "tel" | "emergency";
}

export type DriverView = 'home' | 'scanner' | 'fare' | 'profile' | 'logs';

// Export passenger types
export * from './authentication';

