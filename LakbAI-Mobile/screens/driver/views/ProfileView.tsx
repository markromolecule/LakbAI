import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { User, Star, Phone, LogOut, RefreshCw, CheckCircle, XCircle } from 'lucide-react-native';
import { DriverProfile } from '../../../shared/types/driver';
import { driverStyles, profileStyles, homeStyles } from '../styles';
import { useLogout } from '../../../shared/utils/authUtils';
import { earningsService } from '../../../shared/services/earningsService';
import { RouteSelector } from '../../../components/driver/RouteSelector';

interface ProfileViewProps {
  driverProfile: DriverProfile;
  isOnDuty: boolean;
  onRefresh: () => void; // Required for automatic refresh
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  driverProfile,
  isOnDuty,
  onRefresh
}) => {
  const { logout } = useLogout();
  const [refreshIndicator, setRefreshIndicator] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [currentRoute, setCurrentRoute] = useState<string>(driverProfile.route);

  // Update current route when driver profile changes
  useEffect(() => {
    setCurrentRoute(driverProfile.route);
  }, [driverProfile.route]);

  // Handle route change
  const handleRouteChange = (newRoute: string) => {
    setCurrentRoute(newRoute);
    // Trigger a refresh to get updated profile data
    onRefresh();
  };

  // Auto-refresh earnings every 5 seconds when profile view is active (database-driven)
  useEffect(() => {
    console.log('👁️ ProfileView mounted - starting database-driven auto-refresh');
    
    // Initial update timestamp
    setLastUpdate(new Date().toLocaleTimeString());
    
    // Set up frequent auto-refresh interval for real-time database sync
    const interval = setInterval(async () => {
      if (driverProfile.id && onRefresh) {
        console.log('🔄 Database auto-refresh - checking for earnings updates...');
        setRefreshIndicator(true);
        
        // Call refresh function to fetch latest from database
        onRefresh();
        
        // Update timestamp
        setLastUpdate(new Date().toLocaleTimeString());
        
        // Hide refresh indicator after 1 second
        setTimeout(() => setRefreshIndicator(false), 1000);
      }
    }, 3000); // Refresh every 3 seconds for faster updates

    // Set up earnings listener for immediate updates (backup system)
    const unsubscribe = earningsService.addListener((driverId) => {
      if (driverProfile.id?.toString() === driverId) {
        console.log('💰 Earnings listener triggered - immediate profile refresh...');
        setRefreshIndicator(true);
        
        // Add small delay to batch rapid updates and ensure smooth UI
        setTimeout(() => {
          if (onRefresh) {
            onRefresh();
          }
          setLastUpdate(new Date().toLocaleTimeString());
          setTimeout(() => setRefreshIndicator(false), 1000);
        }, 100);
      }
    });

    return () => {
      console.log('👁️ ProfileView unmounted - cleaning up database auto-refresh');
      clearInterval(interval);
      unsubscribe();
    };
  }, [driverProfile.id, onRefresh]);

  return (
    <ScrollView 
      style={driverStyles.container} 
      contentContainerStyle={driverStyles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={profileStyles.profileCard}>
        <View style={profileStyles.profileHeader}>
          <View style={profileStyles.avatar}>
            <User size={40} color="white" />
          </View>
          <View style={profileStyles.profileInfo}>
            <Text style={profileStyles.profileName}>{driverProfile.name}</Text>
            <Text style={profileStyles.profileTitle}>Professional Jeepney Driver</Text>
            <View style={profileStyles.ratingRow}>
              {driverProfile.is_verified ? (
                <CheckCircle size={16} color="#16A34A" />
              ) : (
                <XCircle size={16} color="#DC2626" />
              )}
              <Text style={[
                profileStyles.rating, 
                { color: driverProfile.is_verified ? '#16A34A' : '#DC2626' }
              ]}>
                {driverProfile.is_verified ? 'Verified Account' : 'Unverified Account'}
              </Text>
              <Text style={[profileStyles.totalTrips, { color: '#8B5CF6', fontWeight: 'bold' }]}>({driverProfile.totalTrips.toLocaleString()} trips)</Text>
            </View>
          </View>
          {refreshIndicator && (
            <View style={[refreshButtonStyle, { backgroundColor: '#EBF8FF' }]}>
              <RefreshCw 
                size={20} 
                color="#1D4ED8"
                style={{ transform: [{ rotate: '180deg' }] }}
              />
            </View>
          )}
        </View>

        <View style={profileStyles.profileDetails}>
          <View style={profileStyles.profileSection}>
            <Text style={profileStyles.profileSectionTitle}>Driver Information</Text>
        
            <View style={profileStyles.profileRow}>
              <Text style={profileStyles.profileLabel}>License:</Text>
              <Text style={[
                profileStyles.profileValue, 
                { color: driverProfile.drivers_license_verified ? '#16A34A' : '#DC2626', fontWeight: 'bold' }
              ]}>
                {driverProfile.drivers_license_verified ? 'Approved' : 'Not Approved'}
              </Text>
            </View>
            <View style={profileStyles.profileRow}>
              <Text style={profileStyles.profileLabel}>Jeepney #:</Text>
              <Text style={profileStyles.profileValue}>{driverProfile.jeepneyNumber}</Text>
            </View>
            <View style={profileStyles.profileRow}>
              <Text style={profileStyles.profileLabel}>Experience:</Text>
              <Text style={profileStyles.profileValue}>{driverProfile.yearsExperience} years</Text>
            </View>
          </View>

          <View style={profileStyles.profileSection}>
            <Text style={profileStyles.profileSectionTitle}>Performance Stats</Text>
            {/* <View style={profileStyles.profileRow}>
              <Text style={profileStyles.profileLabel}>Today's Trips:</Text>
              <Text style={[profileStyles.profileValue, { color: '#16A34A', fontWeight: 'bold' }]}>{driverProfile.todayTrips}</Text>
            </View>
            <View style={profileStyles.profileRow}>
              <Text style={profileStyles.profileLabel}>Total Trips:</Text>
              <Text style={[profileStyles.profileValue, { color: '#8B5CF6', fontWeight: 'bold' }]}>{driverProfile.totalTrips.toLocaleString()}</Text>
            </View>
            <View style={profileStyles.profileRow}>
              <Text style={profileStyles.profileLabel}>Today's Earnings:</Text>
              <Text style={[profileStyles.profileValue, { color: '#16A34A', fontWeight: 'bold' }]}>₱{driverProfile.todayEarnings.toFixed(2)}</Text>
            </View> */}
            <View style={profileStyles.profileRow}>
              <Text style={profileStyles.profileLabel}>Total Earnings:</Text>
              <Text style={[profileStyles.profileValue, { color: '#1D4ED8', fontWeight: 'bold' }]}>₱{driverProfile.totalEarnings.toFixed(2)}</Text>
            </View>
            {driverProfile.totalTrips > 0 && (
              <View style={profileStyles.profileRow}>
                <Text style={profileStyles.profileLabel}>Avg per Trip:</Text>
                <Text style={[profileStyles.profileValue, { color: '#F59E0B' }]}>₱{(driverProfile.totalEarnings / driverProfile.totalTrips).toFixed(2)}</Text>
              </View>
            )}
            
            <View style={profileStyles.profileRow}>
              <Text style={profileStyles.profileLabel}>Status:</Text>
              <Text style={[profileStyles.profileValue, { color: isOnDuty ? '#16A34A' : '#DC2626', fontWeight: 'bold' }]}>
                {isOnDuty ? 'On Duty' : 'Off Duty'}
              </Text>
            </View>
            {lastUpdate && (
              <View style={profileStyles.profileRow}>
                <Text style={profileStyles.profileLabel}>Last Updated:</Text>
                <Text style={[profileStyles.profileValue, { 
                  color: '#6B7280', 
                  fontSize: 11 }
                  ]
                  }>{lastUpdate}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Route Selector */}
      <RouteSelector
        currentRoute={currentRoute}
        driverId={driverProfile.id}
        onRouteChange={handleRouteChange}
      />

      {/* Quick Stats Card */}
      <View style={profileStyles.quickStatsCard}>
        <View style={profileStyles.quickStatsRow}>
          <View style={profileStyles.quickStatItem}>
            <Text style={[profileStyles.quickStatValue, { color: '#16A34A' }]}>{driverProfile.todayTrips}</Text>
            <Text style={profileStyles.quickStatLabel}>Today's Trips</Text>
          </View>
          <View style={profileStyles.quickStatDivider} />
          <View style={profileStyles.quickStatItem}>
            <Text style={[profileStyles.quickStatValue, { color: '#8B5CF6' }]}>{driverProfile.totalTrips.toLocaleString()}</Text>
            <Text style={profileStyles.quickStatLabel}>Total Trips</Text>
          </View>
          <View style={profileStyles.quickStatDivider} />
          <View style={profileStyles.quickStatItem}>
            <Text style={[profileStyles.quickStatValue, { color: '#1D4ED8' }]}>₱{driverProfile.todayEarnings.toFixed(0)}</Text>
            <Text style={profileStyles.quickStatLabel}>Earnings</Text>
          </View>
        </View>
      </View>

      <View style={profileStyles.contactsCard}>
        <View style={homeStyles.sectionHeader}>
          <Phone size={20} color="#3B82F6" />
          <Text style={homeStyles.sectionTitle}>Emergency Contacts</Text>
        </View>
        <View style={profileStyles.contactRow}>
          <Text style={profileStyles.contactLabel}>Dispatch Center:</Text>
          <Text style={profileStyles.contactNumber}>(046) 123-4567</Text>
        </View>
        <View style={profileStyles.contactRow}>
          <Text style={profileStyles.contactLabel}>Emergency Hotline:</Text>
          <Text style={[profileStyles.contactNumber, { color: '#DC2626' }]}>911</Text>
        </View>
        <View style={profileStyles.contactRow}>
          <Text style={profileStyles.contactLabel}>Road Assistance:</Text>
          <Text style={profileStyles.contactNumber}>(046) 987-6543</Text>
        </View>
      </View>

      <View style={profileStyles.remindersCard}>
        <Text style={profileStyles.remindersTitle}>Reminders:</Text>
        <Text style={profileStyles.reminderItem}>• Update your location regularly</Text>
        <Text style={profileStyles.reminderItem}>• Follow traffic rules and speed limits</Text>
        <Text style={profileStyles.reminderItem}>• Be courteous to all passengers</Text>
        <Text style={profileStyles.reminderItem}>• Report any issues immediately</Text>
      </View>

      {/* Logout Section */}
      <View style={profileStyles.logoutCard}>
        <View style={homeStyles.sectionHeader}>
          <LogOut size={20} color="#DC2626" />
          <Text style={[homeStyles.sectionTitle, { color: '#DC2626' }]}>Account Settings</Text>
        </View>
        <TouchableOpacity 
          style={profileStyles.logoutButton}
          onPress={() => logout()}
          accessibilityLabel="Logout"
          accessibilityHint="Tap to logout from your driver account"
        >
          <View style={profileStyles.logoutContent}>
            <LogOut size={18} color="#DC2626" />
            <Text style={profileStyles.logoutText}>Logout</Text>
          </View>
          <Text style={profileStyles.logoutSubtext}>Sign out of your account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// Add refresh button style
const refreshButtonStyle = {
  position: 'absolute' as const,
  top: 10,
  right: 10,
  padding: 8,
  backgroundColor: '#F3F4F6',
  borderRadius: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
  elevation: 2,
};