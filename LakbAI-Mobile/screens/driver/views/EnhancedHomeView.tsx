import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../../shared/styles';
import { driverStyles } from '../styles';
import { CheckpointScanner } from '../../../components/driver/CheckpointScanner';
import { earningsService } from '../../../shared/services/earningsService';
import { tripTrackingService } from '../../../shared/services/tripTrackingService';

interface DriverProfile {
  id: number;
  name: string;
  jeepneyNumber: string;
  route: string;
  totalEarnings: number;
  todayEarnings: number;
  totalTrips: number;
  rating: number;
}

interface EnhancedHomeViewProps {
  driverProfile: DriverProfile;
  isOnDuty: boolean;
  driverLocation: string;
  lastScanTime: string;
  onNavigate: (view: string) => void;
  onToggleDuty: () => void;
  onRefresh: () => void;
  onLocationUpdate: (location: string, scanTime: string) => void;
}

export const EnhancedHomeView: React.FC<EnhancedHomeViewProps> = ({
  driverProfile,
  isOnDuty,
  driverLocation,
  lastScanTime,
  onNavigate,
  onToggleDuty,
  onRefresh,
  onLocationUpdate
}) => {
  const [recentScans, setRecentScans] = useState<Array<{
    checkpoint: string;
    time: string;
    success: boolean;
  }>>([]);

  // Auto-refresh earnings on HomeView with database polling
  useEffect(() => {
    console.log('🏠 Enhanced HomeView mounted - setting up database-driven auto-refresh');
    
    // Note: We don't clear active trips on mount anymore to allow trips to persist
    // Active trips should only be cleared when explicitly ending a shift
    
    // Set up frequent auto-refresh interval for real-time database sync
    const interval = setInterval(async () => {
      if (driverProfile.id && onRefresh) {
        console.log('🔄 Enhanced HomeView database auto-refresh - checking for earnings updates...');
        onRefresh();
      }
    }, 3000); // Refresh every 3 seconds for faster updates
    
    // Set up earnings listener for immediate updates
    const unsubscribe = earningsService.addListener((driverId) => {
      if (driverProfile.id?.toString() === driverId && onRefresh) {
        console.log('💰 Enhanced HomeView earnings listener triggered - immediate refresh...');
        // Add small delay to batch rapid updates and ensure smooth UI
        setTimeout(() => {
          onRefresh();
        }, 100);
      }
    });

    return () => {
      console.log('🏠 Enhanced HomeView unmounted - cleaning up database auto-refresh');
      clearInterval(interval);
      unsubscribe();
    };
  }, [driverProfile.id, onRefresh]);

  // Dynamic greeting based on current time
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Good morning,';
    } else if (hour < 18) {
      return 'Good afternoon,';
    } else {
      return 'Good evening,';
    }
  };

  const handleScanSuccess = (result: any) => {
    if (result.status === 'success' && result.data) {
      // Add to recent scans
      const newScan = {
        checkpoint: result.data.checkpoint?.name || result.data.activeTrip?.startCheckpoint?.name || 'Unknown',
        time: new Date().toLocaleTimeString(),
        success: true
      };
      
      setRecentScans(prev => [newScan, ...prev.slice(0, 4)]); // Keep last 5 scans
      
      // Show success feedback
      Alert.alert(
        '🎉 Great Job!',
        `Location updated: ${result.data.checkpoint?.name || result.data.activeTrip?.startCheckpoint?.name || 'Unknown'}\n` +
        `Passengers notified with ETA: ${result.data.arrival_estimate?.next_checkpoint_eta || 'Unknown'}`,
        [{ text: 'Continue' }]
      );
    }
  };

  const handleTripCompleted = (tripSummary: any) => {
    Alert.alert(
      '🎉 Trip Completed!',
      `Congratulations! You have completed 1 trip.\n\n` +
      `Duration: ${tripSummary?.duration || 0} minutes\n` +
      `Checkpoints: ${tripSummary?.checkpoints || 0}\n` +
      `Distance: ${tripSummary?.distance || '0 km'}\n\n` +
      `Your shift will now end automatically.`,
      [
        {
          text: 'OK',
          onPress: () => {
            // Automatically end shift after trip completion
            console.log('Trip completed, automatically ending shift...');
            // The shift will be ended by the onShiftEnd callback
          }
        }
      ]
    );
  };

  const handleShiftEnd = () => {
    // Clear any active trip when ending shift
    const clearResult = tripTrackingService.clearActiveTrip(driverProfile.id.toString());
    console.log('🧹 Clearing active trip on shift end:', clearResult);
    
    // Automatically end the shift
    if (onToggleDuty) {
      onToggleDuty();
    }
    
    Alert.alert(
      '👋 Shift Ended',
      'Your shift has ended after completing the trip.\n\nThank you for your service!',
      [
        {
          text: 'OK',
          onPress: () => {
            // Navigate back to login or home screen
            // This would typically involve navigation logic
            console.log('Shift ended, navigating to login...');
          }
        }
      ]
    );
  };

  const statusRows = [
    { label: 'Current Location', value: driverLocation, icon: 'location' },
    { label: 'Last Update', value: lastScanTime, icon: 'time' },
    { label: 'Route', value: driverProfile.route, icon: 'map' },
    { 
      label: 'Status', 
      value: isOnDuty ? 'Active' : 'Inactive',
      valueColor: isOnDuty ? COLORS.success : COLORS.error,
      icon: isOnDuty ? 'radio-button-on' : 'radio-button-off'
    }
  ];

  const earningsData = [
    {
      title: 'Today\'s Earnings',
      value: `₱${driverProfile.todayEarnings?.toFixed(2) || '0.00'}`,
      icon: 'today',
      color: COLORS.success,
      subtitle: 'Current shift'
    },
    {
      title: 'Total Earnings',
      value: `₱${driverProfile.totalEarnings?.toFixed(2) || '0.00'}`,
      icon: 'wallet',
      color: COLORS.primary,
      subtitle: 'All time'
    },
    {
      title: 'Total Trips',
      value: driverProfile.totalTrips?.toString() || '0',
      icon: 'car',
      color: COLORS.orange,
      subtitle: 'Completed'
    },
    {
      title: 'Rating',
      value: `${driverProfile.rating?.toFixed(1) || '0.0'} ⭐`,
      icon: 'star',
      color: COLORS.warning,
      subtitle: 'Average'
    }
  ];

  return (
    <ScrollView 
      style={driverStyles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Enhanced Header */}
      <View style={styles.headerContainer}>
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>{getTimeBasedGreeting()}</Text>
          <Text style={styles.driverName}>{driverProfile.name}</Text>
          <Text style={styles.jeepneyInfo}>
            {driverProfile.jeepneyNumber} • {driverProfile.route}
          </Text>
        </View>
        
        <View style={styles.dutyToggleContainer}>
          <TouchableOpacity
            style={[
              styles.dutyToggle,
              { backgroundColor: isOnDuty ? COLORS.success : COLORS.error }
            ]}
            onPress={onToggleDuty}
          >
            <Ionicons 
              name={isOnDuty ? 'radio-button-on' : 'radio-button-off'} 
              size={20} 
              color={COLORS.white} 
            />
            <Text style={styles.dutyToggleText}>
              {isOnDuty ? 'On Duty' : 'Off Duty'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Enhanced Checkpoint Scanner */}
      <View style={styles.scannerSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="qr-code" size={24} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Checkpoint Scanner</Text>
        </View>
        
        <CheckpointScanner
          driverId={driverProfile.id}
          driverName={driverProfile.name}
          jeepneyNumber={driverProfile.jeepneyNumber}
          onLocationUpdate={onLocationUpdate}
          onScanSuccess={handleScanSuccess}
          onTripCompleted={handleTripCompleted}
          onShiftEnd={handleShiftEnd}
        />

        {/* Recent Scans */}
        {recentScans.length > 0 && (
          <View style={styles.recentScansContainer}>
            <Text style={styles.recentScansTitle}>Recent Scans</Text>
            {recentScans.map((scan, index) => (
              <View key={index} style={styles.recentScanItem}>
                <Ionicons 
                  name={scan.success ? 'checkmark-circle' : 'close-circle'} 
                  size={16} 
                  color={scan.success ? COLORS.success : COLORS.error} 
                />
                <Text style={styles.recentScanText}>
                  {scan.checkpoint} • {scan.time}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Enhanced Earnings Cards */}
      <View style={styles.earningsSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="trending-up" size={24} color={COLORS.success} />
          <Text style={styles.sectionTitle}>Earnings Overview</Text>
        </View>
        
        <View style={styles.earningsGrid}>
          {earningsData.map((item, index) => (
            <View key={index} style={styles.earningsCard}>
              <View style={[styles.earningsIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <View style={styles.earningsContent}>
                <Text style={styles.earningsValue}>{item.value}</Text>
                <Text style={styles.earningsTitle}>{item.title}</Text>
                <Text style={styles.earningsSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Enhanced Status Information */}
      <View style={styles.statusSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="information-circle" size={24} color={COLORS.info} />
          <Text style={styles.sectionTitle}>Driver Status</Text>
        </View>
        
        <View style={styles.statusGrid}>
          {statusRows.map((row, index) => (
            <View key={index} style={styles.statusRow}>
              <View style={styles.statusLabel}>
                <Ionicons name={row.icon as any} size={18} color={COLORS.primary} />
                <Text style={styles.statusLabelText}>{row.label}</Text>
              </View>
              <Text style={[
                styles.statusValue,
                row.valueColor && { color: row.valueColor }
              ]}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="flash" size={24} color={COLORS.warning} />
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onNavigate('scanner')}
          >
            <Ionicons name="scan" size={20} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Scanner</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onNavigate('earnings')}
          >
            <Ionicons name="wallet" size={20} color={COLORS.success} />
            <Text style={styles.actionButtonText}>Earnings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onNavigate('profile')}
          >
            <Ionicons name="person" size={20} color={COLORS.gray} />
            <Text style={styles.actionButtonText}>Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onRefresh}
          >
            <Ionicons name="refresh" size={20} color={COLORS.info} />
            <Text style={styles.actionButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = {
  headerContainer: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    borderRadius: 12,
    margin: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  greetingSection: {
    marginBottom: SPACING.md,
  },
  greeting: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 4,
  },
  driverName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.dark,
    marginBottom: 4,
  },
  jeepneyInfo: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500' as const,
  },
  dutyToggleContainer: {
    alignItems: 'flex-end' as const,
  },
  dutyToggle: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  dutyToggleText: {
    color: COLORS.white,
    fontWeight: '600' as const,
    marginLeft: SPACING.xs,
  },
  scannerSection: {
    backgroundColor: COLORS.white,
    margin: SPACING.md,
    marginTop: 0,
    borderRadius: 12,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.dark,
    marginLeft: SPACING.sm,
  },
  recentScansContainer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  recentScansTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
  },
  recentScanItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  recentScanText: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: SPACING.xs,
  },
  earningsSection: {
    backgroundColor: COLORS.white,
    margin: SPACING.md,
    marginTop: 0,
    borderRadius: 12,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  earningsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
  },
  earningsCard: {
    width: '48%',
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  earningsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: SPACING.sm,
  },
  earningsContent: {
    flex: 1,
  },
  earningsValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: COLORS.dark,
  },
  earningsTitle: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 2,
  },
  earningsSubtitle: {
    fontSize: 10,
    color: COLORS.gray,
  },
  statusSection: {
    backgroundColor: COLORS.white,
    margin: SPACING.md,
    marginTop: 0,
    borderRadius: 12,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusGrid: {
    gap: SPACING.sm,
  },
  statusRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  statusLabel: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  statusLabelText: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: SPACING.xs,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.dark,
  },
  actionsSection: {
    backgroundColor: COLORS.white,
    margin: SPACING.md,
    marginTop: 0,
    borderRadius: 12,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtons: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  actionButton: {
    alignItems: 'center' as const,
    padding: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    minWidth: 70,
  },
  actionButtonText: {
    fontSize: 12,
    color: COLORS.dark,
    marginTop: 4,
    fontWeight: '500' as const,
  },
};

export default EnhancedHomeView;
