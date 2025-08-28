// LakbAI-Mobile/app/passenger/home.tsx
import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/common/Footer';
import { HomeScreen } from '../../screens/passenger/views/HomeView';
import { COLORS } from '../../shared/styles';

export default function PassengerHome() {
  return (
    <SafeAreaView style={styles.container}>
      <Header showBackButton={false} userType="Passenger" />
      <View style={styles.content}>
        <HomeScreen />
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
