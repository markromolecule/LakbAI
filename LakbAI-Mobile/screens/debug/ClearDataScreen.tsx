/**
 * Clear Data Screen - Debug Screen
 * 
 * This screen provides debugging tools for clearing local data.
 * Add this to your app's navigation for development builds.
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  Alert,
  TouchableOpacity 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import ClearTripDataButton from '../../components/debug/ClearTripDataButton';
import NotificationTestButton from '../../components/debug/NotificationTestButton';
import LocationNotificationTest from '../../components/debug/LocationNotificationTest';
import TripNotificationTest from '../../components/debug/TripNotificationTest';
import TripCompletionTest from '../../components/debug/TripCompletionTest';
import { ClearPassengerTrip } from '../../components/debug/ClearPassengerTrip';

interface StorageData {
  key: string;
  value: any;
  size: number;
}

export const ClearDataScreen: React.FC = () => {
  const [storageData, setStorageData] = useState<StorageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadStorageData = async () => {
    try {
      setIsLoading(true);
      const allKeys = await AsyncStorage.getAllKeys();
      const tripKeys = allKeys.filter(key => 
        key.toLowerCase().includes('trip') || 
        key.toLowerCase().includes('active') ||
        key.toLowerCase().includes('driver') ||
        key.toLowerCase().includes('route') ||
        key.toLowerCase().includes('auth') ||
        key.toLowerCase().includes('user')
      );

      const data: StorageData[] = [];
      
      for (const key of tripKeys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            const parsed = JSON.parse(value);
            data.push({
              key,
              value: parsed,
              size: value.length
            });
          }
        } catch (error) {
          data.push({
            key,
            value: 'Error parsing',
            size: 0
          });
        }
      }
      
      setStorageData(data);
    } catch (error) {
      console.error('Error loading storage data:', error);
      Alert.alert('Error', 'Failed to load storage data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStorageData();
  }, []);

  const clearAllData = async () => {
    Alert.alert(
      'Clear All Data',
      'This will clear ALL local data including authentication, trips, and settings. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Success', 'All data cleared successfully');
              loadStorageData();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear all data');
            }
          }
        }
      ]
    );
  };

  const clearSpecificKey = async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
      Alert.alert('Success', `Cleared key: ${key}`);
      loadStorageData();
    } catch (error) {
      Alert.alert('Error', `Failed to clear key: ${key}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Debug: Clear Data</Text>
        <Text style={styles.subtitle}>Clear local storage data</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <ClearTripDataButton 
          onDataCleared={loadStorageData}
          style={styles.actionButton}
        />
        
        <NotificationTestButton style={styles.actionButton} />
        
        <LocationNotificationTest style={styles.actionButton} />
        
        <TripNotificationTest />
        
        <TripCompletionTest />
        
        <ClearPassengerTrip passengerId={21} style={styles.actionButton} />
        
        <TouchableOpacity style={styles.clearAllButton} onPress={clearAllData}>
          <Ionicons name="nuclear-outline" size={20} color="#ff4444" />
          <Text style={styles.clearAllButtonText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Storage Data</Text>
          <TouchableOpacity onPress={loadStorageData} style={styles.refreshButton}>
            <Ionicons name="refresh" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
        
        {isLoading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : storageData.length === 0 ? (
          <Text style={styles.emptyText}>No relevant data found</Text>
        ) : (
          storageData.map((item, index) => (
            <View key={index} style={styles.dataItem}>
              <View style={styles.dataHeader}>
                <Text style={styles.dataKey}>{item.key}</Text>
                <TouchableOpacity 
                  onPress={() => clearSpecificKey(item.key)}
                  style={styles.removeButton}
                >
                  <Ionicons name="close-circle" size={20} color="#ff4444" />
                </TouchableOpacity>
              </View>
              <Text style={styles.dataSize}>Size: {item.size} bytes</Text>
              <Text style={styles.dataValue} numberOfLines={3}>
                {typeof item.value === 'object' 
                  ? JSON.stringify(item.value, null, 2)
                  : String(item.value)
                }
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  refreshButton: {
    padding: 8,
  },
  actionButton: {
    marginBottom: 12,
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  clearAllButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#ff4444',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  dataItem: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  dataHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dataKey: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  dataSize: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dataValue: {
    fontSize: 12,
    color: '#444',
    fontFamily: 'monospace',
  },
});

export default ClearDataScreen;
