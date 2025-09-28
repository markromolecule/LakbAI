import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../shared/styles';
import { CHECKPOINTS } from '../../constants/checkpoints';

interface ModernLocationSelectorProps {
  label: string;
  selectedLocation: string;
  onLocationSelect: (location: string) => void;
  placeholder: string;
  disabled?: boolean;
  excludeLocation?: string;
  pickupLocation?: string;
  isDestination?: boolean;
  driverRoute?: string; // Driver's route information
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

export const ModernLocationSelector: React.FC<ModernLocationSelectorProps> = ({
  label,
  selectedLocation,
  onLocationSelect,
  placeholder,
  disabled = false,
  excludeLocation,
  pickupLocation,
  isDestination = false,
  driverRoute,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));

  // Determine which route sequence to use based on pickup location and driver route
  const getRouteSequence = (pickup: string) => {
    // If driver route is provided, use it to determine the correct sequence
    if (driverRoute) {
      console.log('🚌 Using driver route for destination filtering:', driverRoute);
      
      // Parse driver route to determine direction
      if (driverRoute.includes('SM Epza') && driverRoute.includes('SM Dasmariñas')) {
        // Check if it's SM Epza -> SM Dasmariñas (Route 1) or SM Dasmariñas -> SM Epza (Route 2)
        if (driverRoute.includes('SM Epza -> SM Dasmariñas') || driverRoute.includes('SM Epza → SM Dasmariñas')) {
          return ROUTE_SEQUENCES.route1;
        } else if (driverRoute.includes('SM Dasmariñas -> SM Epza') || driverRoute.includes('SM Dasmariñas → SM Epza')) {
          return ROUTE_SEQUENCES.route2;
        }
      }
    }
    
    // Fallback to original logic - prioritize routes where pickup is the START
    if (pickup === 'SM Epza' || ROUTE_SEQUENCES.route1[0] === pickup) {
      return ROUTE_SEQUENCES.route1;
    } else if (pickup === 'SM Dasmariñas' || ROUTE_SEQUENCES.route2[0] === pickup) {
      return ROUTE_SEQUENCES.route2;
    }
    
    // If pickup is not the start of either route, determine by which route it appears first
    const route1Index = ROUTE_SEQUENCES.route1.indexOf(pickup);
    const route2Index = ROUTE_SEQUENCES.route2.indexOf(pickup);
    
    if (route1Index !== -1 && route2Index !== -1) {
      // If pickup appears in both routes, use the one where it appears earlier (closer to start)
      return route1Index < route2Index ? ROUTE_SEQUENCES.route1 : ROUTE_SEQUENCES.route2;
    } else if (route1Index !== -1) {
      return ROUTE_SEQUENCES.route1;
    } else if (route2Index !== -1) {
      return ROUTE_SEQUENCES.route2;
    }
    
    return ROUTE_SEQUENCES.route1;
  };

  // Get available destinations based on pickup location
  const getAvailableDestinations = (pickup: string): readonly string[] => {
    if (!pickup || !isDestination) return CHECKPOINTS;
    
    const routeSequence = getRouteSequence(pickup);
    const pickupIndex = routeSequence.indexOf(pickup);
    
    if (pickupIndex === -1) return CHECKPOINTS;
    
    return routeSequence.slice(pickupIndex + 1);
  };

