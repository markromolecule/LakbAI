import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { InfoCard } from '../../components/common/InfoCard';
import { COLORS, SPACING } from '../../shared/styles';
import { globalStyles } from '../../shared/styles/globalStyles';
import { ViewType } from '../../shared/types';

interface HomeScreenProps {
  onNavigate: (view: ViewType) => void;
}

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

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const gridItems = [
    {
      icon: 'qr-code' as const,
      title: 'Scan QR Code',
      subtitle: 'Get fare info',
      color: COLORS.primary,
      borderColor: COLORS.primaryLight,
      view: 'scanner' as const
    },
    {
      icon: 'chatbubble' as const,
      title: 'AI Assistant',
      subtitle: 'Ask questions',
      color: COLORS.success,
      borderColor: COLORS.successLight,
      view: 'chat' as const
    },
    {
      icon: 'calculator' as const,
      title: 'Fare Calculator',
      subtitle: 'Calculate fares',
      color: COLORS.orange,
      borderColor: COLORS.orangeLight,
      view: 'fare' as const
    },
    {
      icon: 'map' as const,
      title: 'Routes & Fares',
      subtitle: 'View all fares',
      color: COLORS.purple,
      borderColor: COLORS.purpleLight,
      view: 'route' as const
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
            {...item}
            onPress={() => onNavigate(item.view)}
          />
        ))}
      </View>

      <View style={styles.arrivalCard}>
        <View style={styles.arrivalContent}>
          <Ionicons name="time" size={20} color={COLORS.warning} />
          <View style={styles.arrivalText}>
            <Text style={styles.arrivalTitle}>Next Jeep Arrival</Text>
            <Text style={styles.arrivalTime}>Estimated: 5-7 minutes</Text>
          </View>
        </View>
      </View>

      <InfoCard
        title="How to use LakbAI:"
        items={infoItems}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.primary,
    padding: SPACING.xl,
    borderRadius: SPACING.md,
    marginBottom: SPACING.xl,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    color: COLORS.blue100,
    fontSize: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  gridItem: {
    backgroundColor: COLORS.white,
    width: '48%',
    padding: SPACING.xl,
    borderRadius: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray800,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  gridSubtitle: {
    fontSize: 12,
    color: COLORS.gray500,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  arrivalCard: {
    backgroundColor: COLORS.warningLight,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
    padding: SPACING.lg,
    borderRadius: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  arrivalContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrivalText: {
    marginLeft: SPACING.md,
  },
  arrivalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.warningDark,
  },
  arrivalTime: {
    color: COLORS.warningDark,
    fontSize: 14,
  },
});