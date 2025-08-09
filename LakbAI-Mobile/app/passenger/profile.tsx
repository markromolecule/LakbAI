// LakbAI-Mobile/app/passenger/profile.tsx
import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/common/Footer';
import { ProfileView } from '../../screens/passenger/views/ProfileView';
import { usePassengerState } from '../../screens/passenger/hooks/usePassengerState';
import { COLORS } from '../../shared/styles';

export default function PassengerProfile() {
  const router = useRouter();
  const { passengerProfile } = usePassengerState();

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
      <Header showBackButton={true} userType="Passenger" onBackPress={handleBackPress} />
      <View style={styles.content}>
        <ProfileView 
          passengerProfile={passengerProfile}
          onEditProfile={handleEditProfile}
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
