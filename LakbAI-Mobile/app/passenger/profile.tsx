// LakbAI-Mobile/app/passenger/profile.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/common/Footer';
import { ProfileView } from '../../screens/passenger/views/ProfileView';
import { DiscountApplicationModal } from '../../components/common/DiscountApplicationModal';
import { usePassengerState } from '../../screens/passenger/hooks/usePassengerState';
import { useDiscountState } from '../../screens/passenger/hooks/useDiscountState';
import { DiscountApplication } from '../../shared/services/discountService';
import { COLORS } from '../../shared/styles';
import { useAuthContext } from '../../shared/providers/AuthProvider';

export default function PassengerProfile() {
  const router = useRouter();
  const { passengerProfile, refreshProfile } = usePassengerState();
  const { submitApplication, isSubmitting, error, clearError } = useDiscountState();
  const { isAuthenticated, isLoading, user } = useAuthContext();
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  // Refresh profile data when component mounts
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshProfile();
    }
  }, [isAuthenticated, user, refreshProfile]);

  // Clear error when modal is closed
  useEffect(() => {
    if (!showDiscountModal) {
      clearError();
    }
  }, [showDiscountModal, clearError]);

  const profileForDisplay = useMemo(() => {
    if (isAuthenticated && user) return passengerProfile;
    return {
      ...passengerProfile,
      firstName: 'Guest',
      lastName: '',
      email: 'guest@lakbai.app',
      phoneNumber: 'N/A',
      username: 'guest',
      fareDiscount: { 
        type: '' as const, 
        status: 'none' as const,
        percentage: 0,
        document: null 
      },
    };
  }, [isAuthenticated, user, passengerProfile]);

  const handleBackPress = () => {
    router.back();
  };

  const handleEditProfile = () => {
    // Navigate to edit profile screen (to be implemented)
    // router.push('/passenger/edit-profile');
    console.log('Edit profile pressed');
  };

  const handleApplyForDiscount = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Guest User',
        'Please log in to apply for a discount.',
        [{ text: 'OK' }]
      );
      return;
    }
    setShowDiscountModal(true);
  };

  const handleDiscountSubmission = async (discountType: string, document: any) => {
    const application: DiscountApplication = {
      discountType,
      document,
    };

    const result = await submitApplication(application);
    
    if (result.success) {
      Alert.alert(
        'Application Submitted',
        `Your ${discountType} discount application has been submitted successfully. It will be reviewed within 24-48 hours.`,
        [{ text: 'OK' }]
      );

      setShowDiscountModal(false);
      
      // In a real app, you would refresh the profile data here
      // or update the local state to reflect the pending status
      
    } else {
      Alert.alert(
        'Error',
        result.message || 'Failed to submit discount application. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          {/* Add a loading spinner here if needed */}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header showBackButton={true} userType="Passenger" onBackPress={handleBackPress} />
      <View style={styles.content}>
        <ProfileView
          passengerProfile={profileForDisplay}
          onEditProfile={handleEditProfile}
          onApplyForDiscount={handleApplyForDiscount}
        />
      </View>
      <Footer />
      
      <DiscountApplicationModal
        visible={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        onSubmit={handleDiscountSubmission}
      />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
