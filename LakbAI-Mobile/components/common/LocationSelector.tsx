import React, { useState } from 'react';
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
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  label,
  selectedLocation,
  onLocationSelect,
  placeholder,
  disabled = false,
  excludeLocation,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Filter locations based on search text and exclude specified location
  const filteredLocations = CHECKPOINTS.filter(location => {
    const matchesSearch = location.toLowerCase().includes(searchText.toLowerCase());
    const notExcluded = excludeLocation ? location !== excludeLocation : true;
    return matchesSearch && notExcluded;
  });

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

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.selector,
          disabled && styles.disabledSelector,
          selectedLocation && styles.selectedSelector,
        ]}
        onPress={openModal}
        disabled={disabled}
      >
        <Text
          style={[
            styles.selectorText,
            !selectedLocation && styles.placeholderText,
            disabled && styles.disabledText,
          ]}
        >
          {selectedLocation || placeholder}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={disabled ? COLORS.gray400 : COLORS.gray500}
        />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select {label.replace(':', '')}</Text>
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
              placeholder="Search locations..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor={COLORS.gray500}
            />
          </View>

          <ScrollView style={styles.locationsList}>
            {filteredLocations.length > 0 ? (
              filteredLocations.map((location, index) => (
                <TouchableOpacity
                  key={location}
                  style={[
                    styles.locationItem,
                    index === filteredLocations.length - 1 && styles.lastLocationItem,
                  ]}
                  onPress={() => handleLocationSelect(location)}
                >
                  <Ionicons
                    name="location"
                    size={20}
                    color={COLORS.primary}
                    style={styles.locationIcon}
                  />
                  <Text style={styles.locationText}>{location}</Text>
                  {selectedLocation === location && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={COLORS.primary}
                      style={styles.checkIcon}
                    />
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>No locations found</Text>
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
  },
});
