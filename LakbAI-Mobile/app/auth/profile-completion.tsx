import React, { useState, useEffect } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  AddressSection,
  BirthdaySection,
  GenderSection,
  PhoneSection,
} from '../../screens/auth/components/register';
import { auth0Service } from '../../shared/services/auth0Service';
import { storeUserSession } from '../../shared/utils/authUtils';
import { PassengerRoutes } from '../../routes/PassengerRoutes';
import { DriverRoutes } from '../../routes/DriverRoutes';
import { userSyncService } from '../../shared/services/userSyncService';
import styles from './profile-completion.styles';

interface ProfileData {
  // Personal fields
  first_name: string;
  last_name: string;
  
  // Address fields
  house_number: string;
  street_name: string;
  barangay: string;
  city_municipality: string;
  province: string;
  postal_code: string;
  
  // Address fields for AddressSection component compatibility
  houseNumber: string;
  streetName: string;
  cityMunicipality: string;
  postalCode: string;
  
  // Personal fields
  phone_number: string;
  birthday: string;
  gender: string;
  
  // Birthday fields for BirthdaySection component compatibility
  birthMonth: string;
  birthDate: string;
  birthYear: string;
  
  // Additional preferences
  preferred_vehicle_type?: string;
  emergency_contact?: string;
  special_needs?: string;
}

