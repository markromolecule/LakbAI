import React, { useState, useRef } from 'react';
import { ScrollView, View, TouchableOpacity, Text, Modal, Alert, ActivityIndicator } from 'react-native';
import { QrCode, Camera, MapPin, AlertCircle, Scan } from 'lucide-react-native';
import { CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useCameraPermissions } from '../../../shared/helpers/useCameraPermission';
import { notificationService, DriverLocationNotification, ConflictResolutionData } from '../../../shared/services/notificationService';
import { TEST_ADMIN_QR_CODES, logTestAdminQRCodes } from '../../../shared/utils/adminQRUtils';
import { COLORS, SPACING } from '../../../shared/styles';
import { driverStyles, scannerStyles, homeStyles } from '../styles';

interface ScannerViewProps {
  driverLocation: string;
  lastScanTime: string;
  onSimulateScan: () => void;
  onLocationUpdate: (location: string) => void;
  driverInfo: {
    id: string;
    name: string;
    jeepneyNumber: string;
    route: string;
  };
}

interface AdminQRData {
  type: 'admin_location';
  locationId: string;
  locationName: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  driverLocation,
  lastScanTime,
  onSimulateScan,
  onLocationUpdate,
  driverInfo
}) => {
  const hasPermission = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const isHandlingScanRef = useRef(false);

  const handleOpenCamera = () => {
    if (hasPermission === null) {
      Alert.alert('Permission Loading', 'Camera permission is being requested...');
      return;
    }
    if (hasPermission === false) {
      Alert.alert(
        'No Camera Access',
        'Camera permission is required to scan QR codes. Please enable camera access in your device settings.'
      );
      return;
    }
    // Reset scan guards when opening the camera
    isHandlingScanRef.current = false;
    setShowCamera(true);
    setScanned(false);
  };

  const parseAdminQRData = (data: string): AdminQRData | null => {
    try {
      const parsed = JSON.parse(data);
      if (parsed?.type === 'admin_location') {
        return parsed as AdminQRData;
      }
      return null;
    } catch {
      return null;
    }
  };

  const notifyPassengers = async (locationName: string, coordinates?: { latitude: number; longitude: number }) => {
    const notificationPayload: DriverLocationNotification = {
      type: 'driver_location_update',
      driverId: driverInfo.id,
      driverName: driverInfo.name,
      jeepneyNumber: driverInfo.jeepneyNumber,
      route: driverInfo.route,
      location: locationName,
      timestamp: new Date().toISOString(),
      coordinates
    };
    
    const result = await notificationService.notifyPassengerDriverLocation(notificationPayload);
    
    if (result.success) {
      console.log(`✅ Successfully notified ${result.notificationsSent} passengers`);
    } else {
      console.error('❌ Failed to notify passengers:', result.error);
    }
    
    return result;
  };

  const handleAdminQRScan = async (qrData: AdminQRData) => {
    setProcessing(true);
    
    try {
      // Check for conflicts with other drivers at this location
      const conflictCheck = await checkLocationConflicts(qrData.locationName);
      
      if (conflictCheck.hasConflict) {
        // Handle conflict scenario
        const conflictResolution = await handleLocationConflict(qrData.locationName, conflictCheck.otherDrivers);
        
        Alert.alert(
          '⚠️ Multiple Drivers Detected',
          `Other drivers are also at ${qrData.locationName}. Passengers will be shown all available options.\n\nDrivers at location: ${conflictCheck.otherDrivers.length + 1}`,
          [
            {
              text: 'Continue Anyway',
              onPress: async () => {
                await finalizeLocationUpdate(qrData);
              }
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setProcessing(false)
            }
          ]
        );
      } else {
        // No conflict, proceed normally
        await finalizeLocationUpdate(qrData);
      }
      
    } catch (error) {
      console.error('Error processing location scan:', error);
      Alert.alert('Error', 'Failed to update location. Please try again.');
      setProcessing(false);
    }
  };

  const finalizeLocationUpdate = async (qrData: AdminQRData) => {
    try {
      // Update driver location
      onLocationUpdate(qrData.locationName);
      
      // Send notifications to passengers
      const notificationResult = await notifyPassengers(qrData.locationName, qrData.coordinates);
      
      const successMessage = notificationResult.success
        ? `\n\n✅ ${notificationResult.notificationsSent} passengers have been notified!`
        : `\n\n⚠️ Notification failed: ${notificationResult.error}`;
      
      Alert.alert(
        'Location Updated! 📍',
        `You are now at: ${qrData.locationName}${successMessage}`,
        [{ text: 'OK' }]
      );
      
    } finally {
      setProcessing(false);
    }
  };

  const checkLocationConflicts = async (locationName: string) => {
    // Mock function to simulate checking for other drivers at the same location
    // In real implementation, this would query the backend for active drivers
    const mockOtherDrivers = [
      {
        id: 'driver_002',
        name: 'Maria Santos',
        jeepneyNumber: 'LKB-002',
        route: 'Ayala - Lahug',
        distance: 50, // meters away
        estimatedArrival: 'Just arrived'
      }
    ];

    // Simulate random conflict (30% chance for demo)
    const hasConflict = Math.random() < 0.3;

    return {
      hasConflict,
      otherDrivers: hasConflict ? mockOtherDrivers : []
    };
  };

  const handleLocationConflict = async (locationName: string, otherDrivers: any[]) => {
    const conflictData: ConflictResolutionData = {
      location: locationName,
      drivers: [
        ...otherDrivers,
        {
          id: driverInfo.id,
          name: driverInfo.name,
          jeepneyNumber: driverInfo.jeepneyNumber,
          route: driverInfo.route,
          distance: 0, // Current driver is at the exact location
          estimatedArrival: 'Now'
        }
      ]
    };

    const result = await notificationService.handleLocationConflict(conflictData);
    console.log('Conflict resolution result:', result);
    
    return result;
  };

  const handleBarcodeScanned = async ({ data }: { type: string; data: string }) => {
    if (isHandlingScanRef.current || scanned) return;
    isHandlingScanRef.current = true;

    const adminQrData = parseAdminQRData(data);

    if (adminQrData) {
      setScanned(true);
      setShowCamera(false);
      
      await handleAdminQRScan(adminQrData);
      
      // Reset for next scan
      setTimeout(() => {
        setScanned(false);
        isHandlingScanRef.current = false;
      }, 2000);
    } else {
      // Not a valid admin QR code; keep scanning
      isHandlingScanRef.current = false;
      Alert.alert(
        'Invalid QR Code',
        'This QR code is not a valid location checkpoint. Please scan an admin-generated location QR code.',
        [{ text: 'OK' }]
      );
    }
  };

  // Test function to simulate admin QR scan with multiple options
  const testAdminQRScan = () => {
    const locations = [
      { name: 'Robinson Galleria', qr: TEST_ADMIN_QR_CODES.ROBINSON_GALLERIA },
      { name: 'Ayala Center', qr: TEST_ADMIN_QR_CODES.AYALA_CENTER },
      { name: 'SM City Cebu', qr: TEST_ADMIN_QR_CODES.SM_CITY_CEBU },
      { name: 'IT Park', qr: TEST_ADMIN_QR_CODES.IT_PARK }
    ];

    const buttons = locations.map(location => ({
      text: location.name,
      onPress: () => {
        const qrData = parseAdminQRData(location.qr);
        if (qrData) {
          handleAdminQRScan(qrData);
        }
      }
    }));

    Alert.alert(
      '🧪 Test Admin QR Scan',
      'Choose a location to simulate scanning:',
      [
        ...buttons,
        { text: 'Show All QR Codes', onPress: () => logTestAdminQRCodes() },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <ScrollView 
      style={driverStyles.container} 
      contentContainerStyle={driverStyles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={scannerStyles.scannerHeader}>
        <QrCode size={96} color="#22C55E" />
        <Text style={scannerStyles.scannerTitle}>Location Scanner</Text>
        <Text style={scannerStyles.scannerSubtitle}>Scan admin QR codes to update your location and notify passengers</Text>
      </View>

      <View style={scannerStyles.cameraViewfinder}>
        <Camera size={64} color="#9CA3AF" />
        <Text style={scannerStyles.viewfinderText}>Camera ready</Text>
        <Text style={scannerStyles.viewfinderSubtext}>Tap to scan admin location QR</Text>
      </View>

      <TouchableOpacity 
        onPress={handleOpenCamera}
        style={[scannerStyles.scanButton, { backgroundColor: COLORS.driverPrimary }]}
      >
        <Scan size={20} color="white" style={{ marginRight: 8 }} />
        <Text style={scannerStyles.scanButtonText}>Scan Location QR</Text>
      </TouchableOpacity>

      {/* Test button for development */}
      <TouchableOpacity 
        onPress={testAdminQRScan}
        style={[scannerStyles.scanButton, { backgroundColor: COLORS.gray600, marginTop: 8 }]}
      >
        <Text style={[scannerStyles.scanButtonText, { fontSize: 14 }]}>🧪 Test Admin QR Scan</Text>
      </TouchableOpacity>

      {processing && (
        <View style={{ alignItems: 'center', marginVertical: SPACING.md }}>
          <ActivityIndicator size="large" color={COLORS.driverPrimary} />
          <Text style={{ marginTop: SPACING.sm, color: COLORS.gray600 }}>
            Updating location and notifying passengers...
          </Text>
        </View>
      )}

      <View style={scannerStyles.locationCard}>
        <View style={homeStyles.sectionHeader}>
          <MapPin size={20} color="#22C55E" />
          <Text style={[homeStyles.sectionTitle, { color: '#15803D' }]}>Current Location</Text>
        </View>
        <View>
          <Text style={scannerStyles.currentLocation}>{driverLocation}</Text>
          <Text style={scannerStyles.lastUpdated}>Last updated: {lastScanTime}</Text>
          <Text style={scannerStyles.locationNote}>Passengers can now see your current location</Text>
        </View>
      </View>

      <View style={scannerStyles.instructionsCard}>
        <Text style={scannerStyles.instructionsTitle}>How Location Scanning Works:</Text>
        <Text style={scannerStyles.instructionItem}>• Scan admin QR codes at designated stops</Text>
        <Text style={scannerStyles.instructionItem}>• Your location updates automatically</Text>
        <Text style={scannerStyles.instructionItem}>• Passengers get notified when you arrive</Text>
        <Text style={scannerStyles.instructionItem}>• Keep passengers informed of your route progress</Text>
      </View>

      <View style={scannerStyles.warningCard}>
        <View style={scannerStyles.warningHeader}>
          <AlertCircle size={20} color="#D97706" />
          <Text style={scannerStyles.warningTitle}>Important:</Text>
        </View>
        <Text style={scannerStyles.warningText}>
          When you scan a location QR, all passengers waiting in that area will be notified that your jeepney has arrived.
        </Text>
      </View>

      {/* Camera Modal */}
      <Modal visible={showCamera} animationType="slide" presentationStyle="fullScreen">
        <View style={{ flex: 1, backgroundColor: 'black' }}>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          />
          
          {/* Camera Overlay */}
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {/* Scan Frame */}
            <View style={{
              width: 250,
              height: 250,
              borderWidth: 2,
              borderColor: COLORS.driverPrimary,
              borderRadius: 12,
              backgroundColor: 'transparent'
            }} />
            
            {/* Instructions */}
            <Text style={{
              position: 'absolute',
              bottom: 150,
              color: 'white',
              fontSize: 16,
              textAlign: 'center',
              paddingHorizontal: 20
            }}>
              Position the admin location QR code within the frame
            </Text>
            
            {/* Close Button */}
            <TouchableOpacity
              onPress={() => setShowCamera(false)}
              style={{
                position: 'absolute',
                top: 50,
                right: 20,
                backgroundColor: 'rgba(0,0,0,0.6)',
                borderRadius: 20,
                padding: 10,
                flexDirection: 'row',
                alignItems: 'center'
              }}
            >
              <Ionicons name="close" size={24} color="white" />
              <Text style={{ color: 'white', marginLeft: 5 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};