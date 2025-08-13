import { Ionicons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import React, { useRef, useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Button } from '../../../components/common/Button';
import { InfoCard } from '../../../components/common/InfoCard';
import { useCameraPermissions } from '../../../shared/helpers/useCameraPermission';
import { COLORS, SPACING } from '../../../shared/styles';
import { globalStyles } from '../../../shared/styles/globalStyles';
import { showAlert } from '../../../shared/utils/alertUtils';
import styles from '../styles/ScannerScreen.styles';

export const ScannerScreen: React.FC = () => {
  const hasPermission = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
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

  const parseQRData = (data: string) => {
    try {
      // Try to parse as JSON first (for payment QR codes)
      const parsed = JSON.parse(data);
      return parsed?.type === 'payment' ? parsed : null;
    } catch {
      // If not JSON, ignore (not a payment QR)
      return null;
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

    const qrData = parseQRData(data);

    if (qrData && qrData.type === 'payment') {
      // Handle payment QR code
      setScanned(true);
      setShowCamera(false);
      Alert.alert(
        'Payment QR Detected',
        `Jeepney: ${qrData.jeepneyId || 'LKB-001'}\nFare: ₱${qrData.amount}\nRoute: ${qrData.route || 'Unknown'}\n\nProceed with payment?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Pay Now', 
            onPress: () => createXenditPayment(qrData)
          }
        ]
      );
    } else {
      // Not a valid payment QR; keep scanning
      isHandlingScanRef.current = false;
      return;
    }
  };

  const scannerFeatures = [
    '• Payment QR codes for instant fare payment',
    '• Jeepney information and current location',
    '• Route details and stops',
    '• Estimated arrival times',
    '• Driver contact information',
  ];

  return (
    <ScrollView style={globalStyles.container}>
      <View style={styles.scannerContainer}>
        <Ionicons name="qr-code" size={96} color={COLORS.primary} />
        <Text style={styles.scannerTitle}>Scan QR Code</Text>
        <Text style={styles.scannerSubtitle}>
          Point your camera at the QR code for payments or jeepney info
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