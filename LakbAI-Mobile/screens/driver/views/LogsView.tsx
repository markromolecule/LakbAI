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
  createdAt: number; // timestamp for cleanup
}

interface LogsViewProps {
  recentLogs: LogItemType[];
  driverProfile?: DriverProfile;
}

interface PeriodTrips {
  todayTrips: number;
  weeklyTrips: number;
  monthlyTrips: number;
  yearlyTrips: number;
  totalTrips: number;
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

  const [periodTrips, setPeriodTrips] = useState<PeriodTrips>({
    todayTrips: 0,
    weeklyTrips: 0,
    monthlyTrips: 0,
    yearlyTrips: 0,
    totalTrips: 0
  });

  const [todaysScans, setTodaysScans] = useState<CheckpointScan[]>([]);
  const [allScansToday, setAllScansToday] = useState<CheckpointScan[]>([]);
  const [lastResetDate, setLastResetDate] = useState<string>(new Date().toDateString());

  // Check and reset scans at 5:00 AM daily
  const checkAndResetDailyScans = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDate = now.toDateString();
    
    // Check if it's 5:00 AM or later and we haven't reset today
    const shouldReset = currentHour >= 5 && lastResetDate !== currentDate;
    
    if (shouldReset) {
      console.log('🔄 5:00 AM reset time reached - resetting today\'s scans');
      
      // Reset all scans
      setTodaysScans([]);
      setAllScansToday([]);
      
      // Update last reset date
      setLastResetDate(currentDate);
      
      console.log('🔄 Reset scans for new day at 5:00 AM');
    }
  };

  // Cleanup function to remove logs older than 30 minutes
  const cleanupOldLogs = () => {
    const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000); // 30 minutes in milliseconds
    setTodaysScans(prev => prev.filter(scan => scan.createdAt > thirtyMinutesAgo));
    // Note: We don't update totalScansToday here because it should reflect all scans today,
    // not just the ones in the 30-minute window
  };

  // Set up cleanup interval (run every 5 minutes) and daily reset check
  useEffect(() => {
    const cleanupInterval = setInterval(cleanupOldLogs, 5 * 60 * 1000); // 5 minutes
    const resetCheckInterval = setInterval(checkAndResetDailyScans, 60 * 1000); // Check every minute
    
    return () => {
      clearInterval(cleanupInterval);
      clearInterval(resetCheckInterval);
    };
  }, [lastResetDate]);

  // Get real trip data from services
  useEffect(() => {
    if (driverProfile) {
      const driverId = driverProfile.id.toString();
      
      // Check for daily reset first
      checkAndResetDailyScans();
      
      // Get earnings data (includes trip counts)
      const earnings = earningsService.getEarnings(driverId);
      
      // Get trip summary from trip tracking service
      const tripSummary = tripTrackingService.getTripSummary(driverId);
      
      // Initialize scans from existing trips if empty and not reset today
      if (todaysScans.length === 0 && allScansToday.length === 0) {
        console.log('📅 Initializing scans from existing trips...');
        const activeTrip = tripTrackingService.getActiveTrip(driverId);
        const completedTrips = tripTrackingService.getCompletedTrips(driverId);
        
        const initialScans: CheckpointScan[] = [];
        
        // Add scans from completed trips today (in chronological order)
        completedTrips.forEach(trip => {
          const tripDate = new Date(trip.startTime).toDateString();
          const today = new Date().toDateString();
          
          if (tripDate === today) {
            // Add start scan
            initialScans.push({
              id: `scan_${trip.id}_start`,
              time: new Date(trip.startTime).toLocaleTimeString(),
              location: trip.startCheckpoint.name,
              scanType: 'start',
              tripId: trip.id,
              createdAt: new Date(trip.startTime).getTime()
            });
            
            // Add intermediate scans in order
            trip.intermediateCheckpoints.forEach((checkpoint, index) => {
              initialScans.push({
                id: `scan_${trip.id}_inter_${index}`,
                time: new Date(checkpoint.scannedAt).toLocaleTimeString(),
                location: checkpoint.name,
                scanType: 'intermediate',
                tripId: trip.id,
                createdAt: new Date(checkpoint.scannedAt).getTime()
              });
            });
            
            // Add end scan if completed
            if (trip.endCheckpoint) {
              initialScans.push({
                id: `scan_${trip.id}_end`,
                time: new Date(trip.endCheckpoint.scannedAt).toLocaleTimeString(),
                location: trip.endCheckpoint.name,
                scanType: 'end',
                tripId: trip.id,
                createdAt: new Date(trip.endCheckpoint.scannedAt).getTime()
              });
            }
          }
        });
        
        // Add scans from active trip if it started today
        if (activeTrip) {
          const tripDate = new Date(activeTrip.startTime).toDateString();
          const today = new Date().toDateString();
          
          if (tripDate === today) {
            // Add start scan
            initialScans.push({
              id: `scan_${activeTrip.id}_start`,
              time: new Date(activeTrip.startTime).toLocaleTimeString(),
              location: activeTrip.startCheckpoint.name,
              scanType: 'start',
              tripId: activeTrip.id,
              createdAt: new Date(activeTrip.startTime).getTime()
            });
            
            // Add intermediate scans
            activeTrip.intermediateCheckpoints.forEach((checkpoint, index) => {
              initialScans.push({
                id: `scan_${activeTrip.id}_inter_${index}`,
                time: new Date(checkpoint.scannedAt).toLocaleTimeString(),
                location: checkpoint.name,
                scanType: 'intermediate',
                tripId: activeTrip.id,
                createdAt: new Date(checkpoint.scannedAt).getTime()
              });
            });
          }
        }
        
        // Sort by time (most recent first)
        initialScans.sort((a, b) => b.createdAt - a.createdAt);
        setAllScansToday(initialScans); // Store all scans
        setTodaysScans(initialScans.slice(0, 5)); // Show only 5 most recent
        console.log('📅 Initialized with', initialScans.length, 'total scans (showing 5)');
      }
      
      // Count completed trips from trip tracking service for today
      const completedTrips = tripTrackingService.getCompletedTrips(driverId);
      const todayCompletedTrips = completedTrips.filter(trip => {
        const tripDate = new Date(trip.startTime).toDateString();
        const today = new Date().toDateString();
        return tripDate === today && trip.endCheckpoint; // Only count completed trips
      }).length;

      setTripData({
        todayTrips: todayCompletedTrips, // Use actual completed trips from trip tracking
        totalTripsAllTime: earnings.totalTrips,
        todayCheckpoints: allScansToday.length, // Use total scans count (not limited to 5)
        totalEarnings: earnings.totalEarnings
      });

      // Set period trips data (from database via API)
      setPeriodTrips({
        todayTrips: todayCompletedTrips, // Use actual completed trips
        weeklyTrips: earnings.weeklyTrips || 0,
        monthlyTrips: earnings.monthlyTrips || 0, 
        yearlyTrips: earnings.yearlyTrips || 0,
        totalTrips: earnings.totalTrips
      });
      
      console.log('📅 LogsView trip data updated:', {
        todayTrips: todayCompletedTrips,
        totalTripsAllTime: earnings.totalTrips,
        todayCheckpoints: todaysScans.length,
        completedTripsFromTracking: completedTrips.length
      });
    }
  }, [driverProfile]);

  // Update checkpoint count when scans change
  useEffect(() => {
    setTripData(prev => ({
      ...prev,
      todayCheckpoints: allScansToday.length
    }));
  }, [allScansToday]);

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
          totalEarnings: earnings.totalEarnings,
          todayCheckpoints: prev.todayCheckpoints // Keep current checkpoint count
        }));
        
        // Update period trips as well
        setPeriodTrips({
          todayTrips: earnings.todayTrips,
          weeklyTrips: earnings.weeklyTrips || 0,
          monthlyTrips: earnings.monthlyTrips || 0, 
          yearlyTrips: earnings.yearlyTrips || 0,
          totalTrips: earnings.totalTrips
        });
        
        console.log('📅 LogsView earnings updated:', earnings);
      }
    });
    
    // Listen for trip tracking events to capture scan data with improved logic
    const unsubscribeTrip = tripTrackingService.addTripListener((updatedDriverId, action) => {
      if (updatedDriverId === driverId) {
        console.log('📅 LogsView - Trip tracking event:', action, 'for driver:', updatedDriverId);
        
        // Get active trip to extract scan information
        const activeTrip = tripTrackingService.getActiveTrip(driverId);
        const completedTrips = tripTrackingService.getCompletedTrips(driverId);
        
        const now = new Date();
        const scanTime = now.toLocaleTimeString();
        const scanTimestamp = now.getTime();
        
        if (action === 'trip_started' && activeTrip) {
          // Add start checkpoint scan
          const startScan: CheckpointScan = {
            id: `scan_${activeTrip.id}_start`,
            time: scanTime,
            location: activeTrip.startCheckpoint.name,
            scanType: 'start',
            tripId: activeTrip.id,
            createdAt: scanTimestamp
          };
          
          setAllScansToday(prev => [startScan, ...prev]); // Add to all scans
          setTodaysScans(prev => {
            const newScans = [startScan, ...prev].slice(0, 5);
            return newScans;
          });
          console.log('📅 Added start scan:', startScan);
          
        } else if (action === 'checkpoint_added' && activeTrip) {
          // Add intermediate checkpoint scan
          const lastCheckpoint = activeTrip.intermediateCheckpoints[activeTrip.intermediateCheckpoints.length - 1];
          if (lastCheckpoint) {
            const intermediateScan: CheckpointScan = {
              id: `scan_${activeTrip.id}_inter_${activeTrip.intermediateCheckpoints.length - 1}`,
              time: scanTime,
              location: lastCheckpoint.name,
              scanType: 'intermediate',
              tripId: activeTrip.id,
              createdAt: scanTimestamp
            };
            
            setAllScansToday(prev => [intermediateScan, ...prev]); // Add to all scans
            setTodaysScans(prev => {
              const newScans = [intermediateScan, ...prev].slice(0, 5);
              return newScans;
            });
            console.log('📅 Added intermediate scan:', intermediateScan);
          }
          
        } else if (action === 'trip_completed') {
          // For trip completion, get the end checkpoint from completed trips
          setTimeout(() => {
            const completedTrips = tripTrackingService.getCompletedTrips(driverId);
            if (completedTrips.length > 0) {
              const lastCompletedTrip = completedTrips[completedTrips.length - 1];
              if (lastCompletedTrip.endCheckpoint) {
                const endScan: CheckpointScan = {
                  id: `scan_${lastCompletedTrip.id}_end`,
                  time: new Date(lastCompletedTrip.endCheckpoint.scannedAt).toLocaleTimeString(),
                  location: lastCompletedTrip.endCheckpoint.name,
                  scanType: 'end',
                  tripId: lastCompletedTrip.id,
                  createdAt: new Date(lastCompletedTrip.endCheckpoint.scannedAt).getTime()
                };
                
                setAllScansToday(prev => [endScan, ...prev]); // Add to all scans
                setTodaysScans(prev => {
                  const newScans = [endScan, ...prev].slice(0, 5);
                  return newScans;
                });
                console.log('📅 Added end scan (delayed):', endScan);
                
                // Update trip count when trip is completed
                const todayCompletedTrips = completedTrips.filter(trip => {
                  const tripDate = new Date(trip.startTime).toDateString();
                  const today = new Date().toDateString();
                  return tripDate === today && trip.endCheckpoint;
                }).length;
                
                setTripData(prev => ({
                  ...prev,
                  todayTrips: todayCompletedTrips
                }));
                
                setPeriodTrips(prev => ({
                  ...prev,
                  todayTrips: todayCompletedTrips
                }));
                
                console.log('📅 Updated trip count after completion:', todayCompletedTrips);
              }
            }
          }, 100); // Small delay to ensure trip is properly completed
          
        } else if (action === 'trip_cleared') {
          // Don't clear scans when trip is cleared - keep the history
          console.log('📅 Trip cleared, but keeping scan history');
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
        <ScrollView 
          style={logsStyles.logsList}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          {todaysScans.length > 0 ? (
            <>
              {todaysScans.map((scan) => (
                <LogItem 
                  key={scan.id} 
                  log={{
                    time: scan.time,
                    location: scan.location,
                    passengers: 0, // Not used anymore
                    scanType: scan.scanType
                  }} 
                />
              ))}
              {todaysScans.length >= 5 && (
                <View style={logsStyles.scrollIndicator}>
                  <Text style={logsStyles.scrollIndicatorText}>
                    Scroll to see more activity
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={logsStyles.emptyStateContainer}>
              <Text style={logsStyles.emptyStateText}>No checkpoint scans yet today</Text>
              <Text style={logsStyles.emptyStateText}>Start scanning QR codes to see activity here</Text>
            </View>
          )}
        </ScrollView>
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

      {/* Period Trips Section - Similar to Period Earnings */}
      <View style={logsStyles.weeklyCard}>
        <Text style={logsStyles.weeklySectionTitle}>Period Trips</Text>
        <View style={logsStyles.weeklyRow}>
          <Text style={logsStyles.weeklyLabel}>Today:</Text>
          <Text style={[logsStyles.weeklyValue, { color: '#16A34A' }]}>{periodTrips.todayTrips} trips</Text>
        </View>
        <View style={logsStyles.weeklyRow}>
          <Text style={logsStyles.weeklyLabel}>This Week:</Text>
          <Text style={[logsStyles.weeklyValue, { color: '#3B82F6' }]}>{periodTrips.weeklyTrips} trips</Text>
        </View>
        <View style={logsStyles.weeklyRow}>
          <Text style={logsStyles.weeklyLabel}>This Month:</Text>
          <Text style={[logsStyles.weeklyValue, { color: '#F59E0B' }]}>{periodTrips.monthlyTrips} trips</Text>
        </View>
        <View style={logsStyles.weeklyRow}>
          <Text style={logsStyles.weeklyLabel}>This Year:</Text>
          <Text style={[logsStyles.weeklyValue, { color: '#EF4444' }]}>{periodTrips.yearlyTrips} trips</Text>
        </View>
        <View style={logsStyles.weeklyRow}>
          <Text style={logsStyles.weeklyLabel}>All-Time Total:</Text>
          <Text style={[logsStyles.weeklyValue, { color: '#8B5CF6' }]}>{periodTrips.totalTrips} trips</Text>
        </View>
      </View>

      <View style={logsStyles.weeklyCard}>
        <Text style={logsStyles.weeklySectionTitle}>Performance Summary</Text>
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
        <View style={logsStyles.weeklyRow}>
          <Text style={logsStyles.weeklyLabel}>Checkpoints Today:</Text>
          <Text style={[logsStyles.weeklyValue, { color: '#3B82F6' }]}>{tripData.todayCheckpoints} scanned</Text>
        </View>
      </View>
    </ScrollView>
  );
};