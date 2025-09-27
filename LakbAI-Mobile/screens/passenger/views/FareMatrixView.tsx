import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { FareItem } from '../components/fare/FareItem';
import { InfoCard } from '../../../components/common/InfoCard';
import { FARE_MATRIX } from '../../../constants/fareMatrix';
import { COLORS, SPACING } from '../../../shared/styles';
import { globalStyles } from '../../../shared/styles/globalStyles';
import { fareMatrixService, FareMatrixEntry } from '../../../shared/services/fareMatrixService';

export const FareMatrixScreen: React.FC = () => {
  const [fareMatrixData, setFareMatrixData] = useState<FareMatrixEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const routeInfo = [
    '• Operating hours: 5:00 AM - 10:00 PM',
    '• Average travel time: 45-60 minutes',
    '• Frequency: Every 10-15 minutes',
    '• Air-conditioned jeepneys available'
  ];

  const fetchFareMatrix = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Fetching fare matrix from API...');
      
      // Fetch fare matrix for route 1 (Tejero - Pala-pala route)
      // Filter for sequential routes (adjacent checkpoints)
      const result = await fareMatrixService.getFareMatrixForRoute(1);
      
      console.log('📊 API Response:', result);
      
      if (result.status === 'success' && result.fare_matrix && result.fare_matrix.length > 0) {
        console.log('📊 Raw fare_matrix length:', result.fare_matrix.length);
        
        // Filter for sequential routes (each checkpoint to the next one)
        const sequentialRoutes = result.fare_matrix.filter(fare => fare.from_checkpoint_id === fare.to_checkpoint_id - 1);
        console.log('📍 Sequential routes found:', sequentialRoutes.length);
        
        // Randomize and limit to 10 entries
        const shuffledFares = [...sequentialRoutes].sort(() => Math.random() - 0.5);
        const limitedFares = shuffledFares.slice(0, 10);
        
        console.log('✅ Successfully loaded', limitedFares.length, 'randomized sequential fare entries');
        console.log('📋 Sample fare entries:', limitedFares.slice(0, 3));
        setFareMatrixData(limitedFares);
      } else {
        // Fallback to static data if API fails
        console.warn('❌ API failed, using static data:', result.message);
        setFareMatrixData([]);
        setError('Unable to load dynamic fare data. Showing limited information.');
      }
    } catch (error) {
      console.error('💥 Error fetching fare matrix:', error);
      setError('Failed to load fare data. Please check your connection.');
      setFareMatrixData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    console.log('🔄 Refreshing fare matrix with new randomization...');
    await fetchFareMatrix();
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchFareMatrix();
  }, []);

  const renderFareItems = () => {
    if (fareMatrixData.length > 0) {
      return fareMatrixData.map((fare, index) => (
        <FareItem
          key={`fare-${fare.id}-${index}`}
          fareInfo={{
            from: fare.from_checkpoint,
            to: fare.to_checkpoint,
            fare: parseFloat(fare.fare_amount.toString())
          }}
          isLast={index === fareMatrixData.length - 1}
        />
      ));
    } else {
      // Fallback to static data
      return FARE_MATRIX.slice(0, 10).map((fare, index) => (
        <FareItem
          key={`${fare.from}-${fare.to}`}
          fareInfo={fare}
          isLast={index === 9}
        />
      ));
    }
  };

  return (
    <ScrollView 
      style={globalStyles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={['#3B82F6']}
          tintColor="#3B82F6"
        />
      }
    >
      <Text style={globalStyles.pageTitle}>Routes & Fare Matrix</Text>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <View style={styles.fareMatrixContainer}>
        <View style={styles.fareMatrixHeader}>
          <Text style={styles.fareMatrixTitle}>Vice-versa Routes</Text>
          <Text style={styles.fareMatrixSubtitle}>
            {fareMatrixData.length > 0 ? 'Checkpoint Fares' : 'Sample fares (limited)'}
          </Text>
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading fare data...</Text>
          </View>
        ) : (
          renderFareItems()
        )}
      </View>

      <InfoCard
        title="Route Information:"
        items={routeInfo}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  fareMatrixContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SPACING.md,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fareMatrixHeader: {
    backgroundColor: COLORS.blue50,
    padding: SPACING.lg,
    borderTopLeftRadius: SPACING.md,
    borderTopRightRadius: SPACING.md,
  },
  fareMatrixTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.blue800,
  },
  fareMatrixSubtitle: {
    fontSize: 14,
    color: COLORS.blue600,
  },
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: 14,
    color: COLORS.gray600,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: SPACING.sm,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
});