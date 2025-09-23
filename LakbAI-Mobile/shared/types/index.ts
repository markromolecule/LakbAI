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
  id: string | number; // Add ID field for database reference
  name: string;
  license: string;
  jeepneyNumber: string;
  rating: number;
  totalTrips: number;
  yearsExperience: number;
  todayTrips: number;
  todayEarnings: number;
  totalEarnings: number; // Lifetime earnings across all shifts
  route: string;
  drivers_license_verified?: boolean;
  license_status?: string;
  is_verified?: boolean;
}

export interface TripLog {
  time: string;
  location: string;
  passengers: number;
}

// QR Code Workflow Interfaces
export interface QRDriverInfo {
  id: string;
  name: string;
  license: string;
  jeepneyNumber: string;
  jeepneyModel?: string;
  rating: number;
  totalTrips: number;
  route: string;
  currentLocation: string;
  contactNumber?: string;
  plateNumber?: string;
}

export interface QRCodeData {
  type: 'driver_pickup' | 'payment';
  driverId: string;
  jeepneyId: string;
  route: string;
  currentLocation?: string; // Driver's current location for auto-fill
  timestamp: string;
  // For legacy payment QR codes
  amount?: number;
  description?: string;
}

export interface TripBookingData {
  driver: QRDriverInfo;
  pickupLocation: string;
  destination: string;
  fare: number;
  discountedFare?: number;
  distance: string;
  estimatedTime: string;
  qrCodeData: QRCodeData;
}

export interface BookingConfirmation {
  bookingId: string;
  tripData: TripBookingData;
  paymentUrl: string;
  expiresAt: string;
}

export interface EmergencyContact {
  label: string;
  number: string;
  type: "tel" | "emergency";
}

export type DriverView = 'home' | 'scanner' | 'fare' | 'profile' | 'logs' | 'earnings' | 'qrcode';

// Export passenger types
export * from './authentication';