  // Filter locations based on search text, exclude specified location, and adaptive filtering
  const filteredLocations = useMemo(() => {
    let availableLocations: readonly string[] = CHECKPOINTS;
    
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
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const closeModal = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
    });
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
      nextStops: routeSequence.slice(pickupIndex + 1, pickupIndex + 3)
    };
  };

  const routeInfo = getRouteInfo();

  return (
    <View style={styles.container}>
      {/* Modern Label with Route Info */}
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        {routeInfo && (
          <View style={styles.routeInfoBadge}>
            <View style={styles.routeInfoIcon}>
              <Ionicons name="bus" size={10} color={COLORS.primary} />
            </View>
            <Text style={styles.routeInfoText}>
              {routeInfo.routeName} • {routeInfo.availableCount} stops
            </Text>
          </View>
        )}
      </View>
      
      {/* Modern Selector */}
      <TouchableOpacity
        style={[
          styles.selector,
          disabled && styles.disabledSelector,
          selectedLocation && styles.selectedSelector,
          isDestination && pickupLocation && styles.adaptiveSelector,
        ]}
        onPress={openModal}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View style={styles.selectorContent}>
          <View style={[
            styles.selectorIconContainer,
            selectedLocation && styles.selectedIconContainer
          ]}>
            <Ionicons
              name={isDestination ? "flag" : "location"}
              size={18}
              color={selectedLocation ? COLORS.white : COLORS.primary}
            />
          </View>
          <View style={styles.selectorTextContainer}>
            <Text
              style={[
                styles.selectorText,
                !selectedLocation && styles.placeholderText,
                disabled && styles.disabledText,
              ]}
            >
              {selectedLocation || placeholder}
            </Text>
            {selectedLocation && (
              <Text style={styles.selectorSubtext}>
                {isDestination ? 'Destination selected' : 'Pickup selected'}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.chevronContainer}>
          <Ionicons
            name="chevron-down"
            size={20}
            color={disabled ? COLORS.gray300 : COLORS.gray500}
          />
        </View>
      </TouchableOpacity>
      
      {/* Next Stops Preview */}
      {routeInfo && routeInfo.nextStops.length > 0 && (
        <View style={styles.nextStopsContainer}>
          <Text style={styles.nextStopsLabel}>Next stops</Text>
          <View style={styles.nextStopsList}>
            {routeInfo.nextStops.map((stop, index) => (
              <View key={stop} style={styles.nextStopItem}>
                <View style={styles.nextStopDot} />
                <Text style={styles.nextStopText}>{stop}</Text>
              </View>
            ))}
            {routeInfo.availableCount > 2 && (
              <Text style={styles.moreStopsText}>+{routeInfo.availableCount - 2} more</Text>
            )}
          </View>
        </View>
      )}

      {/* Modern Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <Animated.View style={[styles.modalContainer, { opacity: fadeAnim }]}>
          {/* Modern Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <View style={styles.modalTitleContainer}>
                <View style={styles.modalIconContainer}>
                  <Ionicons 
                    name={isDestination ? "flag" : "location"} 
                    size={20} 
                    color={COLORS.white} 
                  />
                </View>
                <View>
                  <Text style={styles.modalTitle}>
                    {isDestination ? 'Select Destination' : 'Select Pickup'}
                  </Text>
                  {routeInfo && (
                    <Text style={styles.modalSubtitle}>
                      {routeInfo.routeName} • {routeInfo.availableCount} stops available
                    </Text>
                  )}
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeModal}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={COLORS.gray600} />
            </TouchableOpacity>
          </View>

          {/* Modern Search */}
          <View style={styles.searchContainer}>
            <View style={styles.searchIconContainer}>
              <Ionicons name="search" size={18} color={COLORS.gray400} />
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder={isDestination ? "Search destinations..." : "Search pickup locations..."}
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor={COLORS.gray400}
            />
          </View>

          {/* Modern Location List */}
          <ScrollView 
            style={styles.locationsList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.locationsListContent}
          >
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
                    ]}
                    onPress={() => handleLocationSelect(location)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.locationItemContent}>
                      <View style={[
                        styles.locationIconContainer,
                        isSelected && styles.selectedLocationIconContainer,
                        isRecommended && styles.recommendedLocationIconContainer
                      ]}>
                        <Ionicons
                          name={isDestination ? "flag" : "location"}
                          size={16}
                          color={
                            isSelected ? COLORS.white : 
                            isRecommended ? COLORS.success : COLORS.gray500
                          }
                        />
                      </View>
                      <View style={styles.locationTextContainer}>
                        <Text style={[
                          styles.locationText,
                          isSelected && styles.selectedLocationText,
                          isRecommended && styles.recommendedLocationText
                        ]}>
                          {location}
                        </Text>
                        {isRecommended && (
                          <Text style={styles.recommendedText}>Recommended</Text>
                        )}
                      </View>
                    </View>
                    {isSelected && (
                      <View style={styles.checkContainer}>
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color={COLORS.primary}
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.noResultsContainer}>
                <View style={styles.noResultsIconContainer}>
                  <Ionicons name="location-outline" size={48} color={COLORS.gray300} />
                </View>
                <Text style={styles.noResultsText}>No locations found</Text>
                <Text style={styles.noResultsSubtext}>
                  {isDestination ? 'Try selecting a different pickup location' : 'Try a different search term'}
                </Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  labelContainer: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray900,
    marginBottom: SPACING.xs,
    letterSpacing: -0.2,
  },
  routeInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '12',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  routeInfoIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },
  routeInfoText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    minHeight: 64,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  selectedSelector: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '06',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  disabledSelector: {
    backgroundColor: COLORS.gray50,
    borderColor: COLORS.gray200,
    opacity: 0.6,
    shadowOpacity: 0.03,
  },
  adaptiveSelector: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.success + '08',
    shadowColor: COLORS.success,
    shadowOpacity: 0.12,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectorIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  selectedIconContainer: {
    backgroundColor: COLORS.primary,
  },
  selectorTextContainer: {
    flex: 1,
  },
  selectorText: {
    fontSize: 16,
    color: COLORS.gray900,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  selectorSubtext: {
    fontSize: 12,
    color: COLORS.gray500,
    fontWeight: '500',
    marginTop: 2,
  },
  placeholderText: {
    color: COLORS.gray400,
    fontWeight: '500',
  },
  disabledText: {
    color: COLORS.gray300,
  },
  chevronContainer: {
    padding: SPACING.xs,
  },
  nextStopsContainer: {
    marginTop: SPACING.md,
    padding: SPACING.lg,
    backgroundColor: COLORS.gray50,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  nextStopsLabel: {
    fontSize: 13,
    color: COLORS.gray600,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextStopsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  nextStopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
    marginBottom: SPACING.xs,
  },
  nextStopDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.xs,
  },
  nextStopText: {
    fontSize: 13,
    color: COLORS.gray700,
    fontWeight: '500',
  },
  moreStopsText: {
    fontSize: 12,
    color: COLORS.gray500,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl + 20,
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  },
  modalHeaderContent: {
    flex: 1,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.gray900,
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.gray500,
    fontWeight: '500',
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.xl,
    marginVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  searchIconContainer: {
    marginRight: SPACING.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.gray900,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  locationsList: {
    flex: 1,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  locationsListContent: {
    paddingBottom: SPACING.xl,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  selectedLocationItem: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '08',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  recommendedLocationItem: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.success + '06',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  locationItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  selectedLocationIconContainer: {
    backgroundColor: COLORS.primary,
  },
  recommendedLocationIconContainer: {
    backgroundColor: COLORS.success + '20',
  },
  locationTextContainer: {
    flex: 1,
  },
  locationText: {
    fontSize: 16,
    color: COLORS.gray900,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  selectedLocationText: {
    color: COLORS.primary,
  },
  recommendedLocationText: {
    color: COLORS.success,
  },
  recommendedText: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  checkContainer: {
    marginLeft: SPACING.md,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
  },
  noResultsIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  noResultsText: {
    fontSize: 18,
    color: COLORS.gray600,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: COLORS.gray400,
    textAlign: 'center',
    marginTop: SPACING.sm,
    fontWeight: '500',
    lineHeight: 20,
  },
});

export default ModernLocationSelector;