const ProfileCompletionScreen = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    house_number: '',
    street_name: '',
    barangay: '',
    city_municipality: '',
    province: '',
    postal_code: '',
    phone_number: '',
    birthday: '',
    gender: '',
    // Add fields for AddressSection component compatibility
    houseNumber: '',
    streetName: '',
    cityMunicipality: '',
    postalCode: '',
    // Add fields for BirthdaySection component compatibility
    birthMonth: '',
    birthDate: '',
    birthYear: '',
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      // Get current Auth0 user
      const currentUser = await auth0Service.getCurrentUser();
      
      if (!currentUser) {
        Alert.alert('Error', 'No authenticated user found', [
          { text: 'OK', onPress: () => router.replace('/') }
        ]);
        return;
      }
      
      setUser(currentUser);
      
      // Pre-fill any existing data
      const existingData = currentUser.user_metadata || {};
      if (existingData.address || existingData.phone_number) {
        setProfileData({
          house_number: existingData.address?.house_number || '',
          street_name: existingData.address?.street_name || '',
          barangay: existingData.address?.barangay || '',
          city_municipality: existingData.address?.city_municipality || '',
          province: existingData.address?.province || '',
          postal_code: existingData.address?.postal_code || '',
          phone_number: existingData.phone_number || '',
          birthday: existingData.birthday || '',
          gender: existingData.gender || '',
          preferred_vehicle_type: existingData.preferred_vehicle_type || '',
          emergency_contact: existingData.emergency_contact || '',
          special_needs: existingData.special_needs || '',
        });
      }
      
    } catch (error) {
      console.error('Failed to load user data:', error);
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfileData = (field: string, value: any) => {
    setProfileData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Sync field names for AddressSection component compatibility
      if (field === 'houseNumber') {
        updated.house_number = value;
      } else if (field === 'streetName') {
        updated.street_name = value;
      } else if (field === 'cityMunicipality') {
        updated.city_municipality = value;
      } else if (field === 'postalCode') {
        updated.postal_code = value;
      } else if (field === 'house_number') {
        updated.houseNumber = value;
      } else if (field === 'street_name') {
        updated.streetName = value;
      } else if (field === 'city_municipality') {
        updated.cityMunicipality = value;
      } else if (field === 'postal_code') {
        updated.postalCode = value;
      }
      
      // Sync birthday fields
      if (field === 'birthMonth' || field === 'birthDate' || field === 'birthYear') {
        updated.birthday = `${updated.birthMonth} ${updated.birthDate}, ${updated.birthYear}`;
      }
      
      return updated;
    });
  };

  const validateForm = (): boolean => {
    const requiredFields = {
      'First Name': profileData.first_name,
      'Last Name': profileData.last_name,
      'Address - House Number': profileData.house_number || profileData.houseNumber,
      'Address - Street': profileData.street_name || profileData.streetName,
      'Address - Barangay': profileData.barangay,
      'Address - City': profileData.city_municipality || profileData.cityMunicipality,
      'Address - Province': profileData.province,
      'Phone Number': profileData.phone_number,
      'Birthday - Month': profileData.birthMonth,
      'Birthday - Date': profileData.birthDate,
      'Birthday - Year': profileData.birthYear,
      'Gender': profileData.gender,
    };

    for (const [fieldName, value] of Object.entries(requiredFields)) {
      if (!value || value.toString().trim() === '') {
        Alert.alert('Required Field', `Please fill in: ${fieldName}`);
        return false;
      }
    }

    // Validate phone number format
    const phoneRegex = /^(\+63|0)[0-9]{10}$/;
    if (!phoneRegex.test(profileData.phone_number.replace(/\s+/g, ''))) {
      Alert.alert('Invalid Phone', 'Please enter a valid Philippine phone number');
      return false;
    }

    return true;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) return;
    
    try {
      setIsSaving(true);
      
      // Determine user type based on Auth0 roles
      const { roles, isPassenger } = await auth0Service.getUserRoles();
      const userType = roles.includes('driver') ? 'driver' : 'passenger';
      
      // Prepare metadata for Auth0
      const userMetadata = {
        // Personal information
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        
        // Address information
        address: {
          house_number: profileData.house_number,
          street_name: profileData.street_name,
          barangay: profileData.barangay,
          city_municipality: profileData.city_municipality,
          province: profileData.province,
          postal_code: profileData.postal_code,
          full_address: `${profileData.house_number} ${profileData.street_name}, ${profileData.barangay}, ${profileData.city_municipality}, ${profileData.province} ${profileData.postal_code}`,
        },
        
        // Personal information
        phone_number: profileData.phone_number,
        birthday: `${profileData.birthMonth} ${profileData.birthDate}, ${profileData.birthYear}`,
        gender: profileData.gender,
        
        // App-specific metadata
        user_type: userType,
        registration_complete: true,
        registration_date: new Date().toISOString(),
        profile_completion_date: new Date().toISOString(),
        
        // Optional preferences
        ...(profileData.preferred_vehicle_type && {
          preferred_vehicle_type: profileData.preferred_vehicle_type
        }),
        ...(profileData.emergency_contact && {
          emergency_contact: profileData.emergency_contact
        }),
        ...(profileData.special_needs && {
          special_needs: profileData.special_needs
        }),
      };
      
      // Sync user data to backend database FIRST (before Auth0 metadata update)
      const syncResult = await userSyncService.syncAfterProfileCompletion({
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        phone_number: profileData.phone_number,
        address: {
          house_number: profileData.house_number,
          street_name: profileData.street_name,
          barangay: profileData.barangay,
          city_municipality: profileData.city_municipality,
          province: profileData.province,
          postal_code: profileData.postal_code,
          full_address: `${profileData.house_number} ${profileData.street_name}, ${profileData.barangay}, ${profileData.city_municipality}, ${profileData.province} ${profileData.postal_code}`,
        },
        birthday: `${profileData.birthMonth} ${profileData.birthDate}, ${profileData.birthYear}`,
        gender: profileData.gender,
        user_type: userType,
        roles: [userType]
      });
      
      if (!syncResult.success) {
        console.warn('Failed to sync user to database:', syncResult.message);
        // Continue with the flow even if sync fails
      }
      
      // Update Auth0 user metadata AFTER successful database sync
      await auth0Service.updateUserMetadata(userMetadata);
      
      // Store user session
      const username = user.nickname || user.email || user.name || 'user';
      await storeUserSession(userType, username, true);
      
      // Show success message and navigate
      Alert.alert(
        'Profile Complete!',
        `Welcome to LakbAI, ${user.name || username}!`,
        [
          {
            text: 'Get Started',
            onPress: () => {
              if (userType === 'driver') {
                router.replace(DriverRoutes.HOME);
              } else {
                router.replace(PassengerRoutes.HOME);
              }
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Failed to save profile:', error);
      Alert.alert(
        'Save Failed',
        'Unable to save your profile. Please check your connection and try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkipForNow = () => {
    Alert.alert(
      'Skip Profile Setup?',
      'You can complete your profile later, but some features may be limited.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: async () => {
            try {
              const { roles } = await auth0Service.getUserRoles();
              const userType = roles.includes('driver') ? 'driver' : 'passenger';
              const username = user.nickname || user.email || user.name || 'user';
              
              await storeUserSession(userType, username, true);
              
              if (userType === 'driver') {
                router.replace(DriverRoutes.HOME);
              } else {
                router.replace(PassengerRoutes.HOME);
              }
            } catch (error) {
              console.error('Skip error:', error);
            }
          }
        }
      ]
    );
  };

  // Show loading screen while initializing
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            Hello {user?.name || 'there'}! Please complete your profile to get the best LakbAI experience.
          </Text>
        </View>

        {/* Form Sections */}
        <View style={styles.formContainer}>
          {/* Address Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>📍 Address Information</Text>
            <AddressSection
              signUpData={profileData}
              updateSignUpData={updateProfileData}
            />
          </View>

          {/* Personal Information */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>👤 Personal Details</Text>
            
            {/* First Name and Last Name */}
            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>First Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={profileData.first_name}
                  onChangeText={(value) => updateProfileData('first_name', value)}
                  placeholder="Enter first name"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Last Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={profileData.last_name}
                  onChangeText={(value) => updateProfileData('last_name', value)}
                  placeholder="Enter last name"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
            
            <PhoneSection
              signUpData={profileData}
              updateSignUpData={updateProfileData}
              handlePhoneInput={(value) => updateProfileData('phone_number', value)}
            />
            
            <BirthdaySection
              signUpData={profileData}
              updateSignUpData={updateProfileData}
              showMonthDropdown={showMonthDropdown}
              toggleMonthDropdown={() => setShowMonthDropdown(!showMonthDropdown)}
              handleDateInput={(value) => updateProfileData('birthDate', value)}
              handleYearInput={(value) => updateProfileData('birthYear', value)}
            />
            
            <GenderSection
              signUpData={profileData}
              updateSignUpData={updateProfileData}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.primaryButton, isSaving && styles.buttonDisabled]} 
            onPress={handleSaveProfile}
            disabled={isSaving}
          >
            {isSaving ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.primaryButtonText}>Saving...</Text>
              </View>
            ) : (
              <Text style={styles.primaryButtonText}>Complete Profile</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.secondaryButton, isSaving && styles.buttonDisabled]} 
            onPress={handleSkipForNow}
            disabled={isSaving}
          >
            <Text style={styles.secondaryButtonText}>Skip for Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileCompletionScreen;
