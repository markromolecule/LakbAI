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
import { ModernLocationSelector } from '../../../components/common/ModernLocationSelector';
import { usePassengerState } from '../hooks/usePassengerState';
import { QRDriverInfo, TripBookingData, QRCodeData } from '../../../shared/types';
import { calculateFare, getFareInfo, getFareCalculationSummary, formatFareAmount } from '../../../shared/utils/fareCalculator';
import { COLORS, SPACING } from '../../../shared/styles';
import { globalStyles } from '../../../shared/styles/globalStyles';
import { LocationNotificationDisplay } from '../../../components/passenger/LocationNotificationDisplay';

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
  const [fareCalculationSummary, setFareCalculationSummary] = useState<any>(null);
  const [isCalculatingFare, setIsCalculatingFare] = useState(false);
  const [isAutoFilledLocation, setIsAutoFilledLocation] = useState(false);
  const [realTimeDriverLocation, setRealTimeDriverLocation] = useState<string>('');
  const [isLoadingDriverLocation, setIsLoadingDriverLocation] = useState(false);
  const [locationLastUpdated, setLocationLastUpdated] = useState<string>('');
  const [realDriverData, setRealDriverData] = useState<any>(null);
  const [isLoadingDriverData, setIsLoadingDriverData] = useState(false);

  // Auto-fill pickup location from QR code when component mounts
  useEffect(() => {
    const autoFillPickupLocation = async () => {
      if (qrData?.currentLocation) {
        console.log('🎯 Auto-filling pickup location from QR code:', qrData.currentLocation);
        setPickupLocation(qrData.currentLocation);
        setRealTimeDriverLocation(qrData.currentLocation);
        setLocationLastUpdated(new Date().toLocaleTimeString());
        setIsAutoFilledLocation(true);
      } else if (driverInfo?.currentLocation && driverInfo.currentLocation !== 'Unknown') {
        console.log('🎯 Auto-filling pickup location from driver info:', driverInfo.currentLocation);
        setPickupLocation(driverInfo.currentLocation);
        setRealTimeDriverLocation(driverInfo.currentLocation);
        setLocationLastUpdated(new Date().toLocaleTimeString());
        setIsAutoFilledLocation(true);
      } else if (driverInfo?.id) {
        // Fetch real-time driver location from API
        try {
          setIsLoadingDriverLocation(true);
          console.log('🔄 Fetching real-time driver location for driver ID:', driverInfo.id);
          const realTimeLocation = await fetchDriverRealTimeLocation(driverInfo.id);
          if (realTimeLocation) {
            console.log('✅ Got real-time driver location:', realTimeLocation);
            setPickupLocation(realTimeLocation);
            setRealTimeDriverLocation(realTimeLocation);
            setLocationLastUpdated(new Date().toLocaleTimeString());
            setIsAutoFilledLocation(true);
          }
        } catch (error) {
          console.error('❌ Error fetching real-time driver location:', error);
        } finally {
          setIsLoadingDriverLocation(false);
        }
      }
    };

    autoFillPickupLocation();
  }, [qrData, driverInfo]);

  // Fetch real driver data from database
  useEffect(() => {
    const loadDriverData = async () => {
      if (driverInfo?.id) {
        try {
          setIsLoadingDriverData(true);
          console.log('🔄 Fetching real driver data for driver ID:', driverInfo.id);
          const driverData = await fetchDriverData(driverInfo.id);
          if (driverData) {
            console.log('✅ Got real driver data:', driverData);
            setRealDriverData(driverData);
          }
        } catch (error) {
          console.error('❌ Error fetching driver data:', error);
        } finally {
          setIsLoadingDriverData(false);
        }
      }
    };

    loadDriverData();
  }, [driverInfo?.id]);

  // Calculate fare when locations change using dynamic fare matrix
  useEffect(() => {
    const calculateFareAsync = async () => {
      if (pickupLocation && destination && pickupLocation !== destination) {
        setIsCalculatingFare(true);
        
        try {
          // Get route ID from driver info if available
          const routeId = driverInfo.route ? getRouteIdFromRouteName(driverInfo.route) : undefined;
          
          // Use dynamic fare calculation
          const calculatedFare = await calculateFare(pickupLocation, destination, routeId);
          setFare(calculatedFare);

          // Get comprehensive fare calculation summary
          const summary = await getFareCalculationSummary(
            pickupLocation,
            destination,
            routeId,
            passengerProfile.fareDiscount.status === 'approved' ? passengerProfile.fareDiscount.type : undefined,
            passengerProfile.fareDiscount.status === 'approved' ? passengerProfile.fareDiscount.percentage : undefined
          );

          if (summary) {
            setFareCalculationSummary(summary);
            setDiscountedFare(summary.finalFare);
          } else {
            // Fallback to old calculation method
            if (calculatedFare && passengerProfile.fareDiscount.status === 'approved') {
              const discount = passengerProfile.fareDiscount.percentage;
              const discounted = calculatedFare * (1 - discount / 100);
              setDiscountedFare(Math.round(discounted * 100) / 100); // Round to 2 decimal places
            } else {
              setDiscountedFare(null);
            }
          }
        } catch (error) {
          console.error('Error calculating fare:', error);
          // Fallback to legacy calculation
          try {
            const calculatedFare = await calculateFare(pickupLocation, destination);
            setFare(calculatedFare);
            
            if (calculatedFare && passengerProfile.fareDiscount.status === 'approved') {
              const discount = passengerProfile.fareDiscount.percentage;
              const discounted = calculatedFare * (1 - discount / 100);
              setDiscountedFare(Math.round(discounted * 100) / 100); // Round to 2 decimal places
            } else {
              setDiscountedFare(null);
            }
          } catch (fallbackError) {
            console.error('Fallback fare calculation failed:', fallbackError);
            setFare(null);
            setDiscountedFare(null);
          }
        } finally {
          setIsCalculatingFare(false);
        }
      } else {
        setFare(null);
        setDiscountedFare(null);
        setFareCalculationSummary(null);
      }
    };

    calculateFareAsync();
  }, [pickupLocation, destination, passengerProfile.fareDiscount, driverInfo.route]);

  // Helper function to get route ID from route name
  const getRouteIdFromRouteName = (routeName: string): number | undefined => {
    // This is a simplified mapping - in a real implementation, 
    // you would fetch this from the API
    const routeMap: { [key: string]: number } = {
      'SM Epza → SM Dasmariñas': 1,
      'SM Dasmariñas → SM Epza': 2,
    };
    return routeMap[routeName];
  };

  const estimateDistance = (from: string, to: string): string => {
    // Use dynamic fare to estimate distance
    if (fare && fare > 0) {
      // Rough estimate: ₱10 per km for jeepney rides
      const km = Math.round(fare / 10);
      return `${km}km`;
    }
    return 'Unknown';
  };

  const estimateTime = (from: string, to: string): string => {
    // Use dynamic fare to estimate time
    if (fare && fare > 0) {
      // Rough estimate: ₱8 per minute for jeepney rides
      const minutes = Math.round(fare / 8);
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
        const result = await WebBrowser.openBrowserAsync(paymentResponse.paymentUrl);
        
        // For demo purposes, we'll assume payment was successful when browser closes
        // In real implementation, this would be handled by webhooks
        if (result.type === 'cancel' || result.type === 'dismiss') {
          // User closed the browser - assume payment was successful for demo
          // Payment completed - just complete the booking without alert notification
          console.log('✅ Payment gateway closed - completing booking');
          onBookingComplete(tripData);
        }
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
        customer_name: `${passengerProfile.firstName} ${passengerProfile.lastName}` || 'LakbAI Passenger',
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
          passenger_id: 'passenger_001', // TODO: Get from real passenger session
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
        customerName: `${passengerProfile.firstName} ${passengerProfile.lastName}`,
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

  // Function to fetch driver's real-time location
  const fetchDriverRealTimeLocation = async (driverId: string): Promise<string | null> => {
    try {
      const response = await fetch(`http://192.168.254.110/LakbAI/LakbAI-API/routes/api.php/mobile/driver/info/${driverId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📡 Driver real-time location response:', data);

      if (data.status === 'success' && data.data?.current_location) {
        return data.data.current_location;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error fetching driver real-time location:', error);
      return null;
    }
  };

  // Function to fetch complete driver data from database
  const fetchDriverData = async (driverId: string): Promise<any | null> => {
    try {
      const response = await fetch(`http://192.168.254.110/LakbAI/LakbAI-API/routes/api.php/mobile/driver/info/${driverId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📡 Driver data response:', data);

      if (data.status === 'success' && data.data) {
        return data.data;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error fetching driver data:', error);
      return null;
    }
  };

  const finalFareAmount = discountedFare || fare;
  const hasDiscount = discountedFare && passengerProfile.fareDiscount.status === 'approved';
  
  // Debug profile and discount information
  console.log('🎯 TripBookingView Profile Debug:', {
    passengerProfile: passengerProfile?.fareDiscount,
    fare: fare,
    discountedFare: discountedFare,
    finalFareAmount: finalFareAmount,
    hasDiscount: hasDiscount,
    fareCalculationSummary: fareCalculationSummary
  });

  return (
    <ScrollView style={globalStyles.container}>
      {/* Location Notifications */}
      <LocationNotificationDisplay routeId={driverInfo.route ? getRouteIdFromRouteName(driverInfo.route)?.toString() || '1' : '1'} />
      
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
            <View style={styles.licenseRow}>
              <Text style={styles.driverDetails}>
                License: 
              </Text>
              <Text style={[
                styles.driverDetails,
                realDriverData?.license_status === 'approved' && styles.approvedStatus
              ]}>
                {
                  isLoadingDriverData 
                    ? 'Loading...' 
                    : realDriverData?.license || driverInfo.license || 'N/A'
                }
              </Text>
              {isLoadingDriverData && (
                <ActivityIndicator size="small" color={COLORS.primary} style={styles.licenseLoader} />
              )}
            </View>
            <View style={styles.tripContainer}>
              <Ionicons name="car" size={16} color={COLORS.primary} />
              <Text style={styles.tripCount}>
                {isLoadingDriverData 
                  ? 'Loading...' 
                  : `${realDriverData?.totalTrips || driverInfo.totalTrips || 0} trips`
                }
              </Text>
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
          {driverInfo.jeepneyModel && (
            <Text style={styles.jeepneyDetail}>Model: {driverInfo.jeepneyModel}</Text>
          )}
          <Text style={styles.jeepneyDetail}>Route: {driverInfo.route}</Text>
          <View style={styles.locationRow}>
            <Text style={styles.jeepneyDetail}>
              Current Location: {
                isLoadingDriverLocation 
                  ? 'Loading...' 
                  : realTimeDriverLocation || 
                    (driverInfo.currentLocation && driverInfo.currentLocation !== 'Unknown' ? driverInfo.currentLocation : 'Not available')
              }
            </Text>
            {isLoadingDriverLocation && (
              <ActivityIndicator size="small" color={COLORS.primary} style={styles.locationLoader} />
            )}
          </View>
          {locationLastUpdated && !isLoadingDriverLocation && (
            <Text style={styles.locationTimestamp}>
              Last updated: {locationLastUpdated}
            </Text>
          )}
        </View>
      </View>

      {/* Location Selection */}
      <View style={styles.locationSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ride Details</Text>
          {driverInfo?.id && (
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={async () => {
                try {
                  setIsLoadingDriverLocation(true);
                  console.log('🔄 Refreshing driver location...');
                  const realTimeLocation = await fetchDriverRealTimeLocation(driverInfo.id);
                  if (realTimeLocation) {
                    setPickupLocation(realTimeLocation);
                    setRealTimeDriverLocation(realTimeLocation);
                    setLocationLastUpdated(new Date().toLocaleTimeString());
                    setIsAutoFilledLocation(true);
                    console.log('✅ Updated pickup location:', realTimeLocation);
                  }
                } catch (error) {
                  console.error('❌ Error refreshing location:', error);
                } finally {
                  setIsLoadingDriverLocation(false);
                }
              }}
            >
              <Ionicons name="refresh" size={16} color={COLORS.primary} />
              <Text style={styles.refreshText}>Refresh Location</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.locationRow}>
          <ModernLocationSelector
            label="Pickup Location"
            selectedLocation={pickupLocation}
            onLocationSelect={(location) => {
              setPickupLocation(location);
              setIsAutoFilledLocation(false); // Clear auto-fill flag when manually changed
            }}
            placeholder="Select your pickup point"
            excludeLocation={destination}
            isDestination={false}
            driverRoute={driverInfo.route}
          />
          {isAutoFilledLocation && (
            <View style={styles.autoFillBadge}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.autoFillText}>Auto-filled</Text>
            </View>
          )}
        </View>

        <ModernLocationSelector
          label="Destination"
          selectedLocation={destination}
          onLocationSelect={setDestination}
          placeholder="Select your destination"
          excludeLocation={pickupLocation}
          pickupLocation={pickupLocation}
          isDestination={true}
          driverRoute={driverInfo.route}
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
            {isCalculatingFare ? (
              <View style={styles.calculatingContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.calculatingText}>Calculating fare...</Text>
              </View>
            ) : (
              <>
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Distance:</Text>
                  <Text style={styles.fareValue}>{estimateDistance(pickupLocation, destination)}</Text>
                </View>
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Estimated Time:</Text>
                  <Text style={styles.fareValue}>{estimateTime(pickupLocation, destination)}</Text>
                </View>
                
                {/* Dynamic Fare Matrix Information */}
                {fareCalculationSummary && (
                  <View style={styles.fareRow}>
                    <Text style={styles.fareLabel}>Base Fare:</Text>
                    <Text style={styles.fareValue}>{formatFareAmount(fareCalculationSummary.baseFare)}</Text>
                  </View>
                )}
                
                {hasDiscount && (
                  <>
                    <View style={styles.fareRow}>
                      <Text style={styles.fareLabel}>Original Fare:</Text>
                      <Text style={[styles.fareValue, styles.crossedOut]}>
                        {formatFareAmount(fareCalculationSummary?.baseFare || fare || 0)}
                      </Text>
                    </View>
                    <View style={styles.fareRow}>
                      <Text style={styles.fareLabel}>
                        Discount ({passengerProfile.fareDiscount.type}):
                      </Text>
                      <Text style={styles.discountValue}>
                        -{formatFareAmount(fareCalculationSummary?.savings || (fare! - discountedFare!))}
                      </Text>
                    </View>
                  </>
                )}
                
                <View style={styles.totalFareRow}>
                  <Text style={styles.totalFareLabel}>Total Fare:</Text>
                  <Text style={styles.totalFareValue}>{formatFareAmount(finalFareAmount || 0)}</Text>
                </View>
              </>
            )}
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
  licenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  licenseLoader: {
    marginLeft: SPACING.xs,
  },
  approvedStatus: {
    color: COLORS.success,
    fontWeight: '600',
  },
  tripContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripCount: {
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray800,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
  },
  refreshText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
    marginLeft: 4,
  },
  locationRow: {
    position: 'relative',
  },
  autoFillBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: 12,
    zIndex: 1,
  },
  autoFillText: {
    fontSize: 10,
    color: COLORS.success,
    fontWeight: '600',
    marginLeft: 2,
  },
  locationLoader: {
    marginLeft: SPACING.xs,
  },
  locationTimestamp: {
    fontSize: 12,
    color: COLORS.gray500,
    fontStyle: 'italic',
    marginTop: 2,
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
  calculatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
  },
  calculatingText: {
    marginLeft: SPACING.sm,
    fontSize: 14,
    color: COLORS.gray500,
    fontStyle: 'italic',
  },
});
