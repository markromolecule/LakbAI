import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import auth0Service from '../../../shared/services/auth0Service';
import { PassengerRoutes } from '../../../routes';
import { storeUserSession } from '../../../shared/utils/authUtils';
import { TextInput } from 'react-native';
import styles from '../styles/CompleteProfileScreen.styles';

interface CompleteProfileScreenProps {}

const CompleteProfileScreen: React.FC<CompleteProfileScreenProps> = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const auth0Id = params.auth0Id as string;
  const userId = params.userId as string; // Get userId from params
  const userDataString = params.userData as string;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showDayDropdown, setShowDayDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    birth_month: '1',
    birth_day: '1',
    birth_year: '2000',
    gender: 'Male',
    house_number: '',
    street_name: '',
    barangay: '',
    city_municipality: '',
    province: '',
    postal_code: '',
    user_type: 'passenger' // Always passenger for mobile app
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Generate arrays for date pickers
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: new Date(2000, i, 1).toLocaleDateString('en-US', { month: 'short' }).toUpperCase() // APR, MAR, etc.
  }));

  const days = Array.from({ length: 31 }, (_, i) => ({
    value: (i + 1).toString(),
    label: (i + 1).toString()
  }));

  const years = Array.from({ length: 100 }, (_, i) => ({
    value: (2024 - i).toString(),
    label: (2024 - i).toString()
  }));

  // Gender options for buttons
  const genderOptions = [
    { label: 'MALE', value: 'Male' },
    { label: 'FEMALE', value: 'Female' }
  ];

  useEffect(() => {
    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        
        // Parse existing birthday if available
        let birthMonth = '1';
        let birthDay = '1';
        let birthYear = '2000';
        
        if (userData.birthday) {
          try {
            const birthday = new Date(userData.birthday);
            if (!isNaN(birthday.getTime())) {
              birthMonth = (birthday.getMonth() + 1).toString();
              birthDay = birthday.getDate().toString();
              birthYear = birthday.getFullYear().toString();
            }
          } catch (error) {
            console.log('Could not parse existing birthday, using defaults');
          }
        }
        
        setFormData(prev => ({
          ...prev,
          ...userData,
          // Ensure required fields are not empty
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          phone_number: userData.phone_number || '',
          birth_month: birthMonth,
          birth_day: birthDay,
          birth_year: birthYear,
          gender: userData.gender || 'Male',
          house_number: userData.house_number || '',
          street_name: userData.street_name || '',
          barangay: userData.barangay || '',
          city_municipality: userData.city_municipality || '',
          province: userData.province || '',
          postal_code: userData.postal_code || '',
          user_type: 'passenger' // Always passenger for mobile app
        }));
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }
  }, [userDataString]);

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    
    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'Phone number is required';
    } else if (!/^\+?[0-9]{10,15}$/.test(formData.phone_number)) {
      newErrors.phone_number = 'Please enter a valid phone number';
    }
    
    // Validate birthday components
    if (!formData.birth_month || !formData.birth_day || !formData.birth_year) {
      newErrors.birthday = 'Birthday is required';
    } else {
      // Validate date validity
      const month = parseInt(formData.birth_month);
      const day = parseInt(formData.birth_day);
      const year = parseInt(formData.birth_year);
      
      const date = new Date(year, month - 1, day);
      if (date.getMonth() !== month - 1 || date.getDate() !== day || date.getFullYear() !== year) {
        newErrors.birthday = 'Invalid date';
      }
      
      // Check if user is at least 13 years old
      const today = new Date();
      let age = today.getFullYear() - year;
      if (today.getMonth() < month - 1 || (today.getMonth() === month - 1 && today.getDate() < day)) {
        age--;
      }
      if (age < 13) {
        newErrors.birthday = 'You must be at least 13 years old';
      }
    }
    
    if (!formData.house_number.trim()) {
      newErrors.house_number = 'House number is required';
    }
    
    if (!formData.street_name.trim()) {
      newErrors.street_name = 'Street name is required';
    }
    
    if (!formData.barangay.trim()) {
      newErrors.barangay = 'Barangay is required';
    }
    
    if (!formData.city_municipality.trim()) {
      newErrors.city_municipality = 'City/Municipality is required';
    }
    
    if (!formData.province.trim()) {
      newErrors.province = 'Province is required';
    }
    
    if (!formData.postal_code.trim()) {
      newErrors.postal_code = 'Postal code is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Format birthday as YYYY-MM-DD
      const formattedBirthday = `${formData.birth_year}-${formData.birth_month.padStart(2, '0')}-${formData.birth_day.padStart(2, '0')}`;
      
      const submitData = {
        ...formData,
        birthday: formattedBirthday
      };
      
      const result = await auth0Service.completeProfile(auth0Id, userId, submitData);
      
      if (result.status === 'success') {
        const user = result.user || result.data;
        
        // Store user session (always passenger for mobile app)
        await storeUserSession('passenger', user?.username || user?.email || formData.first_name, true);
        
        Alert.alert(
          'Profile Completed! 🎉',
          'Your profile has been successfully completed. Welcome to LakbAI!',
          [
            {
              text: 'Continue',
              onPress: () => {
                // Always redirect to passenger home for mobile app
                router.replace(PassengerRoutes.HOME);
              }
            }
          ]
        );
      } else {
        throw new Error(result.message || 'Failed to complete profile');
      }
    } catch (error) {
      console.error('Profile completion error:', error);
      Alert.alert(
        'Error',
        'Failed to complete profile. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Clear birthday error when any date component changes
    if (['birth_month', 'birth_day', 'birth_year'].includes(field) && errors.birthday) {
      setErrors(prev => ({ ...prev, birthday: '' }));
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Completing Profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Complete Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.subtitle}>
          Please complete your profile information to continue
        </Text>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={[styles.input, errors.first_name && styles.inputError]}
              value={formData.first_name}
              onChangeText={(value) => handleInputChange('first_name', value)}
              placeholder="Enter your first name"
              placeholderTextColor="#999999"
            />
            {errors.first_name && <Text style={styles.errorText}>{errors.first_name}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={[styles.input, errors.last_name && styles.inputError]}
              value={formData.last_name}
              onChangeText={(value) => handleInputChange('last_name', value)}
              placeholder="Enter your last name"
              placeholderTextColor="#999999"
            />
            {errors.last_name && <Text style={styles.errorText}>{errors.last_name}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={[styles.input, errors.phone_number && styles.inputError]}
              value={formData.phone_number}
              onChangeText={(value) => handleInputChange('phone_number', value)}
              placeholder="+63 912 345 6789"
              placeholderTextColor="#999999"
              keyboardType="phone-pad"
            />
            {errors.phone_number && <Text style={styles.errorText}>{errors.phone_number}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Birthday *</Text>
            <View style={styles.birthdayContainer}>
              <View style={styles.datePickerGroup}>
                <Text style={styles.datePickerLabel}>Month</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowMonthDropdown(true)}
                >
                  <Text style={styles.dropdownButtonText}>
                    {months.find(m => m.value === formData.birth_month)?.label || 'Select'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.datePickerGroup}>
                <Text style={styles.datePickerLabel}>Day</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowDayDropdown(true)}
                >
                  <Text style={styles.dropdownButtonText}>
                    {formData.birth_day || 'Select'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.datePickerGroup}>
                <Text style={styles.datePickerLabel}>Year</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowYearDropdown(true)}
                >
                  <Text style={styles.dropdownButtonText}>
                    {formData.birth_year || 'Select'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            </View>
            {errors.birthday && <Text style={styles.errorText}>{errors.birthday}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender *</Text>
            <View style={styles.genderButtonContainer}>
              {genderOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.genderButton,
                    formData.gender === option.value && styles.genderButtonSelected
                  ]}
                  onPress={() => handleInputChange('gender', option.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.genderButtonText,
                    formData.gender === option.value && styles.genderButtonTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.userTypeInfo}>
            <Ionicons name="information-circle" size={18} color="#007AFF" />
            <Text style={styles.userTypeInfoText}>
              Account Type: Passenger (Mobile App)
            </Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Address Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>House Number *</Text>
            <TextInput
              style={[styles.input, errors.house_number && styles.inputError]}
              value={formData.house_number}
              onChangeText={(value) => handleInputChange('house_number', value)}
              placeholder="123"
              placeholderTextColor="#999999"
            />
            {errors.house_number && <Text style={styles.errorText}>{errors.house_number}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Street Name *</Text>
            <TextInput
              style={[styles.input, errors.street_name && styles.inputError]}
              value={formData.street_name}
              onChangeText={(value) => handleInputChange('street_name', value)}
              placeholder="Rizal Street"
              placeholderTextColor="#999999"
            />
            {errors.street_name && <Text style={styles.errorText}>{errors.street_name}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Barangay *</Text>
            <TextInput
              style={[styles.input, errors.barangay && styles.inputError]}
              value={formData.barangay}
              onChangeText={(value) => handleInputChange('barangay', value)}
              placeholder="Barangay 1"
              placeholderTextColor="#999999"
            />
            {errors.barangay && <Text style={styles.errorText}>{errors.barangay}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>City/Municipality *</Text>
            <TextInput
              style={[styles.input, errors.city_municipality && styles.inputError]}
              value={formData.city_municipality}
              onChangeText={(value) => handleInputChange('city_municipality', value)}
              placeholder="Manila"
              placeholderTextColor="#999999"
            />
            {errors.city_municipality && <Text style={styles.errorText}>{errors.city_municipality}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Province *</Text>
            <TextInput
              style={[styles.input, errors.province && styles.inputError]}
              value={formData.province}
              onChangeText={(value) => handleInputChange('province', value)}
              placeholder="Metro Manila"
              placeholderTextColor="#999999"
            />
            {errors.province && <Text style={styles.errorText}>{errors.province}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Postal Code *</Text>
            <TextInput
              style={[styles.input, errors.postal_code && styles.inputError]}
              value={formData.postal_code}
              onChangeText={(value) => handleInputChange('postal_code', value)}
              placeholder="1000"
              placeholderTextColor="#999999"
              keyboardType="numeric"
            />
            {errors.postal_code && <Text style={styles.errorText}>{errors.postal_code}</Text>}
          </View>
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>Complete Profile</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Month Dropdown Modal */}
      <Modal
        visible={showMonthDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMonthDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMonthDropdown(false)}
        >
          <View style={styles.dropdownModal}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Select Month</Text>
              <TouchableOpacity onPress={() => setShowMonthDropdown(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dropdownList}>
              {months.map((month) => (
                <TouchableOpacity
                  key={month.value}
                  style={[
                    styles.dropdownItem,
                    formData.birth_month === month.value && styles.dropdownItemSelected
                  ]}
                  onPress={() => {
                    handleInputChange('birth_month', month.value);
                    setShowMonthDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    formData.birth_month === month.value && styles.dropdownItemTextSelected
                  ]}>
                    {month.label}
                  </Text>
                  {formData.birth_month === month.value && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Day Dropdown Modal */}
      <Modal
        visible={showDayDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDayDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDayDropdown(false)}
        >
          <View style={styles.dropdownModal}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Select Day</Text>
              <TouchableOpacity onPress={() => setShowDayDropdown(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dropdownList}>
              {days.map((day) => (
                <TouchableOpacity
                  key={day.value}
                  style={[
                    styles.dropdownItem,
                    formData.birth_day === day.value && styles.dropdownItemSelected
                  ]}
                  onPress={() => {
                    handleInputChange('birth_day', day.value);
                    setShowDayDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    formData.birth_day === day.value && styles.dropdownItemTextSelected
                  ]}>
                    {day.label}
                  </Text>
                  {formData.birth_day === day.value && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Year Dropdown Modal */}
      <Modal
        visible={showYearDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowYearDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowYearDropdown(false)}
        >
          <View style={styles.dropdownModal}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Select Year</Text>
              <TouchableOpacity onPress={() => setShowYearDropdown(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dropdownList}>
              {years.map((year) => (
                <TouchableOpacity
                  key={year.value}
                  style={[
                    styles.dropdownItem,
                    formData.birth_year === year.value && styles.dropdownItemSelected
                  ]}
                  onPress={() => {
                    handleInputChange('birth_year', year.value);
                    setShowYearDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    formData.birth_year === year.value && styles.dropdownItemTextSelected
                  ]}>
                    {year.label}
                  </Text>
                  {formData.birth_year === year.value && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default CompleteProfileScreen;
