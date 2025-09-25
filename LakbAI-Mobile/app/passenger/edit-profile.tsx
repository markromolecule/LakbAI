import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Alert, SafeAreaView, ScrollView, TouchableOpacity, Text, Image, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
  const [isUpdating, setIsUpdating] = useState(false);

  const getProfilePictureUrl = (picturePath: string | null) => {
    if (!picturePath) return null;
    
    // If it's already a full URL, return as is
    if (picturePath.startsWith('http')) {
      return picturePath;
    }
    
    // If it's a relative path, construct the full URL with cache busting
    if (picturePath.startsWith('uploads/')) {
      const baseUrl = `${getBaseUrl()}/profile-picture?path=${encodeURIComponent(picturePath)}`;
      // Add cache busting parameter to ensure fresh image
      return `${baseUrl}&t=${Date.now()}`;
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

  // Refresh profile data when screen comes into focus to ensure we have the latest data
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 Edit profile screen focused - refreshing profile data...');
      if (isAuthenticated && user) {
        refreshProfile();
      }
    }, [isAuthenticated, user, refreshProfile])
  );

  // Debug: Log when passengerProfile changes in edit profile screen (only log once to avoid spam)
  useEffect(() => {
    if (passengerProfile) {
      console.log('🔄 Edit Profile - PassengerProfile loaded:', {
        firstName: passengerProfile.firstName,
        lastName: passengerProfile.lastName,
        hasPicture: !!passengerProfile.picture
      });
    }
  }, [passengerProfile?.firstName, passengerProfile?.lastName, passengerProfile?.picture]);

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

    setIsUpdating(true);
    try {
      // For Auth0 users, we need to get the database user ID, not the Auth0 user ID
      let userId = session.userId || session.dbUserData?.id;
      
      // Check if this is an Auth0 user by examining the user.sub format
      const isAuth0User = user.sub && (user.sub.startsWith('google-oauth2|') || user.sub.startsWith('auth0|'));
      
      if (isAuth0User) {
        console.log('🔍 Auth0 user detected, using database user ID...');
        // For Auth0 users, use the database user ID from session.dbUserData
        if (session.dbUserData?.id) {
          userId = session.dbUserData.id;
          console.log('✅ Using database user ID for Auth0 user:', userId);
        } else {
          console.log('🔍 No database user ID in session, getting it from sync...');
          const sessionManager = (await import('../../shared/services/sessionManager')).default;
          const syncResult = await sessionManager.syncUserWithDatabase(user);
          if (syncResult.status === 'success' && syncResult.data?.user?.id) {
            userId = syncResult.data.user.id;
            console.log('✅ Got database user ID for Auth0 user from sync:', userId);
          } else {
            console.error('❌ Failed to get database user ID for Auth0 user');
            Alert.alert('Error', 'Failed to get user information. Please try again.');
            return;
          }
        }
      }
      
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
      console.log('🔍 Profile picture path being sent:', profilePicturePath);
      
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
      console.log('🔍 API response status:', response.status);
      console.log('🔍 API response headers:', response.headers);

      if (result.status === 'success') {
        console.log('✅ Profile update successful');
        
        // Update the session data with the new profile information
        if (session && session.dbUserData) {
          console.log('🔄 Updating session data with new profile information...');
          const updatedDbUserData = {
            ...session.dbUserData,
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
            updated_at: new Date().toISOString()
          };
          
          // Add profile picture if uploaded
          if (profilePicturePath) {
            updatedDbUserData.picture = profilePicturePath;
          }
          
          // Update the session with new data
          const updatedSession = {
            ...session,
            dbUserData: updatedDbUserData
          };
          
          // Store updated session data
          const sessionManager = (await import('../../shared/services/sessionManager')).default;
          await sessionManager.setTraditionalUserSession(updatedSession);
          console.log('✅ Session data updated with new profile information');
          
          // Force a refresh of the usePassengerState by calling refreshProfile
          // This ensures the profile data is updated immediately
          console.log('🔄 Forcing profile refresh to update UI...');
          await refreshProfile();
        }
        
        // Clear local profile image state to show updated profile picture
        setProfileImage(null);
        
        // Small delay to ensure the profile refresh is complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Navigate back to profile view to show changes immediately
        router.back();
      } else {
        console.log('❌ Profile update failed:', result.message);
        Alert.alert('Error', result.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('❌ Profile update error:', error);
      Alert.alert('Error', 'Network error occurred. Please try again.');
    } finally {
      setIsUpdating(false);
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

  // Show updating screen when profile is being saved
  if (isUpdating) {
    return (
      <SafeAreaView style={styles.container}>
        <Header showBackButton={false} userType="Passenger" />
        <View style={styles.content}>
          <View style={styles.updatingContainer}>
            <View style={styles.updatingIconContainer}>
              <Ionicons name="checkmark-circle" size={80} color={COLORS.primary} />
            </View>
            <Text style={styles.updatingTitle}>Updating Profile</Text>
            <Text style={styles.updatingSubtitle}>Please wait while we save your changes...</Text>
            <View style={styles.updatingSpinner}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          </View>
        </View>
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
  // Updating screen styles
  updatingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.white,
  },
  updatingIconContainer: {
    marginBottom: SPACING.xl,
  },
  updatingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray800,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  updatingSubtitle: {
    fontSize: 16,
    color: COLORS.gray600,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  updatingSpinner: {
    marginTop: SPACING.lg,
  },
});
