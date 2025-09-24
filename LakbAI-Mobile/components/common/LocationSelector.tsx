import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../shared/styles';
import { CHECKPOINTS } from '../../constants/checkpoints';

interface LocationSelectorProps {
  label: string;
  selectedLocation: string;
  onLocationSelect: (location: string) => void;
  placeholder: string;
  disabled?: boolean;
  excludeLocation?: string; // To exclude the other selected location
  pickupLocation?: string; // For adaptive destination filtering
  isDestination?: boolean; // Whether this is the destination selector
}

// Route sequences for adaptive filtering
const ROUTE_SEQUENCES = {
  route1: [
    'SM Epza', 'Robinson Tejero', 'Malabon', 'Riverside', 'Lancaster New City',
    'Pasong Camachile I', 'Open Canal', 'Santiago', 'Bella Vista', 'San Francisco',
    'Country Meadow', 'Pabahay', 'Monterey', 'Langkaan', 'Tierra Vista',
    'Robinson Dasmariñas', 'SM Dasmariñas'
  ],
  route2: [
    'SM Dasmariñas', 'Robinson Dasmariñas', 'Tierra Vista', 'Langkaan', 'Monterey',
    'Pabahay', 'Country Meadow', 'San Francisco', 'Bella Vista', 'Santiago',
    'Open Canal', 'Pasong Camachile I', 'Lancaster New City', 'Riverside', 'Malabon',
    'Robinson Tejero', 'SM Epza'
  ]
};

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  label,
  selectedLocation,
  onLocationSelect,
  placeholder,
  disabled = false,
  excludeLocation,
  pickupLocation,
  isDestination = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Determine which route sequence to use based on pickup location
  const getRouteSequence = (pickup: string) => {
    if (pickup === 'SM Epza' || ROUTE_SEQUENCES.route1.includes(pickup)) {
      return ROUTE_SEQUENCES.route1;
    } else if (pickup === 'SM Dasmariñas' || ROUTE_SEQUENCES.route2.includes(pickup)) {
      return ROUTE_SEQUENCES.route2;
    }
    return ROUTE_SEQUENCES.route1; // Default to route 1
  };

  // Get available destinations based on pickup location
  const getAvailableDestinations = (pickup: string) => {
    if (!pickup || !isDestination) return CHECKPOINTS;
    
    const routeSequence = getRouteSequence(pickup);
    const pickupIndex = routeSequence.indexOf(pickup);
    
    if (pickupIndex === -1) return CHECKPOINTS; // If pickup not found in sequence, show all
    
    // Return only locations that come after the pickup location in the route sequence
    return routeSequence.slice(pickupIndex + 1);
  };

  // Filter locations based on search text, exclude specified location, and adaptive filtering
  const filteredLocations = useMemo(() => {
    let availableLocations = CHECKPOINTS;
    
    // Apply adaptive filtering for destination selector
    if (isDestination && pickupLocation) {
      availableLocations = getAvailableDestinations(pickupLocation);
    }
    
    return availableLocations.filter(location => {
      const matchesSearch = location.toLowerCase().includes(searchText.toLowerCase());
      const notExcluded = excludeLocation ? location !== excludeLocation : true;
      return matchesSearch && notExcluded;
    });
  }, [searchText, excludeLocation, pickupLocation, isDestination]);

  const handleLocationSelect = (location: string) => {
    onLocationSelect(location);
    setModalVisible(false);
    setSearchText('');
  };

  const openModal = () => {
    if (!disabled) {
      setModalVisible(true);
    }
  };

  // Get route info for display
  const getRouteInfo = () => {
    if (!pickupLocation || !isDestination) return null;
    
    const routeSequence = getRouteSequence(pickupLocation);
    const pickupIndex = routeSequence.indexOf(pickupLocation);
    
    if (pickupIndex === -1) return null;
    
    const availableCount = routeSequence.length - pickupIndex - 1;
    const routeName = pickupLocation === 'SM Epza' ? 'Route 1' : 'Route 2';
    
    return {
      routeName,
      availableCount,
      nextStops: routeSequence.slice(pickupIndex + 1, pickupIndex + 4) // Show next 3 stops
    };
  };

  const routeInfo = getRouteInfo();

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        {routeInfo && (
          <View style={styles.routeInfoBadge}>
            <Ionicons name="bus" size={12} color={COLORS.primary} />
            <Text style={styles.routeInfoText}>
              {routeInfo.routeName} • {routeInfo.availableCount} stops ahead
            </Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity
        style={[
          styles.selector,
          disabled && styles.disabledSelector,
          selectedLocation && styles.selectedSelector,
          isDestination && pickupLocation && styles.adaptiveSelector,
        ]}
        onPress={openModal}
        disabled={disabled}
      >
        <View style={styles.selectorContent}>
          <Ionicons
            name={isDestination ? "flag" : "location"}
            size={18}
            color={selectedLocation ? COLORS.primary : COLORS.gray500}
            style={styles.selectorIcon}
          />
          <Text
            style={[
              styles.selectorText,
              !selectedLocation && styles.placeholderText,
              disabled && styles.disabledText,
            ]}
          >
            {selectedLocation || placeholder}
          </Text>
        </View>
        <Ionicons
          name="chevron-down"
          size={20}
          color={disabled ? COLORS.gray400 : COLORS.gray500}
        />
      </TouchableOpacity>
      
      {routeInfo && routeInfo.nextStops.length > 0 && (
        <View style={styles.nextStopsContainer}>
          <Text style={styles.nextStopsLabel}>Next stops:</Text>
          <View style={styles.nextStopsList}>
            {routeInfo.nextStops.map((stop, index) => (
              <View key={stop} style={styles.nextStopItem}>
                <Text style={styles.nextStopText}>{stop}</Text>
                {index < routeInfo.nextStops.length - 1 && (
                  <Ionicons name="arrow-forward" size={12} color={COLORS.gray400} />
                )}
              </View>
            ))}
            {routeInfo.availableCount > 3 && (
              <Text style={styles.moreStopsText}>+{routeInfo.availableCount - 3} more</Text>
            )}
          </View>
        </View>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <View style={styles.modalTitleContainer}>
                <Ionicons 
                  name={isDestination ? "flag" : "location"} 
                  size={20} 
                  color={COLORS.primary} 
                />
                <Text style={styles.modalTitle}>
                  {isDestination ? 'Select Destination' : 'Select Pickup Location'}
                </Text>
              </View>
              {routeInfo && (
                <View style={styles.modalRouteInfo}>
                  <Text style={styles.modalRouteText}>
                    {routeInfo.routeName} • {routeInfo.availableCount} stops available
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={COLORS.gray800} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color={COLORS.gray500}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={isDestination ? "Search destinations..." : "Search pickup locations..."}
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor={COLORS.gray500}
            />
          </View>

          <ScrollView style={styles.locationsList}>
            {filteredLocations.length > 0 ? (
              filteredLocations.map((location, index) => {
                const isSelected = selectedLocation === location;
                const isRecommended = isDestination && routeInfo && 
                  routeInfo.nextStops.includes(location);
                
                return (
                  <TouchableOpacity
                    key={location}
                    style={[
                      styles.locationItem,
                      isSelected && styles.selectedLocationItem,
                      isRecommended && styles.recommendedLocationItem,
                      index === filteredLocations.length - 1 && styles.lastLocationItem,
                    ]}
                    onPress={() => handleLocationSelect(location)}
                  >
                    <View style={styles.locationItemContent}>
                      <Ionicons
                        name={isDestination ? "flag" : "location"}
                        size={20}
                        color={isSelected ? COLORS.primary : COLORS.gray600}
                        style={styles.locationIcon}
                      />
                      <View style={styles.locationTextContainer}>
                        <Text style={[
                          styles.locationText,
                          isSelected && styles.selectedLocationText
                        ]}>
                          {location}
                        </Text>
                        {isRecommended && (
                          <Text style={styles.recommendedText}>Recommended</Text>
                        )}
                      </View>
                    </View>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={COLORS.primary}
                        style={styles.checkIcon}
                      />
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.noResultsContainer}>
                <Ionicons name="location-outline" size={48} color={COLORS.gray400} />
                <Text style={styles.noResultsText}>No locations found</Text>
                <Text style={styles.noResultsSubtext}>
                  {isDestination ? 'Try selecting a different pickup location' : 'Try a different search term'}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray800,
    marginBottom: SPACING.xs,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: 12,
    minHeight: 52,
  },
  selectedSelector: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '08',
  },
  disabledSelector: {
    backgroundColor: COLORS.gray100,
    borderColor: COLORS.gray300,
    opacity: 0.6,
  },
  selectorText: {
    fontSize: 16,
    color: COLORS.gray800,
    flex: 1,
  },
  placeholderText: {
    color: COLORS.gray500,
  },
  disabledText: {
    color: COLORS.gray400,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.gray100,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray800,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray300,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.gray800,
  },
  locationsList: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  lastLocationItem: {
    borderBottomWidth: 0,
  },
  locationIcon: {
    marginRight: SPACING.md,
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.gray800,
  },
  checkIcon: {
    marginLeft: SPACING.sm,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  noResultsText: {
    fontSize: 16,
    color: COLORS.gray500,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: COLORS.gray400,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  // New styles for improved UI
  labelContainer: {
    marginBottom: SPACING.xs,
  },
  routeInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: SPACING.sm,
    marginTop: SPACING.xs,
    alignSelf: 'flex-start',
  },
  routeInfoText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
    marginLeft: SPACING.xs,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectorIcon: {
    marginRight: SPACING.sm,
  },
  adaptiveSelector: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.success + '08',
  },
  nextStopsContainer: {
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.gray50,
    borderRadius: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  nextStopsLabel: {
    fontSize: 12,
    color: COLORS.gray600,
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  nextStopsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  nextStopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  nextStopText: {
    fontSize: 12,
    color: COLORS.gray700,
    fontWeight: '500',
  },
  moreStopsText: {
    fontSize: 12,
    color: COLORS.gray500,
    fontStyle: 'italic',
  },
  // Modal improvements
  modalHeaderContent: {
    flex: 1,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalRouteInfo: {
    marginTop: SPACING.xs,
  },
  modalRouteText: {
    fontSize: 12,
    color: COLORS.gray600,
    fontWeight: '500',
  },
  // Location item improvements
  selectedLocationItem: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary,
    borderWidth: 1,
  },
  recommendedLocationItem: {
    backgroundColor: COLORS.success + '08',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.success,
  },
  locationItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationTextContainer: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  selectedLocationText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  recommendedText: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '500',
    marginTop: 2,
  },
});
