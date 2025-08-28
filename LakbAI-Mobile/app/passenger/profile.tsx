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
import { getUserSession, isGuestSession } from '../../shared/utils/authUtils';

export default function PassengerProfile() {
  const router = useRouter();
  const { passengerProfile } = usePassengerState();
  const { submitApplication, isSubmitting, error, clearError } = useDiscountState();
  const [guest, setGuest] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      setGuest(await isGuestSession());
    };
    load();
  }, []);

  // Clear error when modal is closed
  useEffect(() => {
    if (!showDiscountModal) {
      clearError();
    }
  }, [showDiscountModal, clearError]);

  const profileForDisplay = useMemo(() => {
    if (!guest) return passengerProfile;
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
  }, [guest, passengerProfile]);

  const handleBackPress = () => {
    router.back();
  };

  const handleEditProfile = () => {
    // Navigate to edit profile screen (to be implemented)
    // router.push('/passenger/edit-profile');
    console.log('Edit profile pressed');
  };

  const handleApplyForDiscount = () => {
    if (guest) {
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

  return (
    <SafeAreaView style={styles.container}>
      <Header showBackButton={true} userType={guest ? 'Passenger' : 'Passenger'} onBackPress={handleBackPress} />
      <View style={styles.content}>
        <ProfileView 
          passengerProfile={profileForDisplay}
          onEditProfile={guest ? undefined : handleEditProfile}
          onApplyForDiscount={handleApplyForDiscount}
        />
      </View>
      <Footer />

      {/* Discount Application Modal */}
      <DiscountApplicationModal
        visible={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        onSubmit={handleDiscountSubmission}
        currentDiscountType={profileForDisplay.fareDiscount.type}
        currentDocument={profileForDisplay.fareDiscount.document}
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
});
