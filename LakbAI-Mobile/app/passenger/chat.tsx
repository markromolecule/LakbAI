// LakbAI-Mobile/app/passenger/chat.tsx
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/common/Footer';
import { ChatScreen } from '../../screens/passenger/views/ChatScreen';
import { COLORS } from '../../shared/styles';

export default function PassengerChat() {
  const router = useRouter();

  const handleBackPress = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header showBackButton={true} userType="Passenger" onBackPress={handleBackPress} />
      <ChatScreen />
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white }
});