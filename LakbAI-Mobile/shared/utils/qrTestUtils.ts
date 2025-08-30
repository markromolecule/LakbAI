import { QRCodeData } from '../types';

// Mock QR Code Generation Utilities for Testing

export const generateDriverPickupQR = (
  driverId: string = 'driver_001',
  jeepneyId: string = 'LKB-001',
  route: string = 'Robinson Tejero - Robinson Pala-pala'
): string => {
  const qrData: QRCodeData = {
    type: 'driver_pickup',
    driverId,
    jeepneyId,
    route,
    timestamp: new Date().toISOString(),
  };
  
  return JSON.stringify(qrData);
};

export const generatePaymentQR = (
  amount: number = 25,
  jeepneyId: string = 'LKB-001',
  route: string = 'Robinson Tejero - Robinson Pala-pala',
  description?: string
): string => {
  const qrData: QRCodeData = {
    type: 'payment',
    driverId: 'driver_001',
    jeepneyId,
    route,
    timestamp: new Date().toISOString(),
    amount,
    description: description || `Payment for ${jeepneyId}`,
  };
  
  return JSON.stringify(qrData);
};

// Test QR codes for different scenarios
export const TEST_QR_CODES = {
  // Driver pickup QR code for booking trips
  DRIVER_PICKUP: generateDriverPickupQR(),
  
  // Legacy payment QR code
  PAYMENT_QR: generatePaymentQR(25),
  
  // Different jeepney
  DIFFERENT_JEEPNEY: generateDriverPickupQR('driver_002', 'LKB-002', 'Dasmarinas - Imus'),
  
  // High fare payment
  HIGH_FARE_PAYMENT: generatePaymentQR(50, 'LKB-001', 'Long Route'),
};

// Console helpers for testing
export const logTestQRCodes = () => {
  console.log('=== TEST QR CODES FOR LAKBAI ===');
  console.log('\n1. Driver Pickup QR (for trip booking):');
  console.log(TEST_QR_CODES.DRIVER_PICKUP);
  console.log('\n2. Payment QR (legacy):');
  console.log(TEST_QR_CODES.PAYMENT_QR);
  console.log('\n3. Different Jeepney:');
  console.log(TEST_QR_CODES.DIFFERENT_JEEPNEY);
  console.log('\n4. High Fare Payment:');
  console.log(TEST_QR_CODES.HIGH_FARE_PAYMENT);
  console.log('\n=== END TEST QR CODES ===');
};

// Function to create QR code for a specific driver
export const createDriverQR = (
  driverName: string,
  jeepneyNumber: string,
  currentLocation: string
): string => {
  const driverId = `driver_${Date.now()}`;
  return generateDriverPickupQR(
    driverId,
    jeepneyNumber,
    `${currentLocation} - Robinson Pala-pala`
  );
};

// Function to validate QR code format
export const validateQRCode = (qrString: string): { valid: boolean; data?: QRCodeData; error?: string } => {
  try {
    const parsed = JSON.parse(qrString);
    
    if (!parsed.type) {
      return { valid: false, error: 'Missing type field' };
    }
    
    if (!['driver_pickup', 'payment'].includes(parsed.type)) {
      return { valid: false, error: 'Invalid type field' };
    }
    
    if (!parsed.driverId || !parsed.jeepneyId || !parsed.route || !parsed.timestamp) {
      return { valid: false, error: 'Missing required fields' };
    }
    
    return { valid: true, data: parsed as QRCodeData };
  } catch (error) {
    return { valid: false, error: 'Invalid JSON format' };
  }
};
