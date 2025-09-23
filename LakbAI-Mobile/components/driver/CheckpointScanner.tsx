import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, Modal, ActivityIndicator } from 'react-native';
import { CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useCameraPermissions } from '../../shared/helpers/useCameraPermission';
import { COLORS, SPACING } from '../../shared/styles';
import { getBaseUrl } from '../../config/apiConfig';
import { tripTrackingService, TripCheckpoint } from '../../shared/services/tripTrackingService';

interface CheckpointQRData {
  type: 'route_checkpoint';
  checkpoint_id: number;
  checkpoint_name: string;
  route_id: number;
  route_name: string;
  sequence_order: number;
  fare_from_origin: number;
  is_origin: boolean;
  is_destination: boolean;
  generated_at: string;
  expires_at: string;
}

interface ScanResult {
  status: 'success' | 'error' | 'warning';
  message: string;
  data?: {
    driver?: {
      id: number;
      name: string;
      jeepney_number: string;
    };
    checkpoint: {
      id: number;
      name: string;
      route: string;
      sequence_order: number;
    };
    arrival_estimate: {
      next_checkpoint_eta: string;
      base_time: number;
      estimated_range: {
        min: number;
        max: number;
      };
    };
    scan_timestamp: string;
    // Additional trip-related properties
    tripId?: string;
    activeTrip?: any;
    completedTrip?: any;
    tripSummary?: any;
  };
}

interface CheckpointScannerProps {
  driverId: number;
  driverName: string;
  jeepneyNumber: string;
  onLocationUpdate: (location: string, scanTime: string) => void;
  onScanSuccess?: (result: ScanResult) => void;
  onTripCompleted?: (tripSummary: any) => void;
  onShiftEnd?: () => void;
}

