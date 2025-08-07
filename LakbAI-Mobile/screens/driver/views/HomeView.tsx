import React from 'react';
import { ScrollView, View, TouchableOpacity, Text } from 'react-native';
import { 
  TrendingUp,
  Calculator,
  QrCode,
  User,
  Navigation,
  MapPin
} from 'lucide-react-native';
import { ViewType, DriverProfile, LogItem } from '../../../shared/types/driver';
import { StatCard, ActionCard, StatusCard } from '../components';
import { driverStyles, homeStyles } from '../styles';

interface HomeViewProps {
  driverProfile: DriverProfile;
  isOnDuty: boolean;
  driverLocation: string;
  lastScanTime: string;
  onNavigate: (view: ViewType) => void;
  onToggleDuty: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  driverProfile,
  isOnDuty,
  driverLocation,
  lastScanTime,
  onNavigate,
  onToggleDuty
}) => {
  const statusRows = [
    { label: 'Current Location', value: driverLocation },
    { label: 'Last Update', value: lastScanTime },
    { label: 'Route', value: driverProfile.route },
    { 
      label: 'Status', 
      value: isOnDuty ? 'Active' : 'Inactive',
      valueColor: isOnDuty ? '#16A34A' : '#DC2626'
    }
  ];

  return (
    <ScrollView 
      style={driverStyles.container} 
      contentContainerStyle={driverStyles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={homeStyles.headerCard}>
        <View style={homeStyles.headerTop}>
          <View>
            <Text style={homeStyles.headerTitle}>Good afternoon,</Text>
            <Text style={homeStyles.headerSubtitle}>{driverProfile.name}</Text>
          </View>
          <View style={homeStyles.headerRight}>
            <Text style={homeStyles.jeepneyLabel}>Jeepney</Text>
            <Text style={homeStyles.jeepneyNumber}>{driverProfile.jeepneyNumber}</Text>
          </View>
        </View>
        <View style={homeStyles.statusIndicator}>
          <View style={[homeStyles.statusDot, { backgroundColor: isOnDuty ? '#86EFAC' : '#FCA5A5' }]} />
          <Text style={homeStyles.statusText}>{isOnDuty ? 'On Duty' : 'Off Duty'}</Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={homeStyles.statsGrid}>
        <StatCard
          label="Today's Trips"
          value={driverProfile.todayTrips}
          icon={TrendingUp}
          iconColor="#3B82F6"
        />
        <StatCard
          label="Today's Earnings"
          value={`₱${driverProfile.todayEarnings}`}
          icon={Calculator}
          iconColor="#22C55E"
          valueColor="#16A34A"
        />
      </View>

      {/* Quick Actions */}
      <View style={homeStyles.actionsGrid}>
        <View style={homeStyles.actionCardWrapper}>
          <ActionCard
            title="QR Scanner"
            subtitle="Update location"
            icon={QrCode}
            iconColor="#22C55E"
            borderColor="#BBF7D0"
            onPress={() => onNavigate('scanner')}
          />
        </View>
        <View style={homeStyles.actionCardWrapper}>
          <ActionCard
            title="Fare Matrix"
            subtitle="View fares"
            icon={Calculator}
            iconColor="#3B82F6"
            borderColor="#BFDBFE"
            onPress={() => onNavigate('fare')}
          />
        </View>
        <View style={homeStyles.actionCardWrapper}>
          <ActionCard
            title="My Profile"
            subtitle="Driver details"
            icon={User}
            iconColor="#8B5CF6"
            borderColor="#E9D5FF"
            onPress={() => onNavigate('profile')}
          />
        </View>
        <View style={homeStyles.actionCardWrapper}>
          <ActionCard
            title="Trip Logs"
            subtitle="View history"
            icon={Navigation}
            iconColor="#F97316"
            borderColor="#FED7AA"
            onPress={() => onNavigate('logs')}
          />
        </View>
      </View>

      {/* Current Status */}
      <StatusCard
        title="Current Status"
        icon={MapPin}
        iconColor="#22C55E"
        rows={statusRows}
      />

      {/* Duty Toggle */}
      <TouchableOpacity
        onPress={onToggleDuty}
        style={[
          homeStyles.dutyButton,
          { backgroundColor: isOnDuty ? '#EF4444' : '#22C55E' }
        ]}
      >
        <Text style={homeStyles.dutyButtonText}>
          {isOnDuty ? 'End Shift' : 'Start Shift'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};