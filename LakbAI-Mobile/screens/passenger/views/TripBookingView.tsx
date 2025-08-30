import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { Button } from '../../../components/common/Button';
import { LocationSelector } from '../../../components/common/LocationSelector';
import { usePassengerState } from '../hooks/usePassengerState';
import { QRDriverInfo, TripBookingData, QRCodeData } from '../../../shared/types';
import { calculateFare, getFareInfo } from '../../../shared/utils/fareCalculator';
import { COLORS, SPACING } from '../../../shared/styles';
import { globalStyles } from '../../../shared/styles/globalStyles';

interface TripBookingViewProps {
  qrData: QRCodeData;
  driverInfo: QRDriverInfo;
  onBack: () => void;
  onBookingComplete: (bookingData: TripBookingData) => void;
}

export const TripBookingView: React.FC<TripBookingViewProps> = ({
  qrData,
  driverInfo,
  onBack,
  onBookingComplete,
}) => {
  const { passengerProfile } = usePassengerState();
  const [pickupLocation, setPickupLocation] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [fare, setFare] = useState<number | null>(null);
  const [discountedFare, setDiscountedFare] = useState<number | null>(null);

  // Calculate fare when locations change
  useEffect(() => {
    if (pickupLocation && destination && pickupLocation !== destination) {
      const calculatedFare = calculateFare(pickupLocation, destination);
      setFare(calculatedFare);

      // Apply discount if passenger has approved discount
      if (calculatedFare && passengerProfile.fareDiscount.status === 'approved') {
        const discount = passengerProfile.fareDiscount.percentage;
        const discounted = calculatedFare * (1 - discount / 100);
        setDiscountedFare(Math.round(discounted));
      } else {
        setDiscountedFare(null);
      }
    } else {
      setFare(null);
      setDiscountedFare(null);
    }
  }, [pickupLocation, destination, passengerProfile.fareDiscount]);

  const estimateDistance = (from: string, to: string): string => {
    // Simple estimation based on checkpoint order
    // In a real app, this would use actual distance calculation
    const fareInfo = getFareInfo(from, to);
    if (fareInfo) {
      const km = Math.round(fareInfo.fare / 10); // Rough estimate: ₱10 per km
      return `${km}km`;
    }
    return 'Unknown';
  };

  const estimateTime = (from: string, to: string): string => {
    // Simple estimation based on distance
    const fareInfo = getFareInfo(from, to);
    if (fareInfo) {
      const minutes = Math.round(fareInfo.fare / 8); // Rough estimate: ₱8 per minute
      return `${minutes} mins`;
    }
    return 'Unknown';
  };

  const handleBookTrip = async () => {
    if (!pickupLocation || !destination || !fare) {
      Alert.alert('Error', 'Please select both pickup and destination points.');
      return;
    }

    if (pickupLocation === destination) {
      Alert.alert('Error', 'Pickup and destination cannot be the same.');
      return;
    }

    setIsLoading(true);

    try {
      const tripData: TripBookingData = {
        driver: driverInfo,
        pickupLocation,
        destination,
        fare,
        discountedFare: discountedFare ?? undefined,
        distance: estimateDistance(pickupLocation, destination),
        estimatedTime: estimateTime(pickupLocation, destination),
        qrCodeData: qrData,
      };

      // Create payment with Xendit
      const paymentResponse = await createXenditPayment(tripData);
      
      if (paymentResponse.success && paymentResponse.paymentUrl) {
        // Open payment gateway
        await WebBrowser.openBrowserAsync(paymentResponse.paymentUrl);
        onBookingComplete(tripData);
      } else {
        throw new Error(paymentResponse.error || 'Failed to create payment');
      }
    } catch (error: any) {
      Alert.alert('Booking Error', error.message || 'Failed to book trip');
    } finally {
      setIsLoading(false);
    }
  };

  const createXenditPayment = async (tripData: TripBookingData) => {
    try {
      const finalFare = tripData.discountedFare ?? tripData.fare;
      const originalFare = tripData.fare;
      const discountAmount = originalFare - finalFare;
      
      // Construct detailed payment description with all trip information
      const description = `LakbAI Jeepney Ride | Driver: ${tripData.driver.name} | Jeepney: ${tripData.driver.jeepneyNumber} | Route: ${tripData.pickupLocation} → ${tripData.destination} | Distance: ${tripData.distance} | Time: ${tripData.estimatedTime}${discountAmount > 0 ? ` | Original: ₱${originalFare} | Discount: ₱${discountAmount}` : ''}`;
      
      // Generate unique booking/external ID
      const externalId = `lakbai_trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Construct enhanced payment URL with all trip details auto-filled
      const paymentParams = new URLSearchParams({
        amount: finalFare.toString(),
        description: description,
        external_id: externalId,
        payer_email: passengerProfile.email || 'passenger@lakbai.com',
        customer_name: passengerProfile.fullName || 'LakbAI Passenger',
        success_redirect_url: 'lakbai://payment-success',
        failure_redirect_url: 'lakbai://payment-failure',
        // Custom data for webhook processing
        custom_data: JSON.stringify({
          type: 'jeepney_fare',
          driver_id: tripData.driver.id,
          driver_name: tripData.driver.name,
          jeepney_number: tripData.driver.jeepneyNumber,
          pickup_location: tripData.pickupLocation,
          destination: tripData.destination,
          original_fare: originalFare,
          discount_amount: discountAmount,
          final_fare: finalFare,
          passenger_id: passengerProfile.id || 'passenger_001',
          booking_timestamp: new Date().toISOString(),
          distance: tripData.distance,
          estimated_time: tripData.estimatedTime
        })
      });
      
      const paymentUrl = `https://checkout-staging.xendit.co/od/lakbai?${paymentParams.toString()}`;
      
      // Log payment creation for debugging
      console.log('💳 Creating Xendit payment:', {
        externalId,
        amount: finalFare,
        description,
        customerName: passengerProfile.fullName,
        customerEmail: passengerProfile.email
      });
      
      return {
        success: true,
        paymentUrl,
        bookingId: externalId,
        amount: finalFare,
        description,
        externalId
      };

      // TODO: Replace with actual API call when backend is available
      // const response = await fetch('/api/create-trip-payment', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     tripData,
      //     passengerProfile,
      //     amount: finalFare,
      //     externalId,
      //     description,
      //   })
      // });
      // return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create payment',
      };
    }
  };

  const finalFareAmount = discountedFare || fare;
  const hasDiscount = discountedFare && passengerProfile.fareDiscount.status === 'approved';

  return (
    <ScrollView style={globalStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gray800} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Driver Info Card */}
      <View style={styles.driverCard}>
        <View style={styles.driverHeader}>
          <View style={styles.driverAvatar}>
            <Ionicons name="person" size={32} color={COLORS.gray500} />
          </View>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{driverInfo.name}</Text>
            <Text style={styles.driverDetails}>
              License: {driverInfo.license}
            </Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.rating}>{driverInfo.rating}</Text>
              <Text style={styles.trips}>• {driverInfo.totalTrips} trips</Text>
            </View>
          </View>
        </View>

        <View style={styles.jeepneyInfo}>
          <View style={styles.jeepneyHeader}>
            <Ionicons name="bus" size={20} color={COLORS.primary} />
            <Text style={styles.jeepneyTitle}>Jeepney Information</Text>
          </View>
          <Text style={styles.jeepneyDetail}>Number: {driverInfo.jeepneyNumber}</Text>
          {driverInfo.plateNumber && (
            <Text style={styles.jeepneyDetail}>Plate: {driverInfo.plateNumber}</Text>
          )}
          <Text style={styles.jeepneyDetail}>Route: {driverInfo.route}</Text>
          <Text style={styles.jeepneyDetail}>Current Location: {driverInfo.currentLocation}</Text>
        </View>
      </View>

      {/* Location Selection */}
      <View style={styles.locationSection}>
        <Text style={styles.sectionTitle}>Ride Details</Text>
        
        <LocationSelector
          label="Pickup Location:"
          selectedLocation={pickupLocation}
          onLocationSelect={setPickupLocation}
          placeholder="Select your pickup point"
          excludeLocation={destination}
        />

        <LocationSelector
          label="Destination:"
          selectedLocation={destination}
          onLocationSelect={setDestination}
          placeholder="Select your destination"
          excludeLocation={pickupLocation}
        />
      </View>

      {/* Fare Information */}
      {fare && (
        <View style={styles.fareCard}>
          <View style={styles.fareHeader}>
            <Ionicons name="cash" size={20} color={COLORS.primary} />
            <Text style={styles.fareTitle}>Fare Information</Text>
          </View>
          
          <View style={styles.fareDetails}>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Distance:</Text>
              <Text style={styles.fareValue}>{estimateDistance(pickupLocation, destination)}</Text>
            </View>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Estimated Time:</Text>
              <Text style={styles.fareValue}>{estimateTime(pickupLocation, destination)}</Text>
            </View>
            
            {hasDiscount && (
              <>
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Original Fare:</Text>
                  <Text style={[styles.fareValue, styles.crossedOut]}>₱{fare}</Text>
                </View>
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>
                    Discount ({passengerProfile.fareDiscount.type} - {passengerProfile.fareDiscount.percentage}%):
                  </Text>
                  <Text style={styles.discountValue}>-₱{fare - discountedFare!}</Text>
                </View>
              </>
            )}
            
            <View style={styles.totalFareRow}>
              <Text style={styles.totalFareLabel}>Total Fare:</Text>
              <Text style={styles.totalFareValue}>₱{finalFareAmount}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Book Trip Button */}
      <Button
        title={isLoading ? 'Processing...' : `Continue - ₱${finalFareAmount || 0}`}
        onPress={handleBookTrip}
        disabled={!pickupLocation || !destination || !fare || isLoading}
        style={styles.bookButton}
      />

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>Creating payment...</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginBottom: SPACING.lg,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray800,
  },
  headerSpacer: {
    width: 40,
  },
  driverCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  driverHeader: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  driverAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray800,
    marginBottom: 4,
  },
  driverDetails: {
    fontSize: 14,
    color: COLORS.gray500,
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray800,
    marginLeft: 4,
  },
  trips: {
    fontSize: 14,
    color: COLORS.gray500,
    marginLeft: 4,
  },
  jeepneyInfo: {
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  jeepneyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  jeepneyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray800,
    marginLeft: SPACING.sm,
  },
  jeepneyDetail: {
    fontSize: 14,
    color: COLORS.gray500,
    marginBottom: 4,
  },
  locationSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray800,
    marginBottom: SPACING.md,
  },
  fareCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fareHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  fareTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray800,
    marginLeft: SPACING.sm,
  },
  fareDetails: {
    gap: SPACING.sm,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fareLabel: {
    fontSize: 14,
    color: COLORS.gray500,
    flex: 1,
  },
  fareValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray800,
  },
  crossedOut: {
    textDecorationLine: 'line-through',
    color: COLORS.gray500,
  },
  discountValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.success,
  },
  totalFareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    marginTop: SPACING.sm,
  },
  totalFareLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray800,
  },
  totalFareValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  bookButton: {
    marginBottom: SPACING.lg,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
  },
  loadingText: {
    marginLeft: SPACING.sm,
    fontSize: 14,
    color: COLORS.gray500,
  },
});
