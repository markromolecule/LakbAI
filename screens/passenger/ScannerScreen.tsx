import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraView } from 'expo-camera';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../../components/common/Button';
import { InfoCard } from '../../components/common/InfoCard';
import { COLORS, SPACING } from '../../shared/styles';
import { globalStyles } from '../../shared/styles/globalStyles';

export const ScannerScreen: React.FC = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    getCameraPermissions();
  }, []);

  const getCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleOpenCamera = () => {
    if (hasPermission === null) {
      Alert.alert('Permission Loading', 'Camera permission is being requested...');
      return;
    }
    if (hasPermission === false) {
      Alert.alert(
        'No Camera Access',
        'Camera permission is required to scan QR codes. Please enable camera access in your device settings.',
        [{ text: 'OK' }]
      );
      return;
    }
    setShowCamera(true);
    setScanned(false);
  };

  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    setShowCamera(false);
    
    // Process the QR code data here
    // You can parse the data and extract jeepney information
    Alert.alert(
      'QR Code Scanned!',
      `Data: ${data}\n\nJeepney: LKB-001\nRoute: Tejero - Pala-pala\nCurrent Location: Town Center\nFare from here: ₱15-18\n\nUse the fare calculator for exact fares.`,
      [{ text: 'OK' }]
    );
  };

  const handleSimulateQRScan = () => {
    Alert.alert(
      'QR Code Scanned!',
      'Jeepney: LKB-001\nRoute: Tejero - Pala-pala\nCurrent Location: Town Center\nFare from here: ₱15-18\n\nUse the fare calculator for exact fares.',
      [{ text: 'OK' }]
    );
  };

  const scannerFeatures = [
    '• Current jeepney location',
    '• Fare information for your destination',
    '• Route details and stops',
    '• Estimated arrival times',
    '• Driver contact information'
  ];

  return (
    <ScrollView style={globalStyles.container}>
      <View style={styles.scannerContainer}>
        <Ionicons name="qr-code" size={96} color={COLORS.primary} />
        <Text style={styles.scannerTitle}>Scan QR Code</Text>
        <Text style={styles.scannerSubtitle}>
          Point your camera at the QR code inside the jeepney
        </Text>
      </View>

      <View style={styles.cameraPlaceholder}>
        <Ionicons name="camera" size={64} color={COLORS.gray400} />
        <Text style={styles.cameraText}>Camera</Text>
      </View>

      <Button
        title="Scan QR Code"
        onPress={handleOpenCamera}
        style={styles.scanButton}
      />

      <InfoCard
        title="After scanning, you'll see:"
        items={scannerFeatures}
      />

      {/* Camera Modal */}
      <Modal
        visible={showCamera}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          >
            <View style={styles.overlay}>
              <View style={styles.scanArea}>
                <View style={styles.scanFrame} />
              </View>
              
              <View style={styles.cameraControls}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowCamera(false)}
                >
                  <Ionicons name="close" size={24} color="white" />
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
          
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

const styles = StyleSheet.create({
  scannerContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  scannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray800,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  scannerSubtitle: {
    color: COLORS.gray500,
    textAlign: 'center',
    fontSize: 16,
  },
  cameraPlaceholder: {
    backgroundColor: COLORS.gray100,
    height: 200,
    borderRadius: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.gray300,
    borderStyle: 'dashed',
    marginBottom: SPACING.xl,
  },
  cameraText: {
    color: COLORS.gray400,
    marginTop: SPACING.sm,
  },
  scanButton: {
    marginBottom: SPACING.lg,
  },
  simulateButton: {
    backgroundColor: COLORS.gray600,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 200,
    height: 200,
    borderWidth: 3,
    borderColor: COLORS.primary,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  cameraControls: {
    position: 'absolute',
    bottom: 100,
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  instructionsContainer: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 16,
    alignItems: 'center',
  },
  instructionsText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
});