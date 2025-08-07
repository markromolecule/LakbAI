import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { Route } from 'lucide-react-native';
import { DriverProfile, FareInfo } from '../../../shared/types/driver';
import { FareItem } from '../components';
import { driverStyles, fareStyles, homeStyles } from '../styles';

interface FareViewProps {
  driverProfile: DriverProfile;
  fareMatrix: FareInfo[];
}

export const FareView: React.FC<FareViewProps> = ({
  driverProfile,
  fareMatrix
}) => {
  return (
    <ScrollView 
      style={driverStyles.container} 
      contentContainerStyle={driverStyles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={fareStyles.pageTitle}>Fare Matrix</Text>
      
      <View style={fareStyles.fareCard}>
        <View style={fareStyles.fareHeader}>
          <View style={homeStyles.sectionHeader}>
            <Route size={20} color="#15803D" />
            <Text style={[homeStyles.sectionTitle, { color: '#15803D' }]}>{driverProfile.route} Route</Text>
          </View>
          <Text style={fareStyles.fareSubtitle}>Official fare rates</Text>
        </View>
        <View style={fareStyles.fareList}>
          {fareMatrix.map((fare, index) => (
            <FareItem key={index} fare={fare} />
          ))}
        </View>
      </View>

      <View style={fareStyles.infoCard}>
        <Text style={fareStyles.infoTitle}>Fare Information:</Text>
        <Text style={fareStyles.infoItem}>• Senior citizens and PWDs get 20% discount</Text>
        <Text style={fareStyles.infoItem}>• Students get 20% discount with valid ID</Text>
        <Text style={fareStyles.infoItem}>• Children below 7 years old ride free</Text>
        <Text style={fareStyles.infoItem}>• Air-conditioned units: +₱2 per fare</Text>
      </View>

      <View style={fareStyles.tipsCard}>
        <Text style={fareStyles.tipsTitle}>Driver Tips:</Text>
        <Text style={fareStyles.tipItem}>• Always ask for student/senior IDs</Text>
        <Text style={fareStyles.tipItem}>• Keep exact change ready</Text>
        <Text style={fareStyles.tipItem}>• Be courteous to all passengers</Text>
        <Text style={fareStyles.tipItem}>• Report fare disputes to dispatch</Text>
      </View>
    </ScrollView>
  );
};