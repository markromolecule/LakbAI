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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthContext } from '../../../shared/providers/AuthProvider';
import { useRouter } from 'expo-router';
import { PassengerRoutes } from '../../../routes';

const CleanProfileScreen: React.FC = () => {
  const { user, session, completeProfile } = useAuthContext();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: '',
    gender: '',
    birthday: '',
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

  const handleSubmit = async () => {
    if (!user || !session) {
      Alert.alert('Error', 'User session not found');
      return;
    }

    // Basic validation
    if (!formData.phoneNumber || !formData.gender || !formData.birthday) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      const result = await completeProfile(
        user.sub,
        session.userId,
        {
          ...formData,
          user_type: 'passenger',
        }
      );

      if (result.status === 'success') {
        Alert.alert(
          'Success',
          'Profile completed successfully!',
          [
            {
              text: 'Continue',
              onPress: () => router.replace(PassengerRoutes.HOME),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to complete profile');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to complete profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
          <Ionicons name="person-circle" size={64} color="#007AFF" />
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
            
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={formData.phoneNumber}
              onChangeText={(value) => handleInputChange('phoneNumber', value)}
              keyboardType="phone-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Gender (Male/Female/Other)"
              value={formData.gender}
              onChangeText={(value) => handleInputChange('gender', value)}
            />

            <TextInput
              style={styles.input}
              placeholder="Birthday (YYYY-MM-DD)"
              value={formData.birthday}
              onChangeText={(value) => handleInputChange('birthday', value)}
            />
          </View>

          {/* Address Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address Information</Text>
            
            <TextInput
              style={styles.input}
              placeholder="House Number"
              value={formData.houseNumber}
              onChangeText={(value) => handleInputChange('houseNumber', value)}
            />

            <TextInput
              style={styles.input}
              placeholder="Street Name"
              value={formData.streetName}
              onChangeText={(value) => handleInputChange('streetName', value)}
            />

            <TextInput
              style={styles.input}
              placeholder="Barangay"
              value={formData.barangay}
              onChangeText={(value) => handleInputChange('barangay', value)}
            />

            <TextInput
              style={styles.input}
              placeholder="City/Municipality"
              value={formData.cityMunicipality}
              onChangeText={(value) => handleInputChange('cityMunicipality', value)}
            />

            <TextInput
              style={styles.input}
              placeholder="Province"
              value={formData.province}
              onChangeText={(value) => handleInputChange('province', value)}
            />

            <TextInput
              style={styles.input}
              placeholder="Postal Code"
              value={formData.postalCode}
              onChangeText={(value) => handleInputChange('postalCode', value)}
              keyboardType="numeric"
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  userInfoContainer: {
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  userInfoText: {
    fontSize: 16,
    color: '#1C1C1E',
    marginBottom: 4,
  },
  formContainer: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#999',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
});

export default CleanProfileScreen;
