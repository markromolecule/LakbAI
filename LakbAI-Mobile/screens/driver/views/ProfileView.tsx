import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { User, Star, Phone, LogOut, RefreshCw } from 'lucide-react-native';
import { DriverProfile } from '../../../shared/types/driver';
import { driverStyles, profileStyles, homeStyles } from '../styles';
import { useLogout } from '../../../shared/utils/authUtils';
import { earningsService } from '../../../shared/services/earningsService';

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
    }, 5000); // Refresh every 5 seconds for real-time feel

    // Set up earnings listener for immediate updates (backup system)
    const unsubscribe = earningsService.addListener((driverId) => {
      if (driverProfile.id?.toString() === driverId) {
        console.log('💰 Earnings listener triggered - immediate profile refresh...');
        setRefreshIndicator(true);
        
        if (onRefresh) {
          onRefresh();
        }
        
        setLastUpdate(new Date().toLocaleTimeString());
        setTimeout(() => setRefreshIndicator(false), 1000);
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
              <Star size={16} color="#EAB308" />
              <Text style={profileStyles.rating}>{driverProfile.rating}/5.0</Text>
              <Text style={profileStyles.totalTrips}>({driverProfile.totalTrips} trips)</Text>
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
              <Text style={profileStyles.profileValue}>{driverProfile.license}</Text>
            </View>
            <View style={profileStyles.profileRow}>
              <Text style={profileStyles.profileLabel}>Jeepney #:</Text>
              <Text style={profileStyles.profileValue}>{driverProfile.jeepneyNumber}</Text>
            </View>
            <View style={profileStyles.profileRow}>
              <Text style={profileStyles.profileLabel}>Route:</Text>
              <Text style={profileStyles.profileValue}>{driverProfile.route}</Text>
            </View>
            <View style={profileStyles.profileRow}>
              <Text style={profileStyles.profileLabel}>Experience:</Text>
              <Text style={profileStyles.profileValue}>{driverProfile.yearsExperience} years</Text>
            </View>
          </View>

          <View style={profileStyles.profileSection}>
            <Text style={profileStyles.profileSectionTitle}>Performance Stats</Text>
            <View style={profileStyles.profileRow}>
              <Text style={profileStyles.profileLabel}>Total Trips:</Text>
              <Text style={profileStyles.profileValue}>{driverProfile.totalTrips.toLocaleString()}</Text>
            </View>
            <View style={profileStyles.profileRow}>
              <Text style={profileStyles.profileLabel}>Today's Trips:</Text>
              <Text style={profileStyles.profileValue}>{driverProfile.todayTrips}</Text>
            </View>
            <View style={profileStyles.profileRow}>
              <Text style={profileStyles.profileLabel}>Today's Earnings:</Text>
              <Text style={[profileStyles.profileValue, { color: '#16A34A' }]}>₱{driverProfile.todayEarnings}</Text>
            </View>
            <View style={profileStyles.profileRow}>
              <Text style={profileStyles.profileLabel}>Total Earnings:</Text>
              <Text style={[profileStyles.profileValue, { color: '#1D4ED8', fontWeight: 'bold' }]}>₱{driverProfile.totalEarnings}</Text>
            </View>
            {lastUpdate && (
              <View style={profileStyles.profileRow}>
                <Text style={profileStyles.profileLabel}>Last Updated:</Text>
                <Text style={[profileStyles.profileValue, { color: '#6B7280', fontSize: 12 }]}>{lastUpdate}</Text>
              </View>
            )}
            <View style={profileStyles.profileRow}>
              <Text style={profileStyles.profileLabel}>Status:</Text>
              <Text style={[profileStyles.profileValue, { color: isOnDuty ? '#16A34A' : '#DC2626' }]}>
                {isOnDuty ? 'On Duty' : 'Off Duty'}
              </Text>
            </View>
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