// LakbAI-Mobile/app/passenger/scanner.tsx
import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/common/Footer';
import { ScannerScreen } from '../../screens/passenger/views/ScannerView';
import { COLORS } from '../../shared/styles';
import { getUserSession, isGuestSession } from '../../shared/utils/authUtils';

export default function PassengerScanner() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const guest = await isGuestSession();
      const session = await getUserSession();
      if (guest || !session.username) {
        Alert.alert(
          'Login required',
          'Please log in first to use Scan QR Code.',
          [
            {
              text: 'OK',
              onPress: () => setTimeout(() => router.replace('/'), 150),
            },
          ],
          { cancelable: false }
        );
        return;
      }
      setAllowed(true);
    };
    checkAccess();
  }, [router]);

  const handleBackPress = () => {
    router.back();
  };

  if (!allowed) {
    return (
      <SafeAreaView style={styles.container} />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header showBackButton={true} userType="Passenger" onBackPress={handleBackPress} />
      <View style={styles.content}>
        <ScannerScreen />
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
    flex: 1,
    backgroundColor: COLORS.white
  }
});