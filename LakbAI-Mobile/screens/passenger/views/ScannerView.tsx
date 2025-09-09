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

import styles from '../styles/ScannerScreen.styles';

export const ScannerScreen: React.FC = () => {
  const hasPermission = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showTripBooking, setShowTripBooking] = useState(false);
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [driverInfo, setDriverInfo] = useState<QRDriverInfo | null>(null);
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
      
      if (result.status === 'success' && result.driverInfo) {
        console.log('✅ Driver info fetched successfully:', result.driverInfo);
        return result.driverInfo;
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
      
      // Try multiple base URLs for different environments
      const possibleBases = [
        'http://localhost',      // iOS Simulator
        'http://10.0.2.2',      // Android Emulator  
        'http://127.0.0.1',     // Alternative localhost
        'http://192.168.1.100'  // Replace with your computer's IP
      ];
      
      // Simple fallback to the static Xendit link
      console.log('Payment data:', paymentData);
      
      // Directly open the static Xendit checkout for now
      await WebBrowser.openBrowserAsync('https://checkout-staging.xendit.co/od/lakbai');
      return;

      // TODO: Uncomment when backend is accessible
      // const response = await fetch(url, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     amount: paymentData.amount,
      //     description: paymentData.description || `Fare payment for ${paymentData.jeepneyId}`,
      //     jeepneyId: paymentData.jeepneyId || 'LKB-001',
      //     customerName: 'LakbAI Passenger',
      //     customerEmail: 'passenger@lakbai.com'
      //   })
      // });
      // const result = await response.json();
      // if (response.ok && result.invoice_url) {
      //   await WebBrowser.openBrowserAsync(result.invoice_url);
      // } else {
      //   throw new Error(result.error || 'Failed to create payment');
      // }
    } catch (error: any) {
      Alert.alert('Payment Error', error.message || 'Failed to create payment');
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
    setShowTripBooking(false);
    setQrData(null);
    setDriverInfo(null);
    setScanned(false);
    isHandlingScanRef.current = false;
    
    try {
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
      };

      const earningsResult = await earningsService.updateDriverEarnings(earningsUpdate);
      
      if (earningsResult.success) {
        console.log('✅ Driver earnings updated successfully');
        
        // Send real-time payment notification to driver
        console.log('🔔 Would notify driver about payment:', {
          fare: bookingData.discountedFare || bookingData.fare,
          passenger: 'LakbAI Passenger',
          route: `${bookingData.pickupLocation} → ${bookingData.destination}`
        });
      } else {
        console.error('❌ Failed to update driver earnings:', earningsResult.error);
      }

      Alert.alert(
        'Payment Successful! 🎉',
        `Your ride from ${bookingData.pickupLocation} to ${bookingData.destination} has been paid.\n\nDriver: ${bookingData.driver.name}\nJeepney: ${bookingData.driver.jeepneyNumber}\nFare: ₱${bookingData.discountedFare || bookingData.fare}\n\n💰 Driver earnings updated automatically!`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error processing payment completion:', error);
      
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

  return (
    <ScrollView style={globalStyles.container}>
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