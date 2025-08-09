// screens/passenger/views/HomeScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { InfoCard } from '../../../components/common/InfoCard';
import { COLORS } from '../../../shared/styles';
import { globalStyles } from '../../../shared/styles/globalStyles';
import styles from '../styles/HomeScreen.styles';
import { useRouter } from 'expo-router';
import { PassengerRoutes, PassengerRouteHref } from '@/routes/PassengerRoutes';
import type { Href } from 'expo-router';

const GridItem: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  borderColor: string;
  onPress: () => void;
}> = ({ icon, title, subtitle, color, borderColor, onPress }) => (
  <TouchableOpacity style={[styles.gridItem, { borderColor }]} onPress={onPress}>
    <Ionicons name={icon} size={32} color={color} />
    <Text style={styles.gridTitle}>{title}</Text>
    <Text style={styles.gridSubtitle}>{subtitle}</Text>
  </TouchableOpacity>
);

export const HomeScreen: React.FC = () => {
  const router = useRouter();

  const gridItems: Array<{
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    color: string;
    borderColor: string;
    route: PassengerRouteHref;
  }> = [
    {
      icon: 'qr-code',
      title: 'Scan QR Code',
      subtitle: 'Get fare info',
      color: COLORS.primary,
      borderColor: COLORS.primaryLight,
      route: PassengerRoutes.SCANNER 
    },
    {
      icon: 'chatbubble',
      title: 'BiyaBot',
      subtitle: 'Ask questions',
      color: COLORS.success,
      borderColor: COLORS.successBiya,
      route: PassengerRoutes.CHAT
    },
    {
      icon: 'calculator',
      title: 'Fare Calculator',
      subtitle: 'Calculate fares',
      color: COLORS.orange,
      borderColor: COLORS.orangeLight,
      route: PassengerRoutes.FARE
    },
    {
      icon: 'map',
      title: 'Routes & Fares',
      subtitle: 'View all fares',
      color: COLORS.purple,
      borderColor: COLORS.purpleLight,
      route: PassengerRoutes.ROUTE
    },
    {
      icon: 'person',
      title: 'My Profile',
      subtitle: 'Account & settings',
      color: COLORS.gray600,
      borderColor: COLORS.gray300,
      route: PassengerRoutes.PROFILE
    }
  ];

  const infoItems = [
    '1. Scan the QR code inside the jeepney',
    '2. View your fare and route information',
    '3. Ask the AI assistant any questions',
    '4. Check arrival times and updates'
  ];

  return (
    <ScrollView style={globalStyles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Welcome to LakbAI</Text>
        <Text style={styles.headerSubtitle}>Your smart jeepney companion</Text>
      </View>

      <View style={styles.gridContainer}>
        {gridItems.map((item, index) => (
          <GridItem
            key={index}
            icon={item.icon}
            title={item.title}
            subtitle={item.subtitle}
            color={item.color}
            borderColor={item.borderColor}
            onPress={() => router.push(item.route as Href)}
          />
        ))}
      </View>

      {/* For notification : Receiver/Print */}
      <View style={styles.arrivalCard}>
        <View style={styles.arrivalContent}>
          <Ionicons name="time" size={20} color={COLORS.warning} />
          <View style={styles.arrivalText}>
            <Text style={styles.arrivalTitle}>Next Jeep Arrival</Text>
            <Text style={styles.arrivalTime}>Estimated: 5-7 minutes</Text>
          </View>
        </View>
      </View>

      <InfoCard title="How to use LakbAI:" items={infoItems} />
    </ScrollView>
  );
};

export default HomeScreen;