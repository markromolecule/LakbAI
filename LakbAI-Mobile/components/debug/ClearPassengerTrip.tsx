import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../shared/styles';

interface ClearPassengerTripProps {
  passengerId?: number;
  style?: any;
}

export const ClearPassengerTrip: React.FC<ClearPassengerTripProps> = ({ 
  passengerId = 21, 
  style 
}) => {
  const [isClearing, setIsClearing] = useState(false);
  const [result, setResult] = useState<string>('');

  const clearPassengerLocalTrip = async () => {
    setIsClearing(true);
    setResult('');

    try {
      console.log(`🧹 Clearing local trip data for passenger ID ${passengerId}...`);
      
      // Keys to clear for trip data
      const TRIP_KEYS = [
        'active_trip',
        'selected_route', 
        'trip_notifications',
        'driver_location',
        'trip_completion_event',
        'passenger_trip_data',
        'current_trip_status',
        'trip_booking_data'
      ];

      // Keys to clear for passenger-specific data
      const PASSENGER_KEYS = [
        `passenger_${passengerId}_trip`,
        `passenger_${passengerId}_notifications`,
        `passenger_${passengerId}_location`,
        `passenger_${passengerId}_data`
      ];

      // All keys to clear
      const ALL_KEYS_TO_CLEAR = [...TRIP_KEYS, ...PASSENGER_KEYS];

      // Get all keys first to see what exists
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('📊 Current AsyncStorage keys:', allKeys);
      
      // Clear specific trip-related keys
      let clearedCount = 0;
      for (const key of ALL_KEYS_TO_CLEAR) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value !== null) {
            await AsyncStorage.removeItem(key);
            console.log(`✅ Cleared: ${key}`);
            clearedCount++;
          }
        } catch (error) {
          console.log(`❌ Error clearing ${key}:`, error);
        }
      }
      
      // Also clear any keys that might contain the passenger ID
      const passengerRelatedKeys = allKeys.filter(key => 
        key.includes(passengerId.toString()) || 
        key.includes('passenger') ||
        key.includes('trip') ||
        key.includes('booking')
      );
      
      console.log(`🔍 Found ${passengerRelatedKeys.length} passenger-related keys:`);
      for (const key of passengerRelatedKeys) {
        try {
          const value = await AsyncStorage.getItem(key);
          console.log(`  - ${key}: ${value ? 'Has data' : 'Empty'}`);
          
          if (value) {
            await AsyncStorage.removeItem(key);
            console.log(`    ✅ Cleared: ${key}`);
            clearedCount++;
          }
        } catch (error) {
          console.log(`    ❌ Error clearing ${key}:`, error);
        }
      }
      
      // Verify cleanup
      const remainingKeys = await AsyncStorage.getAllKeys();
      const remainingTripKeys = remainingKeys.filter(key => 
        key.includes('trip') || 
        key.includes('passenger') || 
        key.includes('booking')
      );
      
      const successMessage = `✅ Successfully cleared ${clearedCount} local storage items for passenger ID ${passengerId}\nRemaining trip-related keys: ${remainingTripKeys.length}`;
      
      setResult(successMessage);
      console.log(successMessage);
      
      Alert.alert(
        'Trip Data Cleared',
        `Successfully cleared ${clearedCount} local storage items for passenger ID ${passengerId}`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      const errorMessage = `❌ Error clearing passenger local trip data: ${error}`;
      setResult(errorMessage);
      console.error(errorMessage);
      
      Alert.alert(
        'Error',
        `Failed to clear trip data: ${error}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Clear Passenger Trip Data</Text>
      <Text style={styles.subtitle}>Passenger ID: {passengerId}</Text>
      
      <TouchableOpacity
        style={[styles.button, isClearing && styles.buttonDisabled]}
        onPress={clearPassengerLocalTrip}
        disabled={isClearing}
      >
        {isClearing ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.buttonText}>Clear Local Trip Data</Text>
        )}
      </TouchableOpacity>
      
      {result ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: COLORS.gray800,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray600,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#ff4444',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: COLORS.gray400,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    backgroundColor: COLORS.gray100,
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  resultText: {
    fontSize: 12,
    color: COLORS.gray700,
    fontFamily: 'monospace',
  },
});
