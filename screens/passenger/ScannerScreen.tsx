import { Ionicons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import React, { useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../../components/common/Button';
import { InfoCard } from '../../components/common/InfoCard';
import { useCameraPermissions } from '../../shared/helpers/useCameraPermission';
import { COLORS } from '../../shared/styles';
import { globalStyles } from '../../shared/styles/globalStyles';
import { showAlert } from '../../shared/utils/alertUtils';
import styles from './styles/ScannerScreen.styles';

export const ScannerScreen: React.FC = () => {
  const hasPermission = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [scanned, setScanned] = useState(false);

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
    setShowCamera(true);
    setScanned(false);
  };

  const handleBarcodeScanned = ({ data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    setShowCamera(false);
    showAlert(
      'QR Code Scanned!',
      `Data: ${data}\n\nJeepney: LKB-001\nRoute: Tejero - Pala-pala\nCurrent Location: Town Center\nFare from here: ₱15-18\n\nUse the fare calculator for exact fares.`
    );
  };

  const scannerFeatures = [
    '• Current jeepney location',
    '• Fare information for your destination',
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
          Point your camera at the QR code inside the jeepney
        </Text>
      </View>

      <View style={styles.cameraPlaceholder}>
        <Ionicons name="camera" size={64} color={COLORS.gray400} />
        <Text style={styles.cameraText}>Camera</Text>
      </View>

      <Button title="Scan QR Code" onPress={handleOpenCamera} style={styles.scanButton} />
      <InfoCard title="After scanning, you'll see:" items={scannerFeatures} />

      <Modal visible={showCamera} animationType="slide" presentationStyle="fullScreen">
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          >
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
