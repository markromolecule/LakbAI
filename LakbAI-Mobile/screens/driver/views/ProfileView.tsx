import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { User, Star, Phone } from 'lucide-react-native';
import { DriverProfile } from '../../../shared/types/driver';
import { driverStyles, profileStyles, homeStyles } from '../styles';

interface ProfileViewProps {
  driverProfile: DriverProfile;
  isOnDuty: boolean;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  driverProfile,
  isOnDuty
}) => {
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
    </ScrollView>
  );
};