export const CheckpointScanner: React.FC<CheckpointScannerProps> = ({
  driverId,
  driverName,
  jeepneyNumber,
  onLocationUpdate,
  onScanSuccess,
  onTripCompleted,
  onShiftEnd
}) => {
  console.log('🚗 CheckpointScanner initialized with:', {
    driverId,
    driverName,
    jeepneyNumber
  });
  const hasPermission = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const isHandlingScanRef = useRef(false);

  const handleOpenCamera = () => {
    if (hasPermission === null) {
      Alert.alert('Permission Loading', 'Camera permission is being requested...');
      return;
    }
    if (hasPermission === false) {
      Alert.alert(
        'No Camera Access',
        'Camera permission is required to scan checkpoint QR codes. Please enable camera access in your device settings.'
      );
      return;
    }
    
    // Reset scan state when opening camera
    isHandlingScanRef.current = false;
    setScanned(false);
    setLastScanResult(null);
    setShowCamera(true);
  };

  const parseCheckpointQR = (data: string): CheckpointQRData | null => {
    try {
      const parsed = JSON.parse(data);
      console.log('📋 Parsed JSON:', parsed);
      console.log('📋 Type check:', parsed?.type === 'route_checkpoint');
      console.log('📋 Fields check:', {
        checkpoint_id: parsed.checkpoint_id,
        route_id: parsed.route_id,
        checkpoint_name: parsed.checkpoint_name
      });
      
      if (parsed?.type === 'route_checkpoint') {
        // Validate required fields - handle both numeric and string IDs
        const hasRequiredFields = (
          (parsed.checkpoint_id !== undefined && parsed.checkpoint_id !== null) &&
          (parsed.route_id !== undefined && parsed.route_id !== null) &&
          (parsed.checkpoint_name && parsed.checkpoint_name.trim() !== '')
        );
        
        console.log('📋 Has required fields:', hasRequiredFields);
        
        if (hasRequiredFields) {
          console.log('✅ QR validation passed, returning parsed data');
          return {
            ...parsed,
            // Ensure all required fields are present with defaults if needed
            checkpoint_id: parsed.checkpoint_id || parsed.checkpointId,
            route_id: parsed.route_id || 1,
            checkpoint_name: parsed.checkpoint_name || parsed.checkpointName || 'Unknown',
            sequence_order: parsed.sequence_order || 1,
            fare_from_origin: parsed.fare_from_origin || '0.00',
            is_origin: parsed.is_origin !== undefined ? parsed.is_origin : true,
            is_destination: parsed.is_destination !== undefined ? parsed.is_destination : false,
            generated_at: parsed.generated_at || parsed.timestamp || new Date().toISOString(),
            expires_at: parsed.expires_at || new Date(Date.now() + 30*24*60*60*1000).toISOString()
          } as CheckpointQRData;
        } else {
          console.log('❌ Required fields missing');
        }
      } else {
        console.log('❌ Wrong QR type:', parsed?.type);
      }
      
      return null;
    } catch (error) {
      console.error('❌ JSON parsing error:', error);
      return null;
    }
  };

  const processCheckpointScan = async (qrData: CheckpointQRData): Promise<ScanResult> => {
    try {
      const baseUrl = getBaseUrl();
      const payload = {
        driver_id: driverId,
        qr_data: qrData,
        scan_timestamp: new Date().toISOString()
      };
      
      console.log('📡 Sending scan request:', {
        url: `${baseUrl}/mobile/driver/scan/checkpoint`,
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
      console.log('📡 API response:', result);
      
      if (result.status === 'success') {
        // Update local driver location with the actual checkpoint name from API response
        const checkpointName = result.data?.checkpoint?.name || qrData.checkpoint_name;
        onLocationUpdate(
          checkpointName, 
          result.data?.scan_timestamp || new Date().toISOString()
        );
        
        return result as ScanResult;
      } else {
        return {
          status: 'error',
          message: result.message || 'Failed to process checkpoint scan'
        };
      }
    } catch (error) {
      console.error('Checkpoint scan error:', error);
      return {
        status: 'error',
        message: 'Network error occurred while processing scan'
      };
    }
  };

  const handleTripLogic = async (qrData: CheckpointQRData): Promise<ScanResult> => {
    try {
      const driverIdStr = driverId.toString();
      const checkpoint: Omit<TripCheckpoint, 'scannedAt'> = {
        id: qrData.checkpoint_id.toString(),
        name: qrData.checkpoint_name,
        type: qrData.is_origin ? 'start' : (qrData.is_destination ? 'end' : 'checkpoint'),
        coordinates: {
          latitude: 0, // Default coordinates
          longitude: 0
        }
      };

      console.log('🚍 Processing trip logic:', {
        checkpointType: checkpoint.type,
        checkpointName: checkpoint.name,
        hasActiveTrip: !!activeTrip
      });

      // Handle different checkpoint types
      if (checkpoint.type === 'start') {
        // Clear any existing active trip before starting new one
        if (activeTrip) {
          console.log('🧹 Clearing existing active trip before starting new one');
          tripTrackingService.clearActiveTrip(driverIdStr);
          setActiveTrip(null);
        }
        
        // Start a new trip
        const tripResult = await tripTrackingService.startTrip(
          driverIdStr,
          {
            name: driverName,
            jeepneyNumber: jeepneyNumber,
            route: qrData.route_name
          },
          checkpoint
        );

        if (tripResult.success) {
          setActiveTrip(tripResult.activeTrip);
          console.log('🚍 Trip started:', tripResult.activeTrip?.id);
          
          return {
            status: 'success',
            message: `🚍 Trip started from ${checkpoint.name}`,
            data: { 
              tripId: tripResult.tripId, 
              activeTrip: tripResult.activeTrip,
              checkpoint: {
                id: parseInt(checkpoint.id),
                name: checkpoint.name,
                route: qrData.route_name,
                sequence_order: qrData.sequence_order
              },
              arrival_estimate: {
                next_checkpoint_eta: 'Unknown',
                base_time: Date.now(),
                estimated_range: { min: 5, max: 7 }
              },
              scan_timestamp: new Date().toISOString()
            }
          };
        } else {
          return {
            status: 'error',
            message: tripResult.message
          };
        }
      } else if (checkpoint.type === 'end') {
        // End the trip
        if (!activeTrip) {
          return {
            status: 'error',
            message: 'No active trip to complete. Please start a trip first.'
          };
        }

        const tripResult = await tripTrackingService.endTrip(
          driverIdStr,
          checkpoint,
          {
            passengersPickedUp: 0, // Could be collected from user input
            fareCollected: 0 // Could be collected from user input
          }
        );

        if (tripResult.success) {
          setActiveTrip(null);
          console.log('✅ Trip completed:', tripResult.completedTrip?.id);
          
          // Update earnings with trip completion
          try {
            const { earningsService } = await import('../../shared/services/earningsService');
            const earningsUpdate = await earningsService.updateDriverEarnings({
              driverId: driverIdStr,
              amount: 0, // No fare collected for this trip
              tripId: tripResult.completedTrip?.id || `trip_${Date.now()}`,
              passengerId: 'trip_completion',
              timestamp: new Date().toISOString(),
              paymentMethod: 'other',
              pickupLocation: activeTrip.startCheckpoint.name,
              destination: checkpoint.name,
              originalFare: 0,
              finalFare: 0,
              incrementTripCount: true // Only increment trip count when trip is completed
            });
            
            if (earningsUpdate.success) {
              console.log('✅ Trip count updated in earnings:', earningsUpdate.newEarnings);
            }
          } catch (error) {
            console.error('❌ Failed to update trip count:', error);
          }
          
          // Notify parent components
          if (onTripCompleted) {
            onTripCompleted(tripResult.tripSummary);
          }
          
          // End shift after trip completion
          if (onShiftEnd) {
            onShiftEnd();
          }

          return {
            status: 'success',
            message: `✅ Trip completed! ${tripResult.message}`,
            data: { 
              completedTrip: tripResult.completedTrip,
              tripSummary: tripResult.tripSummary,
              checkpoint: {
                id: parseInt(checkpoint.id),
                name: checkpoint.name,
                route: qrData.route_name,
                sequence_order: qrData.sequence_order
              },
              arrival_estimate: {
                next_checkpoint_eta: 'Trip Completed',
                base_time: Date.now(),
                estimated_range: { min: 0, max: 0 }
              },
              scan_timestamp: new Date().toISOString()
            }
          };
        } else {
          return {
            status: 'error',
            message: tripResult.message
          };
        }
      } else {
        // Add intermediate checkpoint
        if (!activeTrip) {
          return {
            status: 'error',
            message: 'No active trip. Please start a trip by scanning a start checkpoint first.'
          };
        }

        const checkpointResult = await tripTrackingService.addCheckpoint(
          driverIdStr,
          checkpoint
        );

        if (checkpointResult.success) {
          setActiveTrip(checkpointResult.activeTrip);
          console.log('📍 Checkpoint added:', checkpoint.name);
          
          return {
            status: 'success',
            message: `📍 Location updated: ${checkpoint.name}`,
            data: { 
              activeTrip: checkpointResult.activeTrip,
              checkpoint: {
                id: parseInt(checkpoint.id),
                name: checkpoint.name,
                route: qrData.route_name,
                sequence_order: qrData.sequence_order
              },
              arrival_estimate: {
                next_checkpoint_eta: 'Unknown',
                base_time: Date.now(),
                estimated_range: { min: 5, max: 7 }
              },
              scan_timestamp: new Date().toISOString()
            }
          };
        } else {
          return {
            status: 'error',
            message: checkpointResult.message
          };
        }
      }
    } catch (error) {
      console.error('Trip logic error:', error);
      return {
        status: 'error',
        message: 'Failed to process trip logic'
      };
    }
  };

  const handleBarcodeScanned = async ({ data }: { type: string; data: string }) => {
    if (isHandlingScanRef.current || scanned) return;
    isHandlingScanRef.current = true;

    console.log('🔍 Scanned QR data:', data);
    const checkpointQR = parseCheckpointQR(data);
    console.log('🔍 Parsed checkpoint QR:', checkpointQR);

    if (checkpointQR) {
      setScanned(true);
      setShowCamera(false);
      setProcessing(true);

      try {
        // First, process the checkpoint scan to update location in backend
        const scanResult = await processCheckpointScan(checkpointQR);
        
        if (scanResult.status === 'success') {
          // Update local location immediately
          const checkpointName = scanResult.data?.checkpoint?.name || checkpointQR.checkpoint_name;
          onLocationUpdate(
            checkpointName, 
            scanResult.data?.scan_timestamp || new Date().toISOString()
          );
          
          // Then handle trip logic
          const result = await handleTripLogic(checkpointQR);
          setLastScanResult(result);
          
          if (result.status === 'success') {
            // Show different alerts based on checkpoint type
            const checkpointType = checkpointQR.is_origin ? 'start' : 
                                  (checkpointQR.is_destination ? 'end' : 'checkpoint');
            
            let alertTitle = '✅ Location Updated!';
            let alertMessage = `Successfully scanned ${checkpointQR.checkpoint_name}.\n\nRoute: ${checkpointQR.route_name}\n\n`;
            
            if (checkpointType === 'start') {
              alertTitle = '🚍 Trip Started!';
              alertMessage += `Trip started from ${checkpointQR.checkpoint_name}.\n\nPassengers have been notified.`;
            } else if (checkpointType === 'end') {
              alertTitle = '✅ Trip Completed!';
              alertMessage += `Trip completed! You have finished 1 trip.\n\nYour shift will now end.`;
            } else {
              alertMessage += `Location updated: ${checkpointQR.checkpoint_name}.\n\nPassengers have been notified of your location.`;
            }

            Alert.alert(
              alertTitle,
              alertMessage,
              [
                {
                  text: 'Continue',
                  onPress: () => {
                    setScanned(false);
                    isHandlingScanRef.current = false;
                  }
                }
              ]
            );
            
            onScanSuccess?.(result);
          } else if (result.status === 'warning') {
            Alert.alert(
              '⚠️ Warning',
              result.message,
              [
                {
                  text: 'Continue Anyway',
                  onPress: () => {
                    setScanned(false);
                    isHandlingScanRef.current = false;
                  }
                },
                {
                  text: 'Cancel',
                  style: 'cancel',
                  onPress: () => {
                    setScanned(false);
                    isHandlingScanRef.current = false;
                  }
                }
              ]
            );
          } else {
            Alert.alert(
              '❌ Trip Logic Failed',
              result.message,
              [
                {
                  text: 'Try Again',
                  onPress: () => {
                    setScanned(false);
                    isHandlingScanRef.current = false;
                  }
                }
              ]
            );
          }
        } else {
          // Scan failed - show error
          Alert.alert(
            '❌ Scan Failed',
            scanResult.message,
            [
              {
                text: 'Try Again',
                onPress: () => {
                  setScanned(false);
                  isHandlingScanRef.current = false;
                }
              }
            ]
          );
        }
      } catch (error) {
        console.error('Error processing checkpoint scan:', error);
        Alert.alert(
          'Error',
          'Failed to process checkpoint scan. Please try again.',
          [
            {
              text: 'Try Again',
              onPress: () => {
                setScanned(false);
                isHandlingScanRef.current = false;
              }
            }
          ]
        );
      } finally {
        setProcessing(false);
      }
    } else {
      // Not a valid checkpoint QR code
      isHandlingScanRef.current = false;
      Alert.alert(
        'Invalid QR Code',
        'This is not a valid checkpoint QR code. Please scan a QR code generated by the LakbAI checkpoint management system.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Scanner Button */}
      <TouchableOpacity 
        style={styles.scanButton} 
        onPress={handleOpenCamera}
        disabled={processing}
      >
        <Ionicons 
          name="qr-code-outline" 
          size={24} 
          color={COLORS.white} 
        />
        <Text style={styles.scanButtonText}>
          {processing ? 'Processing...' : 'Scan Checkpoint QR Code'}
        </Text>
      </TouchableOpacity>

      {/* Trip Status Indicator */}
      {activeTrip && (
        <View style={styles.tripStatusContainer}>
          <Ionicons name="car" size={20} color={COLORS.primary} />
          <Text style={styles.tripStatusText}>
            Active Trip: {activeTrip.startCheckpoint.name} → {activeTrip.endCheckpoint?.name || 'In Progress'}
          </Text>
        </View>
      )}

      {/* Last Scan Result */}
      {lastScanResult && (
        <View style={[
          styles.resultContainer,
          lastScanResult.status === 'success' ? styles.successResult : styles.errorResult
        ]}>
          <Ionicons 
            name={lastScanResult.status === 'success' ? 'checkmark-circle' : 'alert-circle'} 
            size={20} 
            color={lastScanResult.status === 'success' ? COLORS.success : COLORS.warning}
          />
          <Text style={[
            styles.resultText,
            { color: lastScanResult.status === 'success' ? COLORS.success : COLORS.warning }
          ]}>
            {lastScanResult.message}
          </Text>
        </View>
      )}

      {/* Camera Modal */}
      <Modal
        visible={showCamera}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowCamera(false)}
      >
        <View style={styles.cameraContainer}>
          <View style={styles.cameraHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowCamera(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.cameraTitle}>Scan Checkpoint QR Code</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.cameraWrapper}>
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
            />
            
            {/* Scan Overlay */}
            <View style={styles.scanOverlay}>
              <View style={styles.scanFrame} />
              <Text style={styles.scanInstructions}>
                Position the QR code within the frame
              </Text>
              <Text style={styles.scanSubtitle}>
                Scan checkpoint QR codes to update your location
              </Text>
            </View>
          </View>

          {/* Processing Indicator */}
          {processing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color={COLORS.white} />
              <Text style={styles.processingText}>Processing scan...</Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  scanButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    margin: SPACING.md,
  },
  scanButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600' as const,
    marginLeft: SPACING.sm,
  },
  resultContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
  },
  successResult: {
    backgroundColor: COLORS.success + '10',
    borderColor: COLORS.success,
  },
  errorResult: {
    backgroundColor: COLORS.warning + '10',
    borderColor: COLORS.warning,
  },
  resultText: {
    fontSize: 14,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  tripStatusContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: COLORS.primaryLight,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  tripStatusText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.primary,
    marginLeft: 8,
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: COLORS.gray900,
  },
  cameraHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingTop: 50,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  closeButton: {
    padding: SPACING.sm,
  },
  cameraTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600' as const,
  },
  placeholder: {
    width: 40,
  },
  cameraWrapper: {
    flex: 1,
    position: 'relative' as const,
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: COLORS.white,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  scanInstructions: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  scanSubtitle: {
    color: COLORS.white,
    fontSize: 14,
    textAlign: 'center' as const,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    opacity: 0.8,
  },
  processingOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  processingText: {
    color: COLORS.white,
    fontSize: 16,
    marginTop: SPACING.md,
  },
};

export default CheckpointScanner;
