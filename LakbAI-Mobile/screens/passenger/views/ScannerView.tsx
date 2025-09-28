import { Ionicons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import React, { useRef, useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Button } from '../../../components/common/Button';
import { InfoCard } from '../../../components/common/InfoCard';
import { TripBookingView } from './TripBookingView';
import { useCameraPermissions } from '../../../shared/helpers/useCameraPermission';
import { QRCodeData, QRDriverInfo, TripBookingData } from '../../../shared/types';
import { COLORS, SPACING } from '../../../shared/styles';
import { globalStyles } from '../../../shared/styles/globalStyles';
import { showAlert } from '../../../shared/utils/alertUtils';

import { earningsService, EarningsUpdate } from '../../../shared/services/earningsService';
import { buildAuth0Url } from '../../../config/developerConfig';
import { getBaseUrl } from '../../../config/apiConfig';
import { usePassengerState } from '../hooks/usePassengerState';
import { googleMapsService } from '../../../shared/services/googleMapsService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

import styles from '../styles/ScannerScreen.styles';

export const ScannerScreen: React.FC = () => {
  const hasPermission = useCameraPermissions();
  const router = useRouter();
  const { passengerProfile } = usePassengerState();
  const [showCamera, setShowCamera] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showTripBooking, setShowTripBooking] = useState(false);
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [driverInfo, setDriverInfo] = useState<QRDriverInfo | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const isHandlingScanRef = useRef(false);
  const isOpeningBrowserRef = useRef(false);

  const handleOpenCamera = () => {
    if (hasPermission === null) {
      showAlert('Permission Loading', 'Camera permission is being requested...');
      return;
    }
    if (hasPermission === false) {
      showAlert(
        'No Camera Access',
        'Camera permission is required to scan QR codes. Please enable camera access in your device settings.'
      );
      return;
    }
    // Reset scan guards when opening the camera
    isHandlingScanRef.current = false;
    isOpeningBrowserRef.current = false;
    setShowCamera(true);
    setScanned(false);
  };

  const parseQRData = (data: string): QRCodeData | null => {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(data);
      
      // Support both legacy payment QR codes and new driver pickup QR codes
      if (parsed?.type === 'payment' || parsed?.type === 'driver_pickup') {
        return parsed as QRCodeData;
      }
      
      return null;
    } catch {
      // If not JSON, ignore
      return null;
    }
  };

  // Function to fetch real driver info from API
  const fetchDriverInfo = async (driverId: string): Promise<QRDriverInfo> => {
    try {
      console.log('🔍 Fetching driver info for ID:', driverId);
      
      // Extract numeric ID if driverId is in format "driver_XXX"
      let actualDriverId = driverId;
      if (driverId.startsWith('driver_')) {
        actualDriverId = driverId.replace('driver_', '');
      }
      
      console.log('🔍 Using actual driver ID:', actualDriverId);
      
      // Call the backend API to get driver information with jeepney details
      const baseUrl = getBaseUrl().replace('/routes/api.php', '');
      const response = await fetch(`${baseUrl}/api/mobile/driver/info/${actualDriverId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'success' && result.data) {
        console.log('✅ Driver info fetched successfully:', result.data);
        return result.data;
      } else {
        console.error('❌ API returned error:', result);
        throw new Error(result.message || 'Failed to fetch driver info');
      }
      
    } catch (error) {
      console.error('❌ Error fetching driver info:', error);
      
      // Return fallback data with N/A for missing fields
      return {
        id: driverId,
        name: 'Driver ' + driverId, // Basic fallback name
        license: 'N/A',
        jeepneyNumber: 'LKB-' + driverId.replace('driver_', ''),
        jeepneyModel: 'N/A',
        rating: 0,
        totalTrips: 0,
        route: 'N/A',
        currentLocation: 'N/A',
        contactNumber: 'N/A',
        plateNumber: 'N/A',
      };
    }
  };

  const createXenditPayment = async (paymentData: any) => {
    try {
      if (isOpeningBrowserRef.current) return;
      isOpeningBrowserRef.current = true;
      setProcessing(true);
      
      console.log('Creating Xendit payment with data:', paymentData);
      
      // Use the API configuration to get the base URL
      const { getBaseUrl } = require('../../../config/apiConfig');
      const baseUrl = getBaseUrl().replace('/routes/api.php', '');
      const xenditUrl = `${baseUrl}/public/create_xendit_invoice.php`;
      
      console.log('Xendit API URL:', xenditUrl);
      
      // Prepare payment data
      const requestPayload = {
        amount: paymentData.amount || 25.00,
        description: paymentData.description || `LakbAI Fare Payment for ${paymentData.jeepneyId || 'LKB-001'}`,
        customerEmail: paymentData.customerEmail || 'passenger@lakbai.com',
        customerName: paymentData.customerName || 'LakbAI Passenger',
        jeepneyId: paymentData.jeepneyId || 'LKB-001'
      };
      
      console.log('Payment request payload:', requestPayload);
      
      // Make API call to create Xendit invoice
      const response = await fetch(xenditUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      });
      
      console.log('Xendit API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Xendit API response:', result);
      
      if (result.success && result.data?.invoice_url) {
        // Open the real Xendit invoice URL
        await WebBrowser.openBrowserAsync(result.data.invoice_url);
      } else if (result.fallback && result.data?.invoice_url) {
        // Fallback URL provided
        console.log('Using fallback payment URL');
        await WebBrowser.openBrowserAsync(result.data.invoice_url);
      } else {
        throw new Error(result.error || 'Failed to create payment invoice');
      }
      
    } catch (error: any) {
      console.error('Xendit payment error:', error);
      
      // Fallback to static link if API fails
      console.log('Falling back to static Xendit link');
      try {
        await WebBrowser.openBrowserAsync('https://checkout-staging.xendit.co/od/lakbai');
      } catch (fallbackError) {
        Alert.alert(
          'Payment Error', 
          `Failed to create payment: ${error.message || 'Unknown error'}`
        );
      }
    } finally {
      setProcessing(false);
      isOpeningBrowserRef.current = false;
    }
  };

  const handleBarcodeScanned = async ({ data }: { type: string; data: string }) => {
    if (isHandlingScanRef.current || scanned) return;
    isHandlingScanRef.current = true;

    console.log('🔍 Scanned QR data:', data);
    const parsedQrData = parseQRData(data);
    console.log('🔍 Parsed QR data:', parsedQrData);

    if (parsedQrData?.type === 'driver_pickup') {
      // Handle new driver pickup QR code - show trip booking flow
      setScanned(true);
      setShowCamera(false);
      setProcessing(true);

      try {
        console.log('🚗 Fetching driver info for driver ID:', parsedQrData.driverId);
        const fetchedDriverInfo = await fetchDriverInfo(parsedQrData.driverId);
        console.log('✅ Fetched driver info:', fetchedDriverInfo);
        
        setQrData(parsedQrData);
        setDriverInfo(fetchedDriverInfo);
        setShowTripBooking(true);
      } catch (error) {
        console.error('❌ Error in handleBarcodeScanned:', error);
        Alert.alert('Error', 'Failed to load driver information. Please try again.');
        setScanned(false);
        isHandlingScanRef.current = false;
      } finally {
        setProcessing(false);
      }
    } else if (parsedQrData?.type === 'payment') {
      // Handle legacy payment QR code
      setScanned(true);
      setShowCamera(false);
      Alert.alert(
        'Payment QR Detected',
        `Jeepney: ${parsedQrData.jeepneyId || 'LKB-001'}\nFare: ₱${parsedQrData.amount}\nRoute: ${parsedQrData.route || 'Unknown'}\n\nProceed with payment?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => {
            setScanned(false);
            isHandlingScanRef.current = false;
          }},
          { 
            text: 'Pay Now', 
            onPress: () => createXenditPayment(parsedQrData)
          }
        ]
      );
    } else {
      // Not a valid QR code; keep scanning
      isHandlingScanRef.current = false;
      return;
    }
  };

  const handleTripBookingBack = () => {
    setShowTripBooking(false);
    setQrData(null);
    setDriverInfo(null);
    setScanned(false);
    isHandlingScanRef.current = false;
  };

  const handleBookingComplete = async (bookingData: TripBookingData) => {
    setPaymentLoading(true);
    setPaymentCompleted(false);
    
    try {
      // Get passenger name for notification
      const passengerName = passengerProfile?.firstName && passengerProfile?.lastName 
        ? `${passengerProfile.firstName} ${passengerProfile.lastName}`
        : passengerProfile?.username || 'Passenger';
      
      console.log('💰 Payment made by:', passengerName);
      console.log('💰 Passenger profile data:', {
        firstName: passengerProfile?.firstName,
        lastName: passengerProfile?.lastName,
        username: passengerProfile?.username,
        finalName: passengerName
      });

      // Update driver earnings automatically
      const earningsUpdate: EarningsUpdate = {
        driverId: bookingData.driver.id,
        amount: bookingData.discountedFare || bookingData.fare,
        tripId: `trip_${Date.now()}`,
        passengerId: 'passenger_001', // In real app, this would come from auth
        timestamp: new Date().toISOString(),
        paymentMethod: 'xendit',
        pickupLocation: bookingData.pickupLocation,
        destination: bookingData.destination,
        originalFare: bookingData.fare,
        discountAmount: bookingData.fare - (bookingData.discountedFare || bookingData.fare),
        finalFare: bookingData.discountedFare || bookingData.fare,
        incrementTripCount: false // Explicitly don't increment trip count for passenger payments
      };

      // Store the passenger name for the driver notification
      await earningsService.setLastPaymentSender(bookingData.driver.id, passengerName);

      const earningsResult = await earningsService.updateDriverEarnings(earningsUpdate, passengerName);
      
      if (earningsResult.success) {
        console.log('✅ Driver earnings updated successfully');
        console.log('🔔 Driver notification will be sent automatically by earnings service');
        
        // Send local notification to passenger app
        const { localNotificationService } = await import('../../../shared/services/localNotificationService');
        await localNotificationService.notifyEarningsUpdate({
          type: 'earnings_update',
          driverId: bookingData.driver.id,
          amount: bookingData.discountedFare || bookingData.fare,
          previousEarnings: 0, // We don't have previous earnings in this context
          newEarnings: 0, // We don't have new earnings in this context
          senderName: passengerName,
          paymentMethod: 'xendit',
          title: 'Payment Successful!',
          body: `Sent ₱${bookingData.discountedFare || bookingData.fare} to ${bookingData.driver.name}`,
          data: {
            type: 'payment_confirmation',
            amount: bookingData.discountedFare || bookingData.fare,
            driverName: bookingData.driver.name,
            timestamp: new Date().toISOString()
          }
        });
        
        console.log('💳 Payment confirmation notification sent to passenger app');
      } else {
        console.error('❌ Failed to update driver earnings:', earningsResult.error);
      }

      // Payment successful - show success message
      console.log('✅ Payment completed successfully - driver earnings updated');
      
      // Set payment as completed and show success
      setPaymentCompleted(true);
      
      // Store active trip for home view
      const activeTrip = {
        id: `trip_${Date.now()}`,
        driverId: bookingData.driver.id,
        driverName: bookingData.driver.name,
        jeepneyNumber: bookingData.driver.jeepneyNumber,
        route: bookingData.driver.route,
        pickupLocation: bookingData.pickupLocation,
        destination: bookingData.destination,
        fare: bookingData.discountedFare || bookingData.fare,
        pickupCoordinates: await googleMapsService.getCheckpointCoordinates(bookingData.pickupLocation),
        destinationCoordinates: await googleMapsService.getCheckpointCoordinates(bookingData.destination),
        routeCoordinates: [],
        status: 'waiting' as const,
        startTime: new Date().toISOString(),
      };

      // Store active trip in AsyncStorage
      await AsyncStorage.setItem('active_trip', JSON.stringify(activeTrip));
      console.log('💾 Active trip stored:', activeTrip);

      // Wait a moment to show the success state, then redirect to home view
      setTimeout(() => {
        setPaymentLoading(false);
        setPaymentCompleted(false);
        setShowTripBooking(false);
        setQrData(null);
        setDriverInfo(null);
        setScanned(false);
        isHandlingScanRef.current = false;
        
        // Navigate to home view
        console.log('🏠 Redirecting to home view after payment');
        router.replace('/passenger/home');
        
        // Show success message
        Alert.alert(
          'Payment Successful!',
          `Your ride from ${bookingData.pickupLocation} to ${bookingData.destination} has been paid.\n\nDriver: ${bookingData.driver.name}\nJeepney: ${bookingData.driver.jeepneyNumber}\nFare: ₱${bookingData.discountedFare || bookingData.fare}`,
          [{ text: 'OK' }]
        );
      }, 2000); // Show loading for 2 seconds
      
    } catch (error) {
      console.error('Error processing payment completion:', error);
      
      // Reset loading state
      setPaymentLoading(false);
      setPaymentCompleted(false);
      
      // Still show success to passenger even if earnings update fails
      Alert.alert(
        'Payment Successful!',
        `Your ride from ${bookingData.pickupLocation} to ${bookingData.destination} has been paid.\n\nDriver: ${bookingData.driver.name}\nJeepney: ${bookingData.driver.jeepneyNumber}\nFare: ₱${bookingData.discountedFare || bookingData.fare}`,
        [{ text: 'OK' }]
      );
    }
  };



  const showQRInstructions = () => {
    Alert.alert(
      '📖 QR Code Instructions',
      'How to use QR codes in LakbAI:\n\n' +
      '🚍 DRIVER QR CODES:\n' +
      '• Generated by drivers for passengers\n' +
      '• Contains driver and jeepney information\n' +
      '• Starts trip booking workflow\n' +
      '• Leads to location selection and payment\n\n' +
      '💰 PAYMENT QR CODES (Legacy):\n' +
      '• Direct payment QR codes\n' +
      '• Contains fixed fare amount\n' +
      '• Opens Xendit payment immediately\n\n' +
      '🏢 ADMIN LOCATION QR CODES:\n' +
      '• Scanned by drivers at checkpoints\n' +
      '• Updates driver location\n' +
      '• Notifies nearby passengers\n' +
      '• Handles conflicts with multiple drivers',
      [
        { text: 'Got it!' },
        { 
          text: 'Show Guide', 
          onPress: () => {
            console.log('📚 For complete implementation guide, see: QR_SYSTEM_IMPLEMENTATION_GUIDE.md');
          }
        }
      ]
    );
  };



  const scannerFeatures = [
    '• Driver QR codes to start your ride',
    '• Select pickup location and destination',
    '• View driver information and jeepney details',
    '• Calculate fare with automatic discounts',
    '• Pay securely through Xendit gateway',
    '• Legacy payment QR codes support',
  ];

  // Show loading screen during payment processing
  if (paymentLoading || paymentCompleted) {
    return (
      <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white }]}>
        <View style={styles.loadingContainer}>
          <Ionicons 
            name={paymentCompleted ? "checkmark-circle" : "card"} 
            size={80} 
            color={paymentCompleted ? COLORS.success : COLORS.primary} 
          />
          <Text style={styles.loadingTitle}>
            {paymentCompleted ? 'Payment Successful!' : 'Processing Payment...'}
          </Text>
          <Text style={styles.loadingSubtitle}>
            {paymentCompleted 
              ? 'Your payment has been processed successfully' 
              : 'Please wait while we process your payment'
            }
          </Text>
          <ActivityIndicator 
            size="large" 
            color={COLORS.primary} 
            style={{ marginTop: SPACING.lg }}
          />
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={globalStyles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
      bounces={true}
      alwaysBounceVertical={false}
    >
      <View style={styles.scannerContainer}>
        <Ionicons name="qr-code" size={96} color={COLORS.primary} />
        <Text style={styles.scannerTitle}>Scan QR Code</Text>
        <Text style={styles.scannerSubtitle}>
          Scan driver QR codes to start your ride or payment QR codes for instant fare payment
        </Text>
      </View>

      <View style={styles.cameraPlaceholder}>
        <Ionicons name="camera" size={64} color={COLORS.gray400} />
        <Text style={styles.cameraText}>Camera</Text>
      </View>

      <Button title="Scan QR Code" onPress={handleOpenCamera} style={styles.scanButton} />
      

      
      {processing && (
        <View style={{ alignItems: 'center', marginTop: SPACING.md }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: SPACING.sm, color: COLORS.gray600 }}>
            Creating payment...
          </Text>
        </View>
      )}

      <InfoCard title="After scanning, you'll see:" items={scannerFeatures} />

      {/* Additional Information Section */}
      <View style={styles.additionalInfoContainer}>
        <Text style={styles.additionalInfoTitle}>How to Use QR Scanner</Text>
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.infoItemText}>
              Point your camera at the driver's QR code
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.infoItemText}>
              Wait for the scan confirmation
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.infoItemText}>
              Select your pickup and destination
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.infoItemText}>
              Review fare and payment options
            </Text>
          </View>
        </View>
        
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 Tips for Better Scanning</Text>
          <Text style={styles.tipsText}>
            • Ensure good lighting when scanning{'\n'}
            • Hold your device steady{'\n'}
            • Keep the QR code centered in the frame{'\n'}
            • Make sure the QR code is not damaged or blurry
          </Text>
        </View>
      </View>

      {/* Trip Booking Modal */}
      {showTripBooking && qrData && driverInfo && (
        <Modal visible={showTripBooking} animationType="slide" presentationStyle="pageSheet">
          <TripBookingView
            qrData={qrData}
            driverInfo={driverInfo}
            onBack={handleTripBookingBack}
            onBookingComplete={handleBookingComplete}
          />
        </Modal>
      )}

      {/* Camera Modal */}
      <Modal visible={showCamera} animationType="slide" presentationStyle="fullScreen">
        <View style={styles.cameraContainer}>
          <View style={{ flex: 1 }}>
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            />
            <View style={styles.overlay}>
              <View style={styles.scanArea}>
                <View style={styles.scanFrame} />
              </View>
              <View style={styles.cameraControls}>
                <TouchableOpacity style={styles.closeButton} onPress={() => setShowCamera(false)}>
                  <Ionicons name="close" size={24} color="white" />
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              Position the QR code within the frame to scan
            </Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};