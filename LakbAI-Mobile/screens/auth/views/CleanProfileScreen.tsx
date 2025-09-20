import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthContext } from '../../../shared/providers/AuthProvider';
import { useRouter } from 'expo-router';
import { PassengerRoutes } from '../../../routes';

const months = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
];

const dates = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
const years = Array.from({ length: 100 }, (_, i) => (new Date().getFullYear() - i).toString());

const CleanProfileScreen: React.FC = () => {
  const { user, session, completeProfile } = useAuthContext();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    gender: '',
    birthday: {
      month: '',
      date: '',
      year: '',
    },
    houseNumber: '',
    streetName: '',
    barangay: '',
    cityMunicipality: '',
    province: '',
    postalCode: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBirthdayChange = (type: 'month' | 'date' | 'year', value: string) => {
    setFormData(prev => ({
      ...prev,
      birthday: { ...prev.birthday, [type]: value }
    }));
  };

  const getBirthdayDisplay = () => {
    const { month, date, year } = formData.birthday;
    if (month && date && year) {
      return `${month} ${date}, ${year}`;
    }
    return 'Select Birthday';
  };

  const handleSubmit = async () => {
    if (!user || !session) {
      Alert.alert('Error', 'User session not found');
      return;
    }

    // Enhanced validation
    if (!formData.firstName || !formData.lastName || !formData.phoneNumber || 
        !formData.gender || !formData.birthday.month || !formData.birthday.date || !formData.birthday.year) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    // Debug logging
    console.log('🔍 Profile completion debug:', {
      userSub: user.sub,
      sessionUserId: session.userId,
      sessionDbUserId: session.dbUserData?.id,
      formData: formData
    });

    try {
      // Preserve existing user type from database or default to 'passenger'
      const userType = session.dbUserData?.user_type || session.userType || 'passenger';
      
      const result = await completeProfile(
        user.sub,
        session.dbUserData?.id?.toString() || session.userId, // Use database ID if available, fallback to session.userId
        {
          ...formData,
          birthday: `${formData.birthday.year}-${months.indexOf(formData.birthday.month) + 1}-${formData.birthday.date}`,
          user_type: userType,
        }
      );

      console.log('✅ Profile completion result:', result);

      if (result.status === 'success') {
        console.log('✅ Profile completion successful!');
        
        Alert.alert(
          'Success',
          'Profile completed successfully!',
          [
            {
              text: 'Continue',
              onPress: () => {
                // Redirect based on user type
                if (userType === 'driver') {
                  router.replace('/driver');
                } else {
                  router.replace(PassengerRoutes.HOME);
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to complete profile');
      }
    } catch (error) {
      console.error('Profile completion error:', error);
      Alert.alert('Error', 'Failed to complete profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPickerModal = (
    visible: boolean,
    onClose: () => void,
    title: string,
    data: string[],
    onSelect: (value: string) => void,
    currentValue: string
  ) => (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerList}>
            {data.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.pickerItem,
                  currentValue === item && styles.pickerItemSelected
                ]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={[
                  styles.pickerItemText,
                  currentValue === item && styles.pickerItemTextSelected
                ]}>
                  {item}
                </Text>
                {currentValue === item && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (!user || !session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#FF3B30" />
          <Text style={styles.errorText}>User session not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="person-circle" size={64} color="#007AFF" />
          </View>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            Help us personalize your experience
          </Text>
        </View>

        {/* User Info Display */}
        <View style={styles.userInfoContainer}>
          <Text style={styles.userInfoText}>
            Welcome, {user.name || user.nickname}!
          </Text>
          <Text style={styles.userInfoText}>{user.email}</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.inputLabel}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChangeText={(value) => handleInputChange('firstName', value)}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.halfWidth}>
                <Text style={styles.inputLabel}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChangeText={(value) => handleInputChange('lastName', value)}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              value={formData.phoneNumber}
              onChangeText={(value) => handleInputChange('phoneNumber', value)}
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>Gender *</Text>
            <View style={styles.genderContainer}>
              {['Male', 'Female', 'Other'].map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.genderButton,
                    formData.gender === gender && styles.genderButtonSelected
                  ]}
                  onPress={() => handleInputChange('gender', gender)}
                >
                  <Text style={[
                    styles.genderButtonText,
                    formData.gender === gender && styles.genderButtonTextSelected
                  ]}>
                    {gender}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Birthday *</Text>
            <View style={styles.birthdayContainer}>
              <TouchableOpacity
                style={styles.birthdayPicker}
                onPress={() => setShowMonthPicker(true)}
              >
                <Text style={[
                  styles.birthdayText,
                  !formData.birthday.month && styles.placeholderText
                ]}>
                  {formData.birthday.month || 'Month'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#666" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.birthdayPicker}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={[
                  styles.birthdayText,
                  !formData.birthday.date && styles.placeholderText
                ]}>
                  {formData.birthday.date || 'Date'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#666" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.birthdayPicker}
                onPress={() => setShowYearPicker(true)}
              >
                <Text style={[
                  styles.birthdayText,
                  !formData.birthday.year && styles.placeholderText
                ]}>
                  {formData.birthday.year || 'Year'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Address Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address Information</Text>
            
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.inputLabel}>House Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter house number"
                  value={formData.houseNumber}
                  onChangeText={(value) => handleInputChange('houseNumber', value)}
                />
              </View>
              <View style={styles.halfWidth}>
                <Text style={styles.inputLabel}>Postal Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter postal code"
                  value={formData.postalCode}
                  onChangeText={(value) => handleInputChange('postalCode', value)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Street Name / Subd / Village</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter street name, subdivision, or village"
              value={formData.streetName}
              onChangeText={(value) => handleInputChange('streetName', value)}
            />

            <Text style={styles.inputLabel}>Barangay</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter barangay"
              value={formData.barangay}
              onChangeText={(value) => handleInputChange('barangay', value)}
            />

            <Text style={styles.inputLabel}>City/Municipality</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter city or municipality"
              value={formData.cityMunicipality}
              onChangeText={(value) => handleInputChange('cityMunicipality', value)}
            />

            <Text style={styles.inputLabel}>Province</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter province"
              value={formData.province}
              onChangeText={(value) => handleInputChange('province', value)}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Complete Profile</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Month Picker Modal */}
      {renderPickerModal(
        showMonthPicker,
        () => setShowMonthPicker(false),
        'Select Month',
        months,
        (value) => handleBirthdayChange('month', value),
        formData.birthday.month
      )}

      {/* Date Picker Modal */}
      {renderPickerModal(
        showDatePicker,
        () => setShowDatePicker(false),
        'Select Date',
        dates,
        (value) => handleBirthdayChange('date', value),
        formData.birthday.date
      )}

      {/* Year Picker Modal */}
      {renderPickerModal(
        showYearPicker,
        () => setShowYearPicker(false),
        'Select Year',
        years,
        (value) => handleBirthdayChange('year', value),
        formData.birthday.year
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  userInfoContainer: {
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  userInfoText: {
    fontSize: 16,
    color: '#1C1C1E',
    marginBottom: 4,
    fontWeight: '500',
  },
  formContainer: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#E3F2FD',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    color: '#1C1C1E',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  genderButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  genderButtonTextSelected: {
    color: '#007AFF',
  },
  birthdayContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  birthdayPicker: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  birthdayText: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  placeholderText: {
    color: '#999',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#999',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    marginTop: 16,
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  closeButton: {
    padding: 8,
  },
  pickerList: {
    maxHeight: 300,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pickerItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  pickerItemTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default CleanProfileScreen;
