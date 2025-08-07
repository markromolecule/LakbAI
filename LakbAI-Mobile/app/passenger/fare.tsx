// LakbAI-Mobile/app/passenger/fare.tsx
import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/common/Footer';
import { FareCalculatorScreen } from '../../screens/passenger/views/FareCalculatorScreen';
import { COLORS } from '../../shared/styles';

export default function PassengerFare() {
  const router = useRouter();

  const handleBackPress = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header showBackButton={true} userType="Passenger" onBackPress={handleBackPress} />
      <View style={styles.content}>
        <FareCalculatorScreen />
      </View>
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.white 
  },
  content: {
    flex: 1
  }
});