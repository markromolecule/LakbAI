import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SPACING } from '../../shared/styles';

interface LocationPickerProps {
  label: string;
  selectedLocation: string;
  onLocationSelect: (location: string) => void;
  locations: readonly string[];
  placeholder: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  label,
  selectedLocation,
  onLocationSelect,
  locations,
  placeholder
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleLocationSelect = (location: string) => {
    onLocationSelect(location);
    setIsModalVisible(false);
  };

  const renderLocationItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.locationItem}
      onPress={() => handleLocationSelect(item)}
    >
      <Text style={styles.locationText}>{item}</Text>
      {selectedLocation === item && (
        <Ionicons name="checkmark" size={20} color={COLORS.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.picker}
        onPress={() => setIsModalVisible(true)}
      >
        <Text style={[
          styles.pickerText,
          !selectedLocation && styles.placeholderText
        ]}>
          {selectedLocation || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={COLORS.gray500} />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Location</Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Ionicons name="close" size={24} color={COLORS.gray600} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={[...locations]}
            renderItem={renderLocationItem}
            keyExtractor={(item) => item}
            style={styles.locationList}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray700,
    marginBottom: SPACING.sm,
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.white,
  },
  pickerText: {
    fontSize: 16,
    color: COLORS.gray800,
  },
  placeholderText: {
    color: COLORS.gray500,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray800,
  },
  locationList: {
    flex: 1,
  },
  locationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  locationText: {
    fontSize: 16,
    color: COLORS.gray800,
  },
});