import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { Button } from '../../components/common/Button';
import { LocationPicker } from '../../components/common/LocationPicker';
import { FareResult } from '../../components/fare/FareResult';
import { CHECKPOINTS } from '../../constants/checkpoints';
import { SPACING } from '../../shared/styles';
import { globalStyles } from '../../shared/styles/globalStyles';
import { calculateFare } from '../../shared/utils/fareCalculator';

export const FareCalculatorScreen: React.FC = () => {
  const [fromLocation, setFromLocation] = useState<string>('');
  const [toLocation, setToLocation] = useState<string>('');
  const [calculatedFare, setCalculatedFare] = useState<number | null>(null);

  const handleCalculateFare = () => {
    if (!fromLocation || !toLocation) {
      Alert.alert('Error', 'Please select both pickup and destination points.');
      return;
    }

    if (fromLocation === toLocation) {
      Alert.alert('Error', 'Pickup and destination cannot be the same.');
      return;
    }

    const fare = calculateFare(fromLocation, toLocation);
    if (fare) {
      setCalculatedFare(fare);
    } else {
      Alert.alert(
        'Route Not Found',
        'Sorry, we couldn\'t find the fare for that route. Please check the fare matrix or contact the driver.'
      );
      setCalculatedFare(null);
    }
  };

  const isCalculateDisabled = !fromLocation || !toLocation || fromLocation === toLocation;

  return (
    <ScrollView style={globalStyles.container}>
      <Text style={globalStyles.pageTitle}>Fare Calculator</Text>
      
      <LocationPicker
        label="From:"
        selectedLocation={fromLocation}
        onLocationSelect={setFromLocation}
        locations={CHECKPOINTS} 
        placeholder="Select pickup point"
      />

      <LocationPicker
        label="To:"
        selectedLocation={toLocation}
        onLocationSelect={setToLocation}
        locations={CHECKPOINTS}
        placeholder="Select destination"
      />

      <Button
        title="Calculate Fare"
        onPress={handleCalculateFare}
        disabled={isCalculateDisabled}
        style={styles.calculateButton}
      />

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
});