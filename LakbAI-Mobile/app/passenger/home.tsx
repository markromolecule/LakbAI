// app/passenger/home.tsx
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/common/Footer';
import HomeScreen from '../../screens/passenger/views/HomeScreen';
import { COLORS } from '../../shared/styles';

export default function PassengerHome() {
  return (
    <SafeAreaView style={styles.container}>
      <Header showBackButton={false} userType="Passenger" />
      <HomeScreen />
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white }
});
