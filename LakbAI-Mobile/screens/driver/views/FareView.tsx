import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, ActivityIndicator, RefreshControl } from 'react-native';
import { Route } from 'lucide-react-native';
import { DriverProfile, FareInfo } from '../../../shared/types/driver';
import { FareItem } from '../components';
import { driverStyles, fareStyles, homeStyles } from '../styles';
import { driverFareMatrixService, DriverFareMatrixEntry } from '../../../shared/services/driverFareMatrixService';

interface FareViewProps {
  driverProfile: DriverProfile;
  fareMatrix?: FareInfo[]; // Keep as optional for backward compatibility
}

export const FareView: React.FC<FareViewProps> = ({
  driverProfile,
  fareMatrix: staticFareMatrix
}) => {
  const [dynamicFareMatrix, setDynamicFareMatrix] = useState<FareInfo[]>([]);
  const [totalRoutes, setTotalRoutes] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use dynamic fare matrix if available, otherwise fall back to static
  const fareMatrix = dynamicFareMatrix.length > 0 ? dynamicFareMatrix : (staticFareMatrix || []);

  const fetchFareMatrix = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Get route ID from driver profile
      const routeId = driverFareMatrixService.getRouteIdFromRouteName(driverProfile.route);
      
      if (!routeId) {
        throw new Error('Unable to determine route ID from driver profile');
      }

      console.log('🔄 Fetching fare matrix for driver route:', driverProfile.route, 'Route ID:', routeId);

      const response = await driverFareMatrixService.getFareMatrixForRoute(routeId);
      
      if (response.status === 'success' && response.fare_matrix) {
        // Store total routes count before filtering
        const totalAvailableRoutes = response.fare_matrix.filter(entry => entry.from_checkpoint !== entry.to_checkpoint).length;
        setTotalRoutes(totalAvailableRoutes);
        
        const fareInfo = driverFareMatrixService.convertToFareInfo(response.fare_matrix);
        setDynamicFareMatrix(fareInfo);
        console.log('✅ Driver fare matrix loaded successfully:', fareInfo.length, 'entries');
      } else {
        throw new Error(response.message || 'Failed to fetch fare matrix');
      }
    } catch (error) {
      console.error('❌ Error fetching driver fare matrix:', error);
      setError(error instanceof Error ? error.message : 'Failed to load fare matrix');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFareMatrix();
  }, [driverProfile.route]);

  const handleRefresh = () => {
    fetchFareMatrix(true);
  };
  return (
    <ScrollView 
      style={driverStyles.container} 
      contentContainerStyle={driverStyles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={['#15803D']}
          tintColor="#15803D"
        />
      }
    >
      <Text style={fareStyles.pageTitle}>Fare Matrix</Text>
      
      <View style={fareStyles.fareCard}>
        <View style={fareStyles.fareHeader}>
          <View style={homeStyles.sectionHeader}>
            <Route size={20} color="#15803D" />
            <Text style={[homeStyles.sectionTitle, { color: '#15803D' }]}>{driverProfile.route} Route</Text>
          </View>
          <Text style={fareStyles.fareSubtitle}>
            {dynamicFareMatrix.length > 0 
              ? `Randomized fares from database (${dynamicFareMatrix.length} of ${totalRoutes} routes)` 
              : 'Official fare rates'
            }
          </Text>
        </View>
        
        {isLoading ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#15803D" />
            <Text style={{ marginTop: 10, color: '#666' }}>Loading fare matrix...</Text>
          </View>
        ) : error ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: '#EF4444', textAlign: 'center', marginBottom: 10 }}>
              {error}
            </Text>
            <Text style={{ color: '#666', textAlign: 'center', fontSize: 12 }}>
              Showing static fare data as fallback
            </Text>
          </View>
        ) : (
          <View style={fareStyles.fareList}>
            {fareMatrix.map((fare, index) => (
              <FareItem key={index} fare={fare} />
            ))}
          </View>
        )}
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