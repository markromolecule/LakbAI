import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { Button } from '../../../components/common/Button';
import { ModernLocationSelector } from '../../../components/common/ModernLocationSelector';
import { FareResult } from '../components/fare/FareResult';
import { CHECKPOINTS } from '../../../constants/checkpoints';
import { SPACING } from '../../../shared/styles';
import { globalStyles } from '../../../shared/styles/globalStyles';
import { calculateFare } from '../../../shared/utils/fareCalculator';

export const FareCalculatorScreen: React.FC = () => {
  const [fromLocation, setFromLocation] = useState<string>('');
  const [toLocation, setToLocation] = useState<string>('');
  const [calculatedFare, setCalculatedFare] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleCalculateFare = async () => {
    if (!fromLocation || !toLocation) {
      Alert.alert('Error', 'Please select both pickup and destination points.');
      return;
    }

    if (fromLocation === toLocation) {
      Alert.alert('Error', 'Pickup and destination cannot be the same.');
      return;
    }

    setIsLoading(true);
    try {
      const fare = await calculateFare(fromLocation, toLocation);
      if (fare) {
        setCalculatedFare(fare);
      } else {
        Alert.alert(
          'Route Not Found',
          'Sorry, we couldn\'t find the fare for that route. Please check the fare matrix or contact the driver.'
        );
        setCalculatedFare(null);
      }
    } catch (error) {
      console.error('Error calculating fare:', error);
      Alert.alert(
        'Error',
        'Failed to calculate fare. Please try again or check your connection.'
      );
      setCalculatedFare(null);
    } finally {
      setIsLoading(false);
    }
  };

  const isCalculateDisabled = !fromLocation || !toLocation || fromLocation === toLocation;

  return (
    <ScrollView style={globalStyles.container}>
      <Text style={globalStyles.pageTitle}>Fare Calculator</Text>
      
      <ModernLocationSelector
        label="From"
        selectedLocation={fromLocation}
        onLocationSelect={setFromLocation}
        placeholder="Select pickup point"
        excludeLocation={toLocation}
        isDestination={false}
      />

      <ModernLocationSelector
        label="To"
        selectedLocation={toLocation}
        onLocationSelect={setToLocation}
        placeholder="Select destination"
        excludeLocation={fromLocation}
        pickupLocation={fromLocation}
        isDestination={true}
      />

      <Button
        title={isLoading ? "Calculating..." : "Calculate Fare"}
        onPress={handleCalculateFare}
        disabled={isCalculateDisabled || isLoading}
        style={styles.calculateButton}
      />
      
      {isLoading && (
        <ActivityIndicator 
          size="small" 
          color="#3B82F6" 
          style={styles.loadingIndicator}
        />
      )}

      {calculatedFare && (
        <FareResult
          fare={calculatedFare}
          fromLocation={fromLocation}
          toLocation={toLocation}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  calculateButton: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  loadingIndicator: {
    marginTop: SPACING.sm,
    alignSelf: 'center',
  },
});