// LakbAI-Mobile/app/passenger/home.tsx
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/common/Footer';
import { HomeScreen } from '../../screens/passenger/views/HomeView';
import { COLORS } from '../../shared/styles';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PassengerHome() {
  const router = useRouter();
  const [showBackButton, setShowBackButton] = useState(false);
  const hideActiveTripViewRef = useRef<(() => void) | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Don't automatically show back button - only show when user actively views My Trip
  useEffect(() => {
    // Initialize with no back button
    setShowBackButton(false);
    
    // Mark as initialized after a delay
    const timer = setTimeout(() => {
      setIsInitialized(true);
      console.log('✅ PassengerHome initialized');
    }, 2000); // Increased to 2 seconds
    
    return () => clearTimeout(timer);
  }, []);

  const handleBackPress = () => {
    console.log('🔙 Back button pressed - hiding active trip view');
    // Hide the active trip view and back button
    setShowBackButton(false);
    // Also call the hideActiveTripView function from HomeScreen
    if (hideActiveTripViewRef.current) {
      console.log('🔙 Calling hideActiveTripView function');
      hideActiveTripViewRef.current();
    } else {
      console.log('⚠️ hideActiveTripView function not available');
    }
  };

  const handleShowBackButton = () => {
    console.log('🔙 Showing back button');
    setShowBackButton(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        showBackButton={showBackButton} 
        userType="Passenger" 
        onBackPress={handleBackPress}
        title={showBackButton ? "My Trip" : undefined}
      />
      <View style={styles.content}>
        <HomeScreen 
          onBackButtonPress={() => {
            if (isInitialized) {
              setShowBackButton(false);
            }
          }} 
          onShowBackButton={handleShowBackButton}
          onHideActiveTripView={(hideFunction) => {
            hideActiveTripViewRef.current = hideFunction;
          }}
        />
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
