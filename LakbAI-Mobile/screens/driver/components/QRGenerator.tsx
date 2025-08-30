import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { COLORS, SPACING } from '../../../shared/styles';
import { generateDriverPickupQR } from '../../../shared/utils/qrTestUtils';

interface QRGeneratorProps {
  driverInfo: {
    id: string;
    name: string;
    jeepneyNumber: string;
    route: string;
    currentLocation: string;
  };
}

export const QRGenerator: React.FC<QRGeneratorProps> = ({ driverInfo }) => {
  const [qrValue, setQrValue] = useState<string>('');
  const [qrSize, setQrSize] = useState<number>(200);

  useEffect(() => {
    // Generate QR code when component mounts or driver info changes
    generateQRCode();
    
    // Set QR size based on screen width
    const screenWidth = Dimensions.get('window').width;
    const maxQRSize = screenWidth - (SPACING.lg * 4);
    setQrSize(Math.min(250, maxQRSize));
  }, [driverInfo]);

  const generateQRCode = () => {
    const qrData = generateDriverPickupQR(
      driverInfo.id,
      driverInfo.jeepneyNumber,
      driverInfo.route
    );
    setQrValue(qrData);
    console.log('Generated Driver QR Code:', qrData);
  };

  const handleShareQR = async () => {
    try {
      await Share.share({
        message: `Scan this QR code to ride with me!\n\nDriver: ${driverInfo.name}\nJeepney: ${driverInfo.jeepneyNumber}\nRoute: ${driverInfo.route}\nCurrent Location: ${driverInfo.currentLocation}\n\n${qrValue}`,
        title: 'LakbAI Driver QR Code',
      });
    } catch (error) {
      console.error('Error sharing QR code:', error);
      Alert.alert('Error', 'Failed to share QR code');
    }
  };

  const handleRefreshQR = () => {
    generateQRCode();
    Alert.alert('QR Code Updated', 'Your QR code has been refreshed with current information.');
  };

  const copyQRData = () => {
    // In a real app, this would copy to clipboard
    Alert.alert(
      'QR Code Data',
      qrValue,
      [
        { text: 'OK', style: 'default' }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="qr-code" size={24} color={COLORS.driverPrimary} />
        <Text style={styles.title}>Your Passenger QR Code</Text>
      </View>

      <Text style={styles.subtitle}>
        Passengers can scan this code to book a ride with you
      </Text>

      {/* QR Code Display */}
      <View style={styles.qrContainer}>
        {qrValue ? (
          <QRCode
            value={qrValue}
            size={qrSize}
            color={COLORS.black}
            backgroundColor={COLORS.white}
            logoSize={qrSize * 0.15}
            logoBackgroundColor={COLORS.white}
            logoMargin={2}
            logoBorderRadius={8}
          />
        ) : (
          <View style={[styles.qrPlaceholder, { width: qrSize, height: qrSize }]}>
            <Ionicons name="qr-code" size={qrSize * 0.3} color={COLORS.gray400} />
            <Text style={styles.placeholderText}>Generating QR Code...</Text>
          </View>
        )}
      </View>

      {/* Driver Info Display */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="person" size={16} color={COLORS.driverPrimary} />
          <Text style={styles.infoText}>{driverInfo.name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="bus" size={16} color={COLORS.driverPrimary} />
          <Text style={styles.infoText}>{driverInfo.jeepneyNumber}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="map" size={16} color={COLORS.driverPrimary} />
          <Text style={styles.infoText}>{driverInfo.route}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location" size={16} color={COLORS.driverPrimary} />
          <Text style={styles.infoText}>Currently at: {driverInfo.currentLocation}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleRefreshQR}>
          <Ionicons name="refresh" size={20} color={COLORS.white} />
          <Text style={styles.buttonText}>Refresh</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleShareQR}>
          <Ionicons name="share" size={20} color={COLORS.white} />
          <Text style={styles.buttonText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={copyQRData}>
          <Ionicons name="copy" size={20} color={COLORS.driverPrimary} />
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>View Data</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>How passengers use this QR code:</Text>
        <Text style={styles.instructionText}>1. Open LakbAI passenger app</Text>
        <Text style={styles.instructionText}>2. Go to Scanner screen</Text>
        <Text style={styles.instructionText}>3. Scan your QR code</Text>
        <Text style={styles.instructionText}>4. Select pickup and destination</Text>
        <Text style={styles.instructionText}>5. Pay fare through Xendit</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray800,
    marginLeft: SPACING.sm,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray600,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
    backgroundColor: COLORS.gray50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  qrPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: 12,
  },
  placeholderText: {
    fontSize: 14,
    color: COLORS.gray500,
    marginTop: SPACING.sm,
  },
  qrGeneratedText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.driverPrimary,
    marginTop: SPACING.sm,
  },
  qrSubtext: {
    fontSize: 12,
    color: COLORS.gray600,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: COLORS.gray50,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.gray700,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.driverPrimary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    gap: SPACING.xs,
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.driverPrimary,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  secondaryButtonText: {
    color: COLORS.driverPrimary,
  },
  instructionsCard: {
    backgroundColor: COLORS.driverPrimaryLight,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.driverPrimary + '20',
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray800,
    marginBottom: SPACING.sm,
  },
  instructionText: {
    fontSize: 13,
    color: COLORS.gray700,
    marginBottom: 4,
  },
});
