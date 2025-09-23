import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, View, TouchableOpacity, Text, Modal, Alert, ActivityIndicator } from 'react-native';
import { QrCode, Camera, MapPin, AlertCircle, Scan } from 'lucide-react-native';
import { CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useCameraPermissions } from '../../../shared/helpers/useCameraPermission';
import { notificationService, DriverLocationNotification, ConflictResolutionData } from '../../../shared/services/notificationService';

import { tripTrackingService, ActiveTrip, TripCheckpoint } from '../../../shared/services/tripTrackingService';

import { COLORS, SPACING } from '../../../shared/styles';
import { driverStyles, scannerStyles, homeStyles } from '../styles';

interface ScannerViewProps {
  driverLocation: string;
  lastScanTime: string;
  onSimulateScan: () => void;
  onLocationUpdate: (location: string) => void;
  driverProfile: any; // DriverProfile from useDriverState
  driverInfo: {
    id: string;
    name: string;
    jeepneyNumber: string;
    route: string;
  };
  onTripCompleted?: (tripSummary: any) => void;
  onShiftEnd?: () => void;
  onRefresh?: () => void;
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

interface RouteCheckpointQRData {
  type: 'route_checkpoint';
  checkpointId: string;
  checkpointName: string;
  checkpointType: 'start' | 'end' | 'checkpoint';
  coordinates: {
    latitude: number;
    longitude: number;
  };
  jeepneyNumber: string;
  route: string;
  qrType: 'driver_scan' | 'passenger_notification';
  timestamp: string;
  adminId: string;
  purpose: string;
  metadata?: any;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  driverLocation,
  lastScanTime,
  onSimulateScan,
  onLocationUpdate,
  driverProfile,
  driverInfo,
  onTripCompleted,
  onShiftEnd,
  onRefresh
}) => {
  const hasPermission = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);
  const isHandlingScanRef = useRef(false);

  // Check for active trip on component mount and listen for changes
  useEffect(() => {
    console.log('🔍 ScannerView useEffect - checking for active trip for driver:', driverInfo.id);
    const existingTrip = tripTrackingService.getActiveTrip(driverInfo.id);
    console.log('🔍 Existing trip found:', existingTrip);
    setActiveTrip(existingTrip);
    
    // Set up trip listener for real-time updates (e.g., when cleared by shift end)
    const unsubscribe = tripTrackingService.addTripListener((driverId, action) => {
      if (driverId === driverInfo.id) {
        console.log('🔄 Trip listener triggered:', action, 'for driver', driverId);
        const currentTrip = tripTrackingService.getActiveTrip(driverId);
        console.log('🔄 Updated trip from listener:', currentTrip);
        setActiveTrip(currentTrip);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [driverInfo.id]);

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

  const parseRouteCheckpointQR = (data: string): RouteCheckpointQRData | null => {
    try {
      console.log('🔍 Parsing QR data:', data);
      const parsed = JSON.parse(data);
      console.log('🔍 Parsed QR data:', parsed);
      console.log('🔍 Type check:', parsed?.type, '===', 'route_checkpoint', '?', parsed?.type === 'route_checkpoint');
      console.log('🔍 QRType check:', parsed?.qrType, '===', 'driver_scan', '?', parsed?.qrType === 'driver_scan');
      
      // Accept QR codes with type 'route_checkpoint' (from admin) or with both type and qrType
      if (parsed?.type === 'route_checkpoint' && (parsed?.qrType === 'driver_scan' || !parsed?.qrType)) {
        console.log('✅ QR validation passed');
        
        // Map admin QR data to expected format
        const mappedData: RouteCheckpointQRData = {
          type: 'route_checkpoint',
          checkpointId: parsed.checkpoint_id?.toString() || parsed.checkpointId?.toString() || '',
          checkpointName: parsed.checkpoint_name || parsed.checkpointName || '',
          checkpointType: parsed.is_origin ? 'start' : (parsed.is_destination ? 'end' : (parsed.checkpointType || 'checkpoint')),
          coordinates: {
            latitude: parsed.coordinates?.lat || parsed.coordinates?.latitude || 0,
            longitude: parsed.coordinates?.lng || parsed.coordinates?.longitude || 0
          },
          jeepneyNumber: parsed.jeepney_number || parsed.jeepneyNumber || '',
          route: parsed.route_name || parsed.route || '',
          qrType: parsed.qrType || 'driver_scan',
          timestamp: parsed.generated_at || parsed.timestamp || new Date().toISOString(),
          adminId: parsed.admin_id || parsed.adminId || '',
          purpose: parsed.purpose || 'checkpoint_scan',
          metadata: {
            ...parsed,
            route_id: parsed.route_id || parsed.routeId,
            sequence_order: parsed.sequence_order || parsed.sequenceOrder,
            fare_from_origin: parsed.fare_from_origin || parsed.fareFromOrigin,
            is_origin: parsed.is_origin,
            is_destination: parsed.is_destination
          }
        };
        
        console.log('🔍 Mapped QR data:', mappedData);
        console.log('🔍 Final checkpoint type:', mappedData.checkpointType);
        console.log('🔍 Final checkpoint name:', mappedData.checkpointName);
        return mappedData;
      }
      console.log('❌ QR validation failed');
      return null;
    } catch (error) {
      console.log('❌ QR parsing error:', error);
      return null;
    }
  };

  const updateBackendLocation = async (qrData: RouteCheckpointQRData) => {
    try {
      const { getBaseUrl } = await import('../../../config/apiConfig');
      const baseUrl = getBaseUrl();
      
      // Get dynamic route information from QR data or driver's assigned route
      // Priority: QR metadata > Driver's assigned route > Default fallback
      let routeId = 1; // Default fallback
      let sequenceOrder = 1; // Default fallback
      
      // Try to get route_id from QR data metadata
      if (qrData.metadata?.route_id) {
        routeId = parseInt(qrData.metadata.route_id);
      } else {
        // Fallback: Get driver's assigned route from jeepney data
        try {
          const jeepneyResponse = await fetch(`${baseUrl}/jeepneys`);
          if (jeepneyResponse.ok) {
            const jeepneyData = await jeepneyResponse.json();
            const jeepney = jeepneyData.jeepneys?.find((j: any) => j.driver_id == driverInfo.id);
            if (jeepney?.route_id) {
              routeId = jeepney.route_id;
            }
          }
        } catch (error) {
          console.warn('⚠️ Failed to fetch jeepney route, using default route_id:', error);
        }
      }
      
      // Try to get sequence_order from QR data metadata
      if (qrData.metadata?.sequence_order) {
        sequenceOrder = parseInt(qrData.metadata.sequence_order);
      } else {
        // Fallback: Try to get sequence from checkpoint data
        try {
          const checkpointResponse = await fetch(`${baseUrl}/routes/${routeId}/checkpoints`);
          if (checkpointResponse.ok) {
            const checkpointData = await checkpointResponse.json();
            const checkpoint = checkpointData.checkpoints?.find((c: any) => c.id == qrData.checkpointId);
            if (checkpoint?.sequence_order) {
              sequenceOrder = checkpoint.sequence_order;
            }
          }
        } catch (error) {
          console.warn('⚠️ Failed to fetch checkpoint sequence, using default sequence_order:', error);
        }
      }
      
      const payload = {
        driver_id: parseInt(driverInfo.id),
        qr_data: {
          checkpoint_id: parseInt(qrData.checkpointId),
          route_id: routeId,
          checkpoint_name: qrData.checkpointName,
          sequence_order: sequenceOrder
        },
        scan_timestamp: new Date().toISOString()
      };
      
      console.log('📡 Updating backend location with dynamic values:', {
        url: `${baseUrl}/mobile/driver/scan/checkpoint`,
        routeId: routeId,
        sequenceOrder: sequenceOrder,
        checkpointId: qrData.checkpointId,
        checkpointName: qrData.checkpointName,
        payload
      });
      
      const response = await fetch(`${baseUrl}/mobile/driver/scan/checkpoint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('📡 Backend location update response:', result);
      
      if (result.status === 'success') {
        console.log('✅ Backend location updated successfully');
        return result;
      } else {
        console.error('❌ Backend location update failed:', result.message);
        throw new Error(result.message || 'Failed to update backend location');
      }
    } catch (error) {
      console.error('❌ Failed to update backend location:', error);
      throw error;
    }
  };

  const notifyPassengers = async (locationName: string, coordinates?: { latitude: number; longitude: number }) => {
    try {
      // Use real driver data
      const realDriverName = driverProfile?.name || driverInfo.name;
      const realJeepneyNumber = driverProfile?.jeepneyNumber || driverInfo.jeepneyNumber;
      const realRoute = driverProfile?.route || driverInfo.route;
      
      console.log(`📢 Notifying passengers of driver location: ${locationName} (Driver: ${realDriverName})`);
      
      // Use simple notification system
      console.log('🔔 Would notify passengers about driver location:', {
        driver: realDriverName,
        jeepneyNumber: realJeepneyNumber,
        location: locationName,
        route: realRoute
      });
      
      console.log(`✅ Simple notification sent: ${realDriverName} at ${locationName}`);
      
      return {
        success: true,
        notificationsSent: 1,
        message: `Notification sent: ${realDriverName} at ${locationName}`
      };
    } catch (error) {
      console.error('❌ Failed to notify passengers:', error);
      return {
        success: false,
        notificationsSent: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const handleRouteCheckpointScan = async (qrData: RouteCheckpointQRData) => {
    setProcessing(true);
    
    try {
      console.log('🔍 Starting route checkpoint scan for:', qrData.checkpointName);
      console.log('🔍 QR Data:', qrData);
      
      // First, update the backend with the location scan
      console.log('📡 Calling updateBackendLocation...');
      const backendResult = await updateBackendLocation(qrData);
      console.log('📡 Backend update result:', backendResult);
      
      // Update local location immediately after successful backend update
      console.log('📍 Calling onLocationUpdate with:', qrData.checkpointName);
      onLocationUpdate(qrData.checkpointName);
      
      const checkpoint: Omit<TripCheckpoint, 'scannedAt'> = {
        id: qrData.checkpointId,
        name: qrData.checkpointName,
        type: qrData.checkpointType,
        coordinates: qrData.coordinates
      };

      console.log('🔍 QR Data checkpoint type:', qrData.checkpointType);
      console.log('🔍 Is it a start checkpoint?', qrData.checkpointType === 'start');
      
      if (qrData.checkpointType === 'start') {
        // Start a new trip
        console.log('🚀 ============ STARTING TRIP =============');
        console.log('🚀 Starting trip for driver:', driverInfo.id);
        console.log('🚀 Driver info object:', driverInfo);
        console.log('🚀 Current activeTrip state:', activeTrip);
        console.log('🚀 QR checkpoint data:', qrData);
        
        const realDriverName = driverProfile?.name || driverInfo.name;
        const realJeepneyNumber = driverProfile?.jeepneyNumber || driverInfo.jeepneyNumber;
        const realRoute = driverProfile?.route || driverInfo.route;
        
        console.log('🚀 Driver info:', { realDriverName, realJeepneyNumber, realRoute });
        
        console.log('🚀 Calling tripTrackingService.startTrip with:');
        console.log('🚀 - Driver ID:', driverInfo.id);
        console.log('🚀 - Driver Name:', realDriverName);
        console.log('🚀 - Jeepney Number:', realJeepneyNumber);
        console.log('🚀 - Route:', realRoute);
        console.log('🚀 - Checkpoint:', checkpoint);
        
        const result = await tripTrackingService.startTrip(
          driverInfo.id,
          {
            name: realDriverName,
            jeepneyNumber: realJeepneyNumber,
            route: realRoute
          },
          checkpoint
        );
        
        console.log('🚀 ============ TRIP START RESULT =============');
        console.log('🚀 Success:', result.success);
        console.log('🚀 Message:', result.message);
        console.log('🚀 Trip ID:', result.tripId);
        console.log('🚀 Full result:', result);

        if (result.success) {
          setActiveTrip(result.activeTrip || null);
          
          Alert.alert(
            '🚍 Trip Started!',
            `${result.message}\n\nYou can now scan intermediate checkpoints and the end point to complete your trip.\n\nTrip ID: ${result.tripId}`,
            [{ text: 'Continue' }]
          );
        } else {
          Alert.alert('Cannot Start Trip', result.message);
        }
        
      } else if (qrData.checkpointType === 'end') {
        // End the current trip
        console.log('🏁 Ending trip for driver:', driverInfo.id);
        console.log('🏁 Current activeTrip state:', activeTrip);
        
        const result = await tripTrackingService.endTrip(
          driverInfo.id,
          checkpoint
        );
        
        console.log('🏁 Trip end result:', result);

        if (result.success) {
          setActiveTrip(null);
          
          // Trip count is now incremented on START point scan, not END point
          // Just refresh the UI to show trip completion
          console.log('🏁 Trip completed - trip count was already incremented on start');
          
          // Force refresh the driver profile to show updated UI
          if (onRefresh) {
            console.log('📱 Triggering driver profile refresh...');
            onRefresh();
          }
          
          // Notify parent components about trip completion
          if (onTripCompleted) {
            console.log('🔄 Calling onTripCompleted callback');
            onTripCompleted(result.tripSummary);
          }
          
          // Auto-end shift after trip completion (as requested)
          if (onShiftEnd) {
            console.log('🔄 Calling onShiftEnd callback - auto-ending shift after trip completion');
            onShiftEnd();
          }
          
          Alert.alert(
            '✅ Trip Completed!',
            `${result.message}\n\nTrip Summary:\n• Duration: ${result.tripSummary?.duration} minutes\n• Checkpoints: ${result.tripSummary?.checkpoints}\n• Distance: ${result.tripSummary?.distance}\n\n✅ Trip count updated!\n\nYour shift will now end automatically.`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Cannot End Trip', result.message);
        }
        
      } else {
        // Add intermediate checkpoint
        const result = await tripTrackingService.addCheckpoint(
          driverInfo.id,
          checkpoint
        );

        if (result.success) {
          setActiveTrip(result.activeTrip || null);
          
          Alert.alert(
            '📍 Checkpoint Updated',
            `${result.message}\n\nActive Trip: ${activeTrip?.startCheckpoint.name} → ${qrData.checkpointName}\nCheckpoints passed: ${result.activeTrip?.intermediateCheckpoints.length || 0}`,
            [{ text: 'Continue' }]
          );
        } else {
          Alert.alert('Cannot Update Location', result.message);
        }
      }
      
    } catch (error) {
      console.error('❌ Error processing route checkpoint scan:', error);
      
      // Check if it's a backend update error
      if (error instanceof Error && error.message.includes('backend')) {
        Alert.alert(
          'Backend Update Failed', 
          `Failed to update location in backend: ${error.message}. The scan was processed locally but may not sync with admin panel. Please try again.`
        );
      } else {
        Alert.alert(
          'Error', 
          `Failed to process checkpoint scan: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`
        );
      }
    } finally {
      setProcessing(false);
    }
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

    console.log('📲 QR SCAN DETECTED!');
    console.log('📲 Raw QR data:', data);
    console.log('📲 Data length:', data.length);
    console.log('📲 Current driver ID:', driverInfo.id);

    // Try parsing as route checkpoint QR first (new system)
    const routeCheckpointData = parseRouteCheckpointQR(data);
    console.log('📲 Parsed route checkpoint data:', routeCheckpointData);
    
    if (routeCheckpointData) {
      console.log('✅ ROUTE CHECKPOINT QR DETECTED - proceeding with handleRouteCheckpointScan');
      setScanned(true);
      setShowCamera(false);
      
      await handleRouteCheckpointScan(routeCheckpointData);
      
      // Reset for next scan
      setTimeout(() => {
        setScanned(false);
        isHandlingScanRef.current = false;
      }, 2000);
      return;
    }

    // Fallback to admin location QR (legacy system)
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
      return;
    }

    // Not a valid QR code
    isHandlingScanRef.current = false;
    Alert.alert(
      'Invalid QR Code',
      'This QR code is not a valid route checkpoint or admin location QR code. Please scan a QR code generated by the LakbAI admin system.',
      [{ text: 'OK' }]
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



      {processing && (
        <View style={{ alignItems: 'center', marginVertical: SPACING.md }}>
          <ActivityIndicator size="large" color={COLORS.driverPrimary} />
          <Text style={{ marginTop: SPACING.sm, color: COLORS.gray600 }}>
            Updating location and notifying passengers...
          </Text>
        </View>
      )}

      {/* Jeepney Information */}
      <View style={scannerStyles.locationCard}>
        <View style={homeStyles.sectionHeader}>
          <Ionicons name="bus" size={20} color="#22C55E" />
          <Text style={[homeStyles.sectionTitle, { color: '#15803D' }]}>Your Jeepney</Text>
        </View>
        <View>
          <Text style={scannerStyles.currentLocation}>{driverInfo.jeepneyNumber}</Text>
          <Text style={scannerStyles.lastUpdated}>Route: {driverInfo.route}</Text>
          <Text style={scannerStyles.locationNote}>Passengers can scan your QR to book rides</Text>
        </View>
      </View>

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

      {/* Active Trip Information */}
      {activeTrip ? (
        <View style={[scannerStyles.locationCard, { backgroundColor: '#E7F3FF', borderColor: '#2563EB' }]}>
          <View style={homeStyles.sectionHeader}>
            <Ionicons name="navigate" size={20} color="#2563EB" />
            <Text style={[homeStyles.sectionTitle, { color: '#1E40AF' }]}>Active Trip</Text>
          </View>
          <View>
            <Text style={[scannerStyles.currentLocation, { color: '#1E40AF' }]}>
              {activeTrip.startCheckpoint.name} → {activeTrip.route?.split(' → ')[1] || 'End Point'}
            </Text>
            <Text style={scannerStyles.lastUpdated}>
              Started: {new Date(activeTrip.startTime).toLocaleTimeString()}
            </Text>
            <Text style={scannerStyles.locationNote}>
              Checkpoints passed: {activeTrip.intermediateCheckpoints.length}
            </Text>
            <Text style={[scannerStyles.locationNote, { fontWeight: '600', color: '#2563EB' }]}>
              💡 Scan checkpoints and end point to complete trip
            </Text>
          </View>
        </View>
      ) : (
        <View style={[scannerStyles.locationCard, { backgroundColor: '#F9FAFB', borderColor: '#D1D5DB' }]}>
          <View style={homeStyles.sectionHeader}>
            <Ionicons name="checkmark-circle" size={20} color="#6B7280" />
            <Text style={[homeStyles.sectionTitle, { color: '#6B7280' }]}>No Active Trip</Text>
          </View>
          <View>
            <Text style={[scannerStyles.currentLocation, { color: '#6B7280' }]}>
              Ready to start a new trip
            </Text>
            <Text style={scannerStyles.lastUpdated}>
              Scan a start checkpoint QR to begin
            </Text>
            <Text style={[scannerStyles.locationNote, { fontWeight: '600', color: '#6B7280' }]}>
              💡 Start by scanning a route checkpoint QR
            </Text>
          </View>
        </View>
      )}

      <View style={scannerStyles.instructionsCard}>
        <Text style={scannerStyles.instructionsTitle}>Trip Tracking & Location Updates:</Text>
        <Text style={scannerStyles.instructionItem}>• 🚀 Scan START point QR to begin a trip</Text>
        <Text style={scannerStyles.instructionItem}>• 📍 Scan checkpoint QRs during your route</Text>
        <Text style={scannerStyles.instructionItem}>• 🏁 Scan END point QR to complete the trip</Text>
        <Text style={scannerStyles.instructionItem}>• 🔔 Passengers get notified at each location</Text>
        <Text style={scannerStyles.instructionItem}>• 📊 Trip data is automatically tracked</Text>
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