// LakbAI-Mobile/app/passenger/profile.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/common/Footer';
import { ProfileView } from '../../screens/passenger/views/ProfileView';
import { usePassengerState } from '../../screens/passenger/hooks/usePassengerState';
import { COLORS } from '../../shared/styles';
import { getUserSession, isGuestSession } from '../../shared/utils/authUtils';

export default function PassengerProfile() {
  const router = useRouter();
  const { passengerProfile } = usePassengerState();
  const [guest, setGuest] = useState(false);

  useEffect(() => {
    const load = async () => {
      setGuest(await isGuestSession());
    };
    load();
  }, []);

  const profileForDisplay = useMemo(() => {
    if (!guest) return passengerProfile;
    return {
      ...passengerProfile,
      firstName: 'Guest',
      lastName: '',
      email: 'guest@lakbai.app',
      phoneNumber: 'N/A',
      username: 'guest',
      fareDiscount: { type: '', document: null },
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

  return (
    <SafeAreaView style={styles.container}>
      <Header showBackButton={true} userType={guest ? 'Passenger' : 'Passenger'} onBackPress={handleBackPress} />
      <View style={styles.content}>
        <ProfileView 
          passengerProfile={profileForDisplay}
          onEditProfile={guest ? undefined : handleEditProfile}
        />
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
});
