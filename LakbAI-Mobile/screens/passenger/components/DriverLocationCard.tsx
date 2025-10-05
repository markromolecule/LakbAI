import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Removed localNotificationService import - using only Expo notifications
import { locationTrackingService } from '../../../shared/services/locationTrackingService';
import { getBaseUrl } from '../../../config/apiConfig';
import { COLORS, SPACING } from '../../../shared/styles';

interface DriverLocationCardProps {
  routeId?: string;
}

interface DriverLocationInfo {
  driverId: string;
  driverName: string;
  jeepneyNumber: string;
  route: string;
  currentLocation: string;
  lastUpdate: string;
  isActive: boolean;
}

export const DriverLocationCard: React.FC<DriverLocationCardProps> = ({
  routeId = '1' // Default to route 1
}) => {
  const [drivers, setDrivers] = useState<DriverLocationInfo[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string>('');

  // Initialize location tracking service for auto-polling and Expo notifications
  useEffect(() => {
    const initializeService = async () => {
      // Initialize location tracking service for passenger app (handles Expo notifications)
      await locationTrackingService.initialize(true, routeId || '1');
      
      // Initial load using LocationTrackingService
      try {
        const serviceLocations = await locationTrackingService.fetchDriverLocations(routeId);
        
        // Convert to UI format and filter only active drivers
        const driverInfos: DriverLocationInfo[] = serviceLocations
          .filter(location => location.shiftStatus === 'on_shift') // Only include active drivers
          .map((location) => ({
            driverId: location.driverId,
            driverName: location.driverName,
            jeepneyNumber: location.jeepneyNumber,
            route: location.route,
            currentLocation: location.lastScannedCheckpoint,
            lastUpdate: location.lastUpdate,
            isActive: location.shiftStatus === 'on_shift'
          }));
        
        setDrivers(driverInfos);
        setLastRefresh(new Date().toLocaleTimeString());
      } catch (error) {
        console.error('❌ Failed to load initial driver locations:', error);
      }
    };
    
    initializeService();
    
    return () => {
      locationTrackingService.stopLocationMonitoring();
    };
  }, [routeId]);

  // Listen for location updates from LocationTrackingService
  useEffect(() => {
    // The LocationTrackingService handles both auto-refresh and notifications
    // We sync with its data instead of making separate API calls
    const interval = setInterval(async () => {
      console.log('🔄 Syncing UI with LocationTrackingService data for route:', routeId);
      try {
        // Get data from LocationTrackingService (which handles change detection and notifications)
        const serviceLocations = await locationTrackingService.fetchDriverLocations(routeId);
        
        console.log('🔄 DriverLocationCard: Received locations from LocationTrackingService:', serviceLocations.length);
        serviceLocations.forEach(location => {
          console.log(`🔄 Driver ${location.driverId}: ${location.driverName} at ${location.lastScannedCheckpoint} (${location.lastUpdate})`);
        });
        
        // Convert to UI format and filter only active drivers
        const driverInfos: DriverLocationInfo[] = serviceLocations
          .filter(location => location.shiftStatus === 'on_shift') // Only include active drivers
          .map((location) => ({
            driverId: location.driverId,
            driverName: location.driverName,
            jeepneyNumber: location.jeepneyNumber,
            route: location.route,
            currentLocation: location.lastScannedCheckpoint,
            lastUpdate: location.lastUpdate,
            isActive: location.shiftStatus === 'on_shift'
          }));
        
        setDrivers(driverInfos);
        setLastRefresh(new Date().toLocaleTimeString());
        console.log('🔄 DriverLocationCard: Updated UI with', driverInfos.length, 'active drivers for route', routeId);
      } catch (error) {
        console.error('❌ Failed to sync with LocationTrackingService:', error);
      }
    }, 3000); // Sync every 3 seconds (between the 2s monitoring interval)

    return () => clearInterval(interval);
  }, [routeId]);

  // Immediate refresh when route changes
  useEffect(() => {
    console.log('🔄 Route changed to:', routeId, '- triggering immediate refresh');
    const immediateRefresh = async () => {
      try {
        // Re-initialize LocationTrackingService with new route
        await locationTrackingService.initialize(true, routeId || '1');
        
        // Fetch fresh data for the new route
        const serviceLocations = await locationTrackingService.fetchDriverLocations(routeId);
        
        // Convert to UI format and filter only active drivers
        const driverInfos: DriverLocationInfo[] = serviceLocations
          .filter(location => location.shiftStatus === 'on_shift') // Only include active drivers
          .map((location) => ({
            driverId: location.driverId,
            driverName: location.driverName,
            jeepneyNumber: location.jeepneyNumber,
            route: location.route,
            currentLocation: location.lastScannedCheckpoint,
            lastUpdate: location.lastUpdate,
            isActive: location.shiftStatus === 'on_shift'
          }));
        
        setDrivers(driverInfos);
        setLastRefresh(new Date().toLocaleTimeString());
        console.log('🔄 Immediate refresh completed for route', routeId, 'with', driverInfos.length, 'active drivers');
      } catch (error) {
        console.error('❌ Failed to refresh data for new route:', error);
      }
    };
    
    immediateRefresh();
  }, [routeId]);

  // Load driver locations from API
  const loadDriverLocations = async () => {
    try {
      // Add cache-busting timestamp and route-specific cache key
      const cacheKey = `${routeId}_${Date.now()}`;
      const response = await fetch(`${getBaseUrl()}/mobile/passenger/real-time-drivers/${routeId}?t=${cacheKey}`);
      if (response.ok) {
        const data = await response.json();
        
        if (data.driver_locations && Array.isArray(data.driver_locations)) {
          const driverInfos: DriverLocationInfo[] = data.driver_locations
            .filter((location: any) => location.shift_status === 'on_shift') // Only include active drivers
            .map((location: any) => {
              // Determine if driver is active based on shift_status from drivers table
              const isActive = location.shift_status === 'on_shift';
              
              return {
                driverId: location.driver_id.toString(),
                driverName: `${location.first_name} ${location.last_name}` || 'Unknown Driver',
                jeepneyNumber: location.jeepney_number || 'Unknown',
                route: location.route_name || `Route ${routeId}`,
                currentLocation: location.current_location || 'Unknown Location',
                lastUpdate: location.last_update_formatted || 'Unknown',
                isActive: isActive
              };
            });
          
          setDrivers(driverInfos);
          setLastRefresh(new Date().toLocaleTimeString());
        }
      }
    } catch (error) {
      console.error('❌ Failed to load driver locations:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    
    try {
      console.log('🔄 Manual refresh of driver locations...');
      // Use LocationTrackingService for both change detection and UI data
      const serviceLocations = await locationTrackingService.refreshLocations(routeId);
      
      // Convert to UI format and filter only active drivers
      const driverInfos: DriverLocationInfo[] = serviceLocations
        .filter(location => location.shiftStatus === 'on_shift') // Only include active drivers
        .map((location) => ({
          driverId: location.driverId,
          driverName: location.driverName,
          jeepneyNumber: location.jeepneyNumber,
          route: location.route,
          currentLocation: location.lastScannedCheckpoint,
          lastUpdate: location.lastUpdate,
          isActive: location.shiftStatus === 'on_shift'
        }));
      
      setDrivers(driverInfos);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('❌ Failed to refresh driver locations:', error);
      Alert.alert('Error', 'Failed to refresh driver locations');
    } finally {
      setRefreshing(false);
    }
  };

  // Removed clearLocationUpdates function - using only Expo notifications now

  return (
    <View style={styles.container}>
      {/* Enhanced compact header */}
      <View style={styles.enhancedHeader}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.busIconContainer}>
              <Ionicons name="bus" size={16} color={COLORS.white} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.enhancedTitle}>Live Tracking</Text>
              <Text style={styles.routeSubtitle}>Route {routeId}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
            <TouchableOpacity onPress={onRefresh} style={styles.enhancedRefreshButton}>
              <Ionicons name="refresh" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>
        {lastRefresh && (
          <Text style={styles.lastUpdateText}>Last updated: {lastRefresh}</Text>
        )}
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.compactScrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {drivers.filter(driver => driver.isActive).length > 0 ? (
          <View style={styles.enhancedDriversList}>
            {drivers.filter(driver => driver.isActive).map((driver, index) => (
              <View key={driver.driverId} style={styles.enhancedDriverCard}>
                <View style={styles.driverCardContent}>
                  {/* Driver info section */}
                  <View style={styles.driverInfoSection}>
                    <View style={[
                      styles.statusIndicator,
                      { backgroundColor: driver.isActive ? COLORS.success : COLORS.gray400 }
                    ]} />
                    <View style={styles.driverDetails}>
                      <Text style={styles.driverName} numberOfLines={1}>
                        {driver.driverName}
                      </Text>
                      <Text style={styles.jeepneyNumber} numberOfLines={1}>
                        Jeepney {driver.jeepneyNumber}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Location and status section */}
                  <View style={styles.locationSection}>
                    <View style={styles.locationInfo}>
                      <Ionicons 
                        name="location" 
                        size={12} 
                        color={COLORS.gray600} 
                        style={styles.locationIcon}
                      />
                      <Text style={styles.currentLocation} numberOfLines={1}>
                        {driver.currentLocation}
                      </Text>
                    </View>
                    <View style={styles.statusInfo}>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: driver.isActive ? COLORS.successLight : COLORS.gray100 }
                      ]}>
                        <Text style={[
                          styles.statusText,
                          { color: driver.isActive ? COLORS.success : COLORS.gray600 }
                        ]}>
                          {driver.isActive ? 'ON ROUTE' : 'OFF DUTY'}
                        </Text>
                      </View>
                      <Text style={styles.updateTime}>
                        {driver.lastUpdate}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.enhancedNoData}>
            <View style={styles.noDataIconContainer}>
              <Ionicons name="bus-outline" size={24} color={COLORS.gray400} />
            </View>
            <Text style={styles.noDataTitle}>No Active Jeepneys</Text>
            <Text style={styles.noDataSubtitle}>No drivers are currently on shift for Route {routeId}</Text>
            <TouchableOpacity style={styles.enhancedRetryButton} onPress={onRefresh}>
              <Ionicons name="refresh" size={16} color={COLORS.white} />
              <Text style={styles.enhancedRetryText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: SPACING.md,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // Enhanced header styles
  enhancedHeader: {
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: SPACING.md,
    borderTopRightRadius: SPACING.md,
    padding: SPACING.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  busIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: SPACING.sm,
    borderRadius: SPACING.sm,
    marginRight: SPACING.sm,
  },
  headerText: {
    flex: 1,
  },
  enhancedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 2,
  },
  routeSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: SPACING.sm,
    marginRight: SPACING.sm,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.white,
    marginRight: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
  },
  enhancedRefreshButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: SPACING.sm,
    borderRadius: SPACING.sm,
  },
  lastUpdateText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  // Enhanced scroll container
  scrollContainer: {
    maxHeight: 200,
  },
  compactScrollContent: {
    padding: SPACING.md,
  },
  // Enhanced drivers list
  enhancedDriversList: {
    gap: SPACING.sm,
  },
  enhancedDriverCard: {
    backgroundColor: COLORS.gray50,
    borderRadius: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  driverCardContent: {
    padding: SPACING.md,
  },
  driverInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray800,
    marginBottom: 2,
  },
  jeepneyNumber: {
    fontSize: 12,
    color: COLORS.gray600,
  },
  locationSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.sm,
  },
  locationIcon: {
    marginRight: 4,
  },
  currentLocation: {
    fontSize: 12,
    color: COLORS.gray700,
    flex: 1,
  },
  statusInfo: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: SPACING.sm,
    marginBottom: 2,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  updateTime: {
    fontSize: 10,
    color: COLORS.gray500,
  },
  // Enhanced no data state
  enhancedNoData: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  noDataIconContainer: {
    backgroundColor: COLORS.gray100,
    padding: SPACING.md,
    borderRadius: SPACING.md,
    marginBottom: SPACING.md,
  },
  noDataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray700,
    marginBottom: 4,
  },
  noDataSubtitle: {
    fontSize: 12,
    color: COLORS.gray500,
    marginBottom: SPACING.lg,
  },
  enhancedRetryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: SPACING.sm,
  },
  enhancedRetryText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: SPACING.xs,
  },
});

export default DriverLocationCard;
