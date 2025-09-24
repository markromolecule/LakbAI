import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Alert, SafeAreaView, ScrollView, TouchableOpacity, Text, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/common/Footer';
import { EditProfileForm } from '../../screens/passenger/views/EditProfileForm';
import { usePassengerState } from '../../screens/passenger/hooks/usePassengerState';
import { useAuthContext } from '../../shared/providers/AuthProvider';
import { COLORS } from '../../shared/styles';
import { SPACING } from '../../shared/styles/spacing';
import { getBaseUrl } from '../../config/apiConfig';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfileScreen() {
  const router = useRouter();
  const { passengerProfile, refreshProfile } = usePassengerState();
  const { isAuthenticated, user, session } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const getProfilePictureUrl = (picturePath: string | null) => {
    if (!picturePath) return null;
    
    // If it's already a full URL, return as is
    if (picturePath.startsWith('http')) {
      return picturePath;
    }
    
    // If it's a relative path, construct the full URL
    if (picturePath.startsWith('uploads/')) {
      return `${getBaseUrl()}/profile-picture?path=${encodeURIComponent(picturePath)}`;
    }
    
    return picturePath;
  };

  useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert(
        'Authentication Required',
        'Please log in to edit your profile.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      return;
    }
  }, [isAuthenticated, router]);

  const handleBackPress = () => {
    router.back();
  };

  const handleSaveProfile = async (updatedData: any) => {
    console.log('🔍 handleSaveProfile called with data:', updatedData);
    console.log('🔍 Auth state:', { isAuthenticated, hasUser: !!user, hasSession: !!session });
    
    if (!isAuthenticated || !user || !session) {
      console.log('❌ Missing authentication data');
      Alert.alert('Error', 'User session not found');
      return;
    }

    setIsLoading(true);
    try {
      const userId = session.userId || session.dbUserData?.id;
      if (!userId) {
        Alert.alert('Error', 'User ID not found');
        return;
      }

      let profilePicturePath = null;

      // Upload profile picture first if selected
      if (profileImage) {
        try {
          const uploadResult = await uploadProfilePicture(profileImage, userId);
          if (uploadResult.success) {
            profilePicturePath = uploadResult.filePath;
          } else {
            Alert.alert('Upload Error', uploadResult.message || 'Failed to upload profile picture');
            return;
          }
        } catch (uploadError) {
          console.error('Profile picture upload error:', uploadError);
          Alert.alert('Upload Error', 'Failed to upload profile picture. Please try again.');
          return;
        }
      }

      // Prepare update data
      const updateData: any = {
        first_name: updatedData.firstName,
        last_name: updatedData.lastName,
        email: updatedData.email,
        phone_number: updatedData.phoneNumber,
        house_number: updatedData.address.houseNumber,
        street_name: updatedData.address.streetName,
        barangay: updatedData.address.barangay,
        city_municipality: updatedData.address.cityMunicipality,
        province: updatedData.address.province,
        postal_code: updatedData.address.postalCode,
        birthday: updatedData.personalInfo.birthDate,
        gender: updatedData.personalInfo.gender,
        user_id: userId,
      };

      // Add profile picture path if uploaded
      if (profilePicturePath) {
        updateData.picture = profilePicturePath;
      }

      // Call API to update profile
      console.log('🔍 Making API call to update profile');
      console.log('🔍 API URL:', `${getBaseUrl()}/profile`);
      console.log('🔍 Update data:', updateData);
      
      const response = await fetch(`${getBaseUrl()}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      console.log('🔍 API response status:', response.status);

      const result = await response.json();
      console.log('🔍 API response result:', result);

      if (result.status === 'success') {
        console.log('✅ Profile update successful');
        Alert.alert(
          'Success',
          'Profile updated successfully!',
          [
            {
              text: 'OK',
              onPress: async () => {
                // Refresh profile data and wait for it to complete
                console.log('🔄 Refreshing profile data after update...');
                await refreshProfile();
                console.log('✅ Profile data refreshed, navigating back...');
                router.back();
              }
            }
          ]
        );
      } else {
        console.log('❌ Profile update failed:', result.message);
        Alert.alert('Error', result.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('❌ Profile update error:', error);
      Alert.alert('Error', 'Network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const uploadProfilePicture = async (imageUri: string, userId: string) => {
    try {
      const formData = new FormData();
      
      // Create file object from URI - use the URI directly instead of fetching
      const timestamp = Date.now();
      const filename = `profile_${userId}_${timestamp}.jpg`;
      
      // Use the image URI directly with FormData
      formData.append('profile_picture', {
        uri: imageUri,
        type: 'image/jpeg',
        name: filename,
      } as any);
      formData.append('user_id', userId);

      const uploadResponse = await fetch(`${getBaseUrl()}/upload-profile-picture`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let the browser set it automatically with boundary
      });

      const result = await uploadResponse.json();
      
      if (result.status === 'success') {
        return {
          success: true,
          filePath: result.file_path,
          fileName: result.file_name
        };
      } else {
        return {
          success: false,
          message: result.message || 'Upload failed'
        };
      }
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        message: 'Network error during upload'
      };
    }
  };

  const handleImagePicker = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  // Show loading state if profile is not loaded yet
  if (!passengerProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <Header showBackButton={true} userType="Passenger" onBackPress={handleBackPress} />
        <View style={styles.content}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header showBackButton={true} userType="Passenger" onBackPress={handleBackPress} />
      <View style={styles.content}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Profile Image Section */}
          <View style={styles.imageSection}>
            <View style={styles.imageContainer}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : passengerProfile?.picture ? (
                <Image source={{ uri: getProfilePictureUrl(passengerProfile.picture) || passengerProfile.picture }} style={styles.profileImage} />
              ) : (
                <View style={styles.placeholderImage}>
                  <Text style={styles.placeholderText}>No Photo</Text>
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.changeImageButton} onPress={handleImagePicker}>
              <Text style={styles.changeImageText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Edit Form */}
          <EditProfileForm
            initialData={passengerProfile}
            onSave={handleSaveProfile}
            isLoading={isLoading}
          />
        </ScrollView>
      </View>
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: COLORS.white,
    marginBottom: 10,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: COLORS.gray500,
    fontSize: 14,
    fontWeight: '500',
  },
  changeImageButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  changeImageText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.gray500,
  },
});
