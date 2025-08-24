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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import auth0Service from '../../../shared/services/auth0Service';
import { PassengerRoutes } from '../../../routes';
import { storeUserSession } from '../../../shared/utils/authUtils';
import { TextInput } from 'react-native';

interface CompleteProfileScreenProps {}

const CompleteProfileScreen: React.FC<CompleteProfileScreenProps> = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const auth0Id = params.auth0Id as string;
  const userDataString = params.userData as string;
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    birthday: '',
    gender: 'Male',
    house_number: '',
    street_name: '',
    barangay: '',
    city_municipality: '',
    province: '',
    postal_code: '',
    user_type: 'passenger'
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        setFormData(prev => ({
          ...prev,
          ...userData,
          // Ensure required fields are not empty
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          phone_number: userData.phone_number || '',
          birthday: userData.birthday || '',
          gender: userData.gender || 'Male',
          house_number: userData.house_number || '',
          street_name: userData.street_name || '',
          barangay: userData.barangay || '',
          city_municipality: userData.city_municipality || '',
          province: userData.province || '',
          postal_code: userData.postal_code || '',
          user_type: userData.user_type || 'passenger'
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
    
    if (!formData.birthday) {
      newErrors.birthday = 'Birthday is required';
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
      const result = await auth0Service.completeProfile(auth0Id, formData);
      
      if (result.status === 'success') {
        const user = result.user;
        
        // Store user session
        await storeUserSession(user.user_type || 'passenger', user.username || user.email, true);
        
        Alert.alert(
          'Profile Completed!',
          'Your profile has been successfully completed.',
          [
            {
              text: 'Continue',
              onPress: () => {
                // Redirect to appropriate screen based on user type
                if (user.user_type === 'driver') {
                  router.replace('/driver');
                } else {
                  router.replace(PassengerRoutes.HOME);
                }
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
              keyboardType="phone-pad"
            />
            {errors.phone_number && <Text style={styles.errorText}>{errors.phone_number}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Birthday *</Text>
            <TextInput
              style={[styles.input, errors.birthday && styles.inputError]}
              value={formData.birthday}
              onChangeText={(value) => handleInputChange('birthday', value)}
              placeholder="YYYY-MM-DD"
            />
            {errors.birthday && <Text style={styles.errorText}>{errors.birthday}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.gender}
                onValueChange={(value) => handleInputChange('gender', value)}
                style={styles.picker}
              >
                <Picker.Item label="Male" value="Male" />
                <Picker.Item label="Female" value="Female" />
                <Picker.Item label="Other" value="Other" />
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>User Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.user_type}
                onValueChange={(value) => handleInputChange('user_type', value)}
                style={styles.picker}
              >
                <Picker.Item label="Passenger" value="passenger" />
                <Picker.Item label="Driver" value="driver" />
              </Picker>
            </View>
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
              keyboardType="numeric"
            />
            {errors.postal_code && <Text style={styles.errorText}>{errors.postal_code}</Text>}
          </View>
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.submitButtonText}>Complete Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginVertical: 20,
  },
  formSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  picker: {
    height: 50,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginVertical: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
});

export default CompleteProfileScreen;
