// LakbAI-Mobile/app/passenger/chat.tsx
import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/common/Footer';
import { ChatScreen } from '../../screens/passenger/views/ChatView';
import { COLORS } from '../../shared/styles';
import { useAuthContext } from '../../shared/providers/AuthProvider';

export default function PassengerChat() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const { isAuthenticated, isLoading } = useAuthContext();

  useEffect(() => {
    const checkAccess = async () => {
      if (isLoading) return; // Wait for auth state to load
      
      if (!isAuthenticated) {
        Alert.alert(
          'Restricted',
          'Please log in to use BiyaBot.',
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
  }, [router, isAuthenticated, isLoading]);

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
        <ChatScreen />
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