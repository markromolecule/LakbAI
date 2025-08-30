# LakbAI QR Code Workflow Implementation Guide

## Overview

This document describes the newly implemented QR code workflow for passengers in the LakbAI mobile application. The workflow allows passengers to scan driver QR codes, select their pickup and destination locations, view driver information, calculate fares with discounts, and pay through Xendit.

## Workflow Steps

### 1. Scan QR Code
- Passenger opens the Scanner screen
- Scans a driver's QR code (either driver pickup QR or legacy payment QR)
- App validates and parses the QR code data

### 2. Driver Information Display
- Shows driver details (name, license, rating, total trips)
- Displays jeepney information (number, plate, route, current location)
- Fetches real-time driver data (mocked for now)

### 3. Location Selection
- Pickup location selection with searchable dropdown
- Destination selection with searchable dropdown
- Excludes already selected location from the other dropdown
- Uses predefined checkpoints from the route

### 4. Fare Calculation
- Automatically calculates fare based on pickup and destination
- Applies passenger discounts if approved (Student 15%, PWD 20%, Senior 30%)
- Shows distance estimation and travel time
- Displays original fare, discount amount, and final fare

### 5. Payment Processing
- Integrates with Xendit payment gateway
- Creates payment link with trip and passenger details
- Opens staged payment gateway in browser
- Handles payment completion and booking confirmation

## Implementation Details

### New Files Created

1. **Types and Interfaces** (`shared/types/index.ts`)
   - `QRDriverInfo`: Driver information structure
   - `QRCodeData`: QR code data format
   - `TripBookingData`: Complete trip booking information
   - `BookingConfirmation`: Booking result data

2. **LocationSelector Component** (`components/common/LocationSelector.tsx`)
   - Reusable location selection component
   - Search functionality for locations
   - Modal-based interface with clean UX
   - Supports excluding specific locations

3. **TripBookingView Screen** (`screens/passenger/views/TripBookingView.tsx`)
   - Main trip booking interface
   - Driver information display
   - Location selection integration
   - Fare calculation with discounts
   - Payment processing integration

4. **Enhanced ScannerView** (`screens/passenger/views/ScannerView.tsx`)
   - Updated to handle new QR code types
   - Integrated trip booking workflow
   - Backward compatibility with legacy payment QR codes
   - Modal navigation between screens

5. **QR Test Utilities** (`shared/utils/qrTestUtils.ts`)
   - Mock QR code generation for testing
   - Validation utilities
   - Test data for different scenarios

### QR Code Format

#### Driver Pickup QR Code (New)
```json
{
  "type": "driver_pickup",
  "driverId": "driver_001",
  "jeepneyId": "LKB-001",
  "route": "Robinson Tejero - Robinson Pala-pala",
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

#### Legacy Payment QR Code
```json
{
  "type": "payment",
  "driverId": "driver_001",
  "jeepneyId": "LKB-001",
  "route": "Robinson Tejero - Robinson Pala-pala",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "amount": 25,
  "description": "Payment for LKB-001"
}
```

### Driver Information Structure

```typescript
interface QRDriverInfo {
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
```

### Fare Calculation Logic

- Base fare calculation using existing `fareCalculator.ts`
- Automatic discount application for approved passengers:
  - Student: 15% discount
  - PWD: 20% discount
  - Senior Citizen: 30% discount
- Distance and time estimation based on checkpoint data

### Payment Integration

- Uses existing Xendit integration infrastructure
- Creates payment URLs with trip-specific parameters
- Supports the staged payment gateway: `https://checkout-staging.xendit.co/od/lakbai`
- Handles payment success and failure scenarios

## Testing the Workflow

### Using Mock QR Codes

```typescript
import { TEST_QR_CODES, logTestQRCodes } from './shared/utils/qrTestUtils';

// Log all test QR codes to console
logTestQRCodes();

// Use in QR scanner for testing
const driverPickupQR = TEST_QR_CODES.DRIVER_PICKUP;
```

### Test Scenarios

1. **Driver Pickup QR**: Scan to start trip booking workflow
2. **Legacy Payment QR**: Test backward compatibility
3. **Different Jeepney**: Test with different driver/jeepney data
4. **Discount Application**: Test with different passenger discount types

### Testing Steps

1. Navigate to Passenger Scanner screen
2. Tap "Scan QR Code" button
3. In camera view, you can test with the generated QR codes
4. For physical testing, generate QR codes from the test utilities
5. Follow the complete workflow: scan → select locations → review fare → pay

## Backend Integration Notes

### Required API Endpoints (To be implemented)

1. **GET `/api/drivers/{driverId}`**
   - Fetch driver information by ID
   - Return driver profile, jeepney details, current location

2. **POST `/api/trips/create-payment`**
   - Create trip-specific payment with Xendit
   - Include trip details, passenger info, and fare calculation
   - Return payment URL and booking ID

3. **POST `/api/trips/confirm`**
   - Confirm trip booking after payment
   - Store trip details in database
   - Send notifications to driver and passenger

### Current Mock Implementation

- Driver information is mocked based on existing driver state
- Payment creation uses static Xendit URL with parameters
- Booking confirmation shows success alert

## User Experience Flow

1. **Seamless Scanning**: One-tap QR code scanning with camera permissions
2. **Intuitive Location Selection**: Search-enabled dropdowns with all route checkpoints
3. **Transparent Pricing**: Clear fare breakdown with discount visibility
4. **Secure Payment**: Direct integration with Xendit payment gateway
5. **Confirmation Feedback**: Clear success/failure messaging and booking details

## Security Considerations

- QR code validation to prevent malicious data
- Passenger authentication required for booking
- Secure payment processing through Xendit
- Input validation for all user-provided data

## Future Enhancements

1. **Real-time Driver Tracking**: GPS integration for live driver locations
2. **Trip History**: Store and display past trip bookings
3. **Driver Ratings**: Allow passengers to rate drivers after trips
4. **Push Notifications**: Real-time updates on trip status
5. **Multiple Payment Methods**: Support for different payment options
6. **Offline Support**: Cache critical data for offline scenarios

## Maintenance and Updates

- Update `CHECKPOINTS` array in `constants/checkpoints.ts` for new routes
- Modify `FARE_MATRIX` in `constants/fareMatrix.ts` for fare changes
- Update discount percentages in passenger profile logic
- Enhance QR code validation for new QR code types

This implementation provides a complete, user-friendly QR code workflow that integrates seamlessly with the existing LakbAI infrastructure while providing room for future enhancements and scalability.
