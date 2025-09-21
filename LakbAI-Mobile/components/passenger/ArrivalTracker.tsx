import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, RefreshControl, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../common';
import { COLORS, SPACING } from '../../shared/styles';
import { getBaseUrl } from '../../config/apiConfig';

interface Driver {
  driver_id: number;
  first_name: string;
  last_name: string;
  jeepney_number: string;
  current_checkpoint_name: string;
  next_checkpoint_eta: string;
  passenger_count: number;
  status: string;
  last_scan_timestamp: string;
  minutes_since_update: number;
  real_time_status: 'live' | 'recent' | 'stale';
  status_color: string;
  last_update_formatted: string;
}

interface ArrivalTrackerProps {
  routeId: number;
  selectedCheckpoint?: string;
  showSubscribeButton?: boolean;
  onSubscribe?: () => void;
}

export const ArrivalTracker: React.FC<ArrivalTrackerProps> = ({
  routeId,
  selectedCheckpoint,
  showSubscribeButton = false,
  onSubscribe
}) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    if (routeId) {
      fetchDriverLocations();
      // Set up auto-refresh every 30 seconds
      const interval = setInterval(fetchDriverLocations, 30000);
      return () => clearInterval(interval);
    }
  }, [routeId]);

  const fetchDriverLocations = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/mobile/passenger/real-time-drivers/${routeId}`);
      const data = await response.json();

      if (data.status === 'success') {
        setDrivers(data.drivers || []);
        setLastUpdated(new Date().toLocaleTimeString());
      } else {
        console.error('Failed to fetch driver locations:', data.message);
      }
    } catch (error) {
      console.error('Error fetching driver locations:', error);
      Alert.alert('Error', 'Failed to load arrival information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchDriverLocations(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return 'radio-button-on';
      case 'recent':
        return 'time';
      case 'stale':
        return 'warning';
      default:
        return 'help-circle';
    }
  };

  const getStatusText = (driver: Driver) => {
    if (driver.real_time_status === 'live') {
      return 'Live';
    } else if (driver.real_time_status === 'recent') {
      return `${driver.minutes_since_update}m ago`;
    } else {
      return 'May be offline';
    }
  };

  const formatETA = (eta: string) => {
    // Convert "5-7 mins" to more readable format
    if (eta && eta.includes('mins')) {
      return eta.replace('mins', 'minutes');
    }
    return eta || 'Unknown';
  };

  const isNearSelectedCheckpoint = (driver: Driver) => {
    if (!selectedCheckpoint) return true;
    return driver.current_checkpoint_name?.toLowerCase().includes(selectedCheckpoint.toLowerCase()) ||
           selectedCheckpoint.toLowerCase().includes(driver.current_checkpoint_name?.toLowerCase() || '');
  };

  const filteredDrivers = drivers.filter(isNearSelectedCheckpoint);

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="location" size={24} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Next Jeepney Arrivals</Text>
        </View>
        <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
          <Ionicons 
            name="refresh" 
            size={24} 
            color={refreshing ? COLORS.gray : COLORS.primary} 
          />
        </TouchableOpacity>
      </View>

      {/* Last Updated */}
      {lastUpdated && (
        <Text style={styles.lastUpdated}>
          Last updated: {lastUpdated}
        </Text>
      )}

      {/* Subscribe Button */}
      {showSubscribeButton && onSubscribe && (
        <TouchableOpacity style={styles.subscribeButton} onPress={onSubscribe}>
          <Ionicons name="notifications" size={20} color={COLORS.white} />
          <Text style={styles.subscribeText}>Get Arrival Notifications</Text>
        </TouchableOpacity>
      )}

      {/* Driver List */}
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        style={styles.scrollView}
      >
        {loading && drivers.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading arrival information...</Text>
          </View>
        ) : filteredDrivers.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContainer}>
              <Ionicons name="car-sport" size={48} color={COLORS.gray} />
              <Text style={styles.emptyTitle}>No Active Jeepneys</Text>
              <Text style={styles.emptySubtitle}>
                {selectedCheckpoint 
                  ? `No jeepneys found near ${selectedCheckpoint}` 
                  : 'No jeepneys are currently active on this route'
                }
              </Text>
              <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ) : (
          filteredDrivers.map((driver) => (
            <Card key={driver.driver_id} style={styles.driverCard}>
              <View style={styles.driverHeader}>
                <View style={styles.driverInfo}>
                  <Text style={styles.jeepneyNumber}>{driver.jeepney_number}</Text>
                  <Text style={styles.driverName}>
                    {driver.first_name} {driver.last_name}
                  </Text>
                </View>
                <View style={styles.statusContainer}>
                  <View style={[styles.statusDot, { backgroundColor: driver.status_color }]} />
                  <Text style={[styles.statusText, { color: driver.status_color }]}>
                    {getStatusText(driver)}
                  </Text>
                </View>
              </View>

              <View style={styles.locationContainer}>
                <Ionicons name="location" size={16} color={COLORS.primary} />
                <Text style={styles.currentLocation}>
                  Currently at: {driver.current_checkpoint_name || 'Unknown location'}
                </Text>
              </View>

              <View style={styles.etaContainer}>
                <Ionicons name="time" size={20} color={COLORS.success} />
                <Text style={styles.etaText}>
                  Next checkpoint: {formatETA(driver.next_checkpoint_eta)}
                </Text>
              </View>

              {driver.passenger_count !== undefined && (
                <View style={styles.passengerInfo}>
                  <Ionicons name="people" size={16} color={COLORS.gray} />
                  <Text style={styles.passengerCount}>
                    {driver.passenger_count} passengers
                  </Text>
                </View>
              )}

              <View style={styles.lastUpdateContainer}>
                <Ionicons 
                  name={getStatusIcon(driver.real_time_status)} 
                  size={14} 
                  color={COLORS.gray} 
                />
                <Text style={styles.lastUpdateText}>
                  Last update: {driver.last_update_formatted}
                </Text>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = {
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.dark,
    marginLeft: SPACING.sm,
  },
  lastUpdated: {
    textAlign: 'center' as const,
    fontSize: 12,
    color: COLORS.gray,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.lightGray,
  },
  subscribeButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    borderRadius: 8,
  },
  subscribeText: {
    color: COLORS.white,
    fontWeight: '600' as const,
    marginLeft: SPACING.xs,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: 'center' as const,
  },
  loadingText: {
    color: COLORS.gray,
    fontSize: 16,
  },
  emptyCard: {
    margin: SPACING.md,
  },
  emptyContainer: {
    alignItems: 'center' as const,
    paddingVertical: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.dark,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center' as const,
    marginTop: SPACING.xs,
    marginHorizontal: SPACING.md,
  },
  refreshButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 6,
    marginTop: SPACING.md,
  },
  refreshButtonText: {
    color: COLORS.white,
    fontWeight: '600' as const,
  },
  driverCard: {
    margin: SPACING.md,
    marginBottom: SPACING.sm,
  },
  driverHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: SPACING.sm,
  },
  driverInfo: {
    flex: 1,
  },
  jeepneyNumber: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.primary,
  },
  driverName: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  locationContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: SPACING.sm,
  },
  currentLocation: {
    fontSize: 14,
    color: COLORS.dark,
    marginLeft: SPACING.xs,
    flex: 1,
  },
  etaContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: COLORS.success + '10',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
    marginBottom: SPACING.sm,
  },
  etaText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.success,
    marginLeft: SPACING.xs,
  },
  passengerInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: SPACING.xs,
  },
  passengerCount: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: SPACING.xs,
  },
  lastUpdateContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  lastUpdateText: {
    fontSize: 11,
    color: COLORS.gray,
    marginLeft: SPACING.xs,
  },
};

export default ArrivalTracker;
