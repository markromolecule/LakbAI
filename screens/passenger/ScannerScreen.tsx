import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/common/Button';
import { InfoCard } from '../../components/common/InfoCard';
import { COLORS, SPACING } from '../../shared/styles';
import { globalStyles } from '../../shared/styles/globalStyles';

export const ScannerScreen: React.FC = () => {
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
        onPress={handleSimulateQRScan}
        style={styles.scanButton}
      />

      <InfoCard
        title="After scanning, you'll see:"
        items={scannerFeatures}
      />
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
    marginBottom: SPACING.xl,
  },
});