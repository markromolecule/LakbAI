import React from 'react';
import { ScrollView, View, TouchableOpacity, Text } from 'react-native';
import { QrCode, Camera, MapPin, AlertCircle } from 'lucide-react-native';
import { driverStyles, scannerStyles, homeStyles } from '../styles';

interface ScannerViewProps {
  driverLocation: string;
  lastScanTime: string;
  onSimulateScan: () => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  driverLocation,
  lastScanTime,
  onSimulateScan
}) => {
  return (
    <ScrollView 
      style={driverStyles.container} 
      contentContainerStyle={driverStyles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={scannerStyles.scannerHeader}>
        <QrCode size={96} color="#22C55E" />
        <Text style={scannerStyles.scannerTitle}>Checkpoint Scanner</Text>
        <Text style={scannerStyles.scannerSubtitle}>Scan QR code at checkpoints to update your location</Text>
      </View>

      <View style={scannerStyles.cameraViewfinder}>
        <Camera size={64} color="#9CA3AF" />
        <Text style={scannerStyles.viewfinderText}>Camera viewfinder</Text>
        <Text style={scannerStyles.viewfinderSubtext}>Point at checkpoint QR code</Text>
      </View>

      <TouchableOpacity 
        onPress={onSimulateScan}
        style={scannerStyles.scanButton}
      >
        <Text style={scannerStyles.scanButtonText}>Simulate Checkpoint Scan</Text>
      </TouchableOpacity>

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
        <Text style={scannerStyles.instructionsTitle}>Scanning Instructions:</Text>
        <Text style={scannerStyles.instructionItem}>• Scan at each designated checkpoint</Text>
        <Text style={scannerStyles.instructionItem}>• Ensure good lighting for accurate scanning</Text>
        <Text style={scannerStyles.instructionItem}>• Keep your location updated for passengers</Text>
        <Text style={scannerStyles.instructionItem}>• Report any damaged QR codes to dispatch</Text>
      </View>

      <View style={scannerStyles.warningCard}>
        <View style={scannerStyles.warningHeader}>
          <AlertCircle size={20} color="#D97706" />
          <Text style={scannerStyles.warningTitle}>Important:</Text>
        </View>
        <Text style={scannerStyles.warningText}>
          Regular location updates help passengers track your jeepney and plan their trips better.
        </Text>
      </View>
    </ScrollView>
  );
};