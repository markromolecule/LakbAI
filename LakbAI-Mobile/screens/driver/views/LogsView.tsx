import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { LogItem as LogItemType, DriverProfile } from '../../../shared/types/driver';
import { LogItem } from '../components';
import { driverStyles, logsStyles } from '../styles';
import { tripTrackingService } from '../../../shared/services/tripTrackingService';
import { earningsService } from '../../../shared/services/earningsService';

interface CheckpointScan {
  id: string;
  time: string;
  location: string;
  scanType: 'start' | 'intermediate' | 'end';
  tripId?: string;
}

interface LogsViewProps {
  recentLogs: LogItemType[];
  driverProfile?: DriverProfile;
}

export const LogsView: React.FC<LogsViewProps> = ({
  recentLogs,
  driverProfile
}) => {
  const [tripData, setTripData] = useState({
    todayTrips: 0,
    totalTripsAllTime: 0,
    todayCheckpoints: 0,
    totalEarnings: 0
  });

  const [todaysScans, setTodaysScans] = useState<CheckpointScan[]>([]);

  // Get real trip data from services
  useEffect(() => {
    if (driverProfile) {
      const driverId = driverProfile.id.toString();
      
      // Get earnings data (includes trip counts)
      const earnings = earningsService.getEarnings(driverId);
      
      // Get trip summary from trip tracking service
      const tripSummary = tripTrackingService.getTripSummary(driverId);
      
      setTripData({
        todayTrips: earnings.todayTrips,
        totalTripsAllTime: earnings.totalTrips,
        todayCheckpoints: recentLogs.length,
        totalEarnings: earnings.totalEarnings
      });
      
      console.log('📅 LogsView trip data updated:', {
        todayTrips: earnings.todayTrips,
        totalTripsAllTime: earnings.totalTrips,
        todayCheckpoints: recentLogs.length
      });
    }
  }, [driverProfile, recentLogs]);

  // Listen for trip changes to update in real-time
  useEffect(() => {
    if (!driverProfile) return;
    
    const driverId = driverProfile.id.toString();
    
    // Listen for earnings changes
    const unsubscribeEarnings = earningsService.addListener((updatedDriverId) => {
      if (updatedDriverId === driverId) {
        const earnings = earningsService.getEarnings(driverId);
        setTripData(prev => ({
          ...prev,
          todayTrips: earnings.todayTrips,
          totalTripsAllTime: earnings.totalTrips,
          totalEarnings: earnings.totalEarnings
        }));
        console.log('📅 LogsView earnings updated:', earnings);
      }
    });
    
    // Listen for trip tracking events to capture scan data
    const unsubscribeTrip = tripTrackingService.addTripListener((updatedDriverId, action) => {
      if (updatedDriverId === driverId) {
        console.log('📅 Trip tracking event:', action, 'for driver:', updatedDriverId);
        
        // Get active trip to extract scan information
        const activeTrip = tripTrackingService.getActiveTrip(driverId);
        const completedTrips = tripTrackingService.getCompletedTrips(driverId);
        
        const now = new Date();
        const scanTime = now.toLocaleTimeString();
        
        if (action === 'trip_started' && activeTrip) {
          // Add start checkpoint scan
          const startScan: CheckpointScan = {
            id: `scan_${Date.now()}`,
            time: scanTime,
            location: activeTrip.startCheckpoint.name,
            scanType: 'start',
            tripId: activeTrip.id
          };
          
          setTodaysScans(prev => [startScan, ...prev].slice(0, 10)); // Keep only last 10 scans
          console.log('📅 Added start scan:', startScan);
        } else if (action === 'checkpoint_added' && activeTrip) {
          // Add intermediate checkpoint scan
          const lastCheckpoint = activeTrip.intermediateCheckpoints[activeTrip.intermediateCheckpoints.length - 1];
          if (lastCheckpoint) {
            const intermediateScan: CheckpointScan = {
              id: `scan_${Date.now()}`,
              time: scanTime,
              location: lastCheckpoint.name,
              scanType: 'intermediate',
              tripId: activeTrip.id
            };
            
            setTodaysScans(prev => [intermediateScan, ...prev].slice(0, 10));
            console.log('📅 Added intermediate scan:', intermediateScan);
          }
        } else if (action === 'trip_completed' && completedTrips.length > 0) {
          // Add end checkpoint scan from most recently completed trip
          const lastCompletedTrip = completedTrips[completedTrips.length - 1];
          if (lastCompletedTrip.endCheckpoint) {
            const endScan: CheckpointScan = {
              id: `scan_${Date.now()}`,
              time: scanTime,
              location: lastCompletedTrip.endCheckpoint.name,
              scanType: 'end',
              tripId: lastCompletedTrip.id
            };
            
            setTodaysScans(prev => [endScan, ...prev].slice(0, 10));
            console.log('📅 Added end scan:', endScan);
          }
        }
      }
    });
    
    return () => {
      unsubscribeEarnings();
      unsubscribeTrip();
    };
  }, [driverProfile]);

  const totalPassengers = recentLogs.reduce((sum, log) => sum + log.passengers, 0);

  return (
    <ScrollView 
      style={driverStyles.container} 
      contentContainerStyle={driverStyles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={logsStyles.pageTitle}>Trip Logs</Text>
      
      <View style={logsStyles.logsCard}>
        <View style={logsStyles.logsHeader}>
          <Text style={logsStyles.logsTitle}>Today's Activity</Text>
          <Text style={logsStyles.logsDate}>{new Date().toLocaleDateString()}</Text>
        </View>
        <View style={logsStyles.logsList}>
          {todaysScans.length > 0 ? (
            todaysScans.map((scan) => (
              <LogItem 
                key={scan.id} 
                log={{
                  time: scan.time,
                  location: scan.location,
                  passengers: 0, // Not used anymore
                  scanType: scan.scanType
                }} 
              />
            ))
          ) : (
            <View style={logsStyles.emptyState}>
              <Text style={logsStyles.emptyStateText}>No checkpoint scans yet today</Text>
              <Text style={logsStyles.emptyStateSubtext}>Start scanning QR codes to see activity here</Text>
            </View>
          )}
        </View>
      </View>

      <View style={logsStyles.summaryGrid}>
        <View style={logsStyles.summaryCard}>
          <Text style={logsStyles.summaryTitle}>Today's Trips</Text>
          <Text style={[logsStyles.summaryValue, { color: '#16A34A' }]}>{tripData.todayTrips}</Text>
          <Text style={logsStyles.summaryLabel}>Started</Text>
        </View>
        
        <View style={logsStyles.summaryCard}>
          <Text style={logsStyles.summaryTitle}>Checkpoints</Text>
          <Text style={[logsStyles.summaryValue, { color: '#3B82F6' }]}>{tripData.todayCheckpoints}</Text>
          <Text style={logsStyles.summaryLabel}>Scanned</Text>
        </View>
      </View>

      <View style={logsStyles.weeklyCard}>
        <Text style={logsStyles.weeklySectionTitle}>All-Time Summary</Text>
        <View style={logsStyles.weeklyRow}>
          <Text style={logsStyles.weeklyLabel}>Total Trips (All-Time):</Text>
          <Text style={logsStyles.weeklyValue}>{tripData.totalTripsAllTime}</Text>
        </View>
        <View style={logsStyles.weeklyRow}>
          <Text style={logsStyles.weeklyLabel}>Total Earnings:</Text>
          <Text style={[logsStyles.weeklyValue, { color: '#16A34A' }]}>₱{tripData.totalEarnings.toFixed(2)}</Text>
        </View>
        <View style={logsStyles.weeklyRow}>
          <Text style={logsStyles.weeklyLabel}>Average per Trip:</Text>
          <Text style={logsStyles.weeklyValue}>
            ₱{tripData.totalTripsAllTime > 0 ? (tripData.totalEarnings / tripData.totalTripsAllTime).toFixed(2) : '0.00'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};