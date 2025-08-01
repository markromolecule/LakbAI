import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { FareItem } from '../../components/fare/FareItem';
import { InfoCard } from '../../components/common/InfoCard';
import { FARE_MATRIX } from '../../constants/fareMatrix';
import { COLORS, SPACING } from '../../shared/styles';
import { globalStyles } from '../../shared/styles/globalStyles';

export const FareMatrixScreen: React.FC = () => {
  const routeInfo = [
    '• Operating hours: 5:00 AM - 10:00 PM',
    '• Average travel time: 45-60 minutes',
    '• Frequency: Every 10-15 minutes',
    '• Air-conditioned jeepneys available'
  ];

  return (
    <ScrollView style={globalStyles.container}>
      <Text style={globalStyles.pageTitle}>Routes & Fare Matrix</Text>
      
      <View style={styles.fareMatrixContainer}>
        <View style={styles.fareMatrixHeader}>
          <Text style={styles.fareMatrixTitle}>Tejero - Pala-pala Route</Text>
          <Text style={styles.fareMatrixSubtitle}>All stops and fares</Text>
        </View>
        
        {FARE_MATRIX.map((fare, index) => (
          <FareItem
            key={`${fare.from}-${fare.to}`}
            fareInfo={fare}
            isLast={index === FARE_MATRIX.length - 1}
          />
        ))}
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
});