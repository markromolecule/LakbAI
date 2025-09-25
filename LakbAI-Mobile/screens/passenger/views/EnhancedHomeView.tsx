import React, { useState, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { PassengerRoutes, PassengerRouteHref } from '../../../routes/PassengerRoutes';
import { COLORS } from '../../../shared/styles';
import { globalStyles } from '../../../shared/styles/globalStyles';
import { useAuthContext } from '../../../shared/providers/AuthProvider';
import { ArrivalTracker } from '../../../components/passenger/ArrivalTracker';
import { NotificationManager } from '../../../components/passenger/NotificationManager';
import { LocationNotificationDisplay } from '../../../components/passenger/LocationNotificationDisplay';
import DriverLocationCard from '../components/DriverLocationCard';
import styles from '../styles/HomeScreen.styles';
import type { Href } from 'expo-router';

const GridItem: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  borderColor: string;
  onPress: () => void;
  badge?: number;
}> = ({ icon, title, subtitle, color, borderColor, onPress, badge }) => (
  <TouchableOpacity style={[styles.gridItem, { borderColor }]} onPress={onPress}>
    <View style={styles.gridIconContainer}>
      <Ionicons name={icon} size={32} color={color} />
      {badge && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </View>
    <Text style={styles.gridTitle}>{title}</Text>
    <Text style={styles.gridSubtitle}>{subtitle}</Text>
  </TouchableOpacity>
);

export const EnhancedHomeView: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading, userSession } = useAuthContext();
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<number>(1); // Default to route 1
  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      // This will run every time the screen comes into focus
      // Could fetch unread notification count here
    }, [])
  );

  const handleNotificationPress = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'Please log in to manage your notification settings.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Login',
            onPress: () => router.replace('/'),
          },
        ]
      );
      return;
    }
    setNotificationModalVisible(true);
  };

  const handleSubscribeToNotifications = () => {
    setNotificationModalVisible(true);
  };

  const gridItems: Array<{
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    color: string;
    borderColor: string;
    route?: PassengerRouteHref;
    onPress?: () => void;
    badge?: number;
  }> = [
    {
      icon: 'qr-code',
      title: 'Scan QR Code',
      subtitle: isAuthenticated ? 'Get fare info' : 'Login required',
      color: COLORS.primary,
      borderColor: COLORS.primaryLight,
      onPress: () => {
        if (!isAuthenticated) {
          Alert.alert(
            'Login required',
            'Please log in first to use Scan QR Code.',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/'),
              },
            ],
            { cancelable: false }
          );
          return;
        }
        router.push(PassengerRoutes.SCANNER as Href);
      }
    },
    {
      icon: 'notifications',
      title: 'Notifications',
      subtitle: isAuthenticated ? 'Arrival alerts' : 'Login required',
      color: COLORS.warning,
      borderColor: COLORS.orangeLight,
      onPress: handleNotificationPress,
      badge: unreadCount
    },
    {
      icon: 'chatbubble',
      title: 'BiyaBot',
      subtitle: isAuthenticated ? 'Ask questions' : 'Login required',
      color: COLORS.success,
      borderColor: COLORS.successBiya,
      onPress: () => {
        if (!isAuthenticated) {
          Alert.alert(
            'Restricted',
            'Please log in to use BiyaBot.',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/'),
              },
            ],
            { cancelable: false }
          );
          return;
        }
        router.push(PassengerRoutes.CHAT as Href);
      }
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
    '3. Get real-time arrival notifications',
    '4. Ask the AI assistant any questions'
  ];

  return (
    <ScrollView style={globalStyles.container}>
      {/* Location Notifications */}
      <LocationNotificationDisplay routeId={selectedRouteId.toString()} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Welcome to LakbAI</Text>
        <Text style={styles.headerSubtitle}>Your smart jeepney companion</Text>
      </View>

      {/* Real-time Arrival Tracker */}
      {isAuthenticated && (
        <View style={styles.arrivalSection}>
          <View style={styles.arrivalHeader}>
            <Text style={styles.arrivalTitle}>🚍 Live Jeepney Arrivals</Text>
            <TouchableOpacity 
              style={styles.routeSelector}
              onPress={() => {
                // Could open a route selector modal here
                Alert.alert(
                  'Route Selection',
                  'Select a route to track arrivals',
                  [
                    { text: 'SM Epza → SM Dasmariñas', onPress: () => setSelectedRouteId(1) },
                    { text: 'SM Dasmariñas → SM Epza', onPress: () => setSelectedRouteId(2) },
                    { text: 'Cancel', style: 'cancel' }
                  ]
                );
              }}
            >
              <Text style={styles.routeSelectorText}>Change Route</Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.arrivalTrackerContainer}>
            <ArrivalTracker
              routeId={selectedRouteId}
              showSubscribeButton={true}
              onSubscribe={handleSubscribeToNotifications}
            />
          </View>
        </View>
      )}

      <View style={styles.gridContainer}>
        {gridItems.map((item, index) => (
          <GridItem
            key={index}
            icon={item.icon}
            title={item.title}
            subtitle={item.subtitle}
            color={item.color}
            borderColor={item.borderColor}
            onPress={item.onPress || (() => router.push(item.route as Href))}
            badge={item.badge}
          />
        ))}
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>How to use LakbAI:</Text>
        {infoItems.map((item, index) => (
          <View key={index} style={styles.infoItem}>
            <Text style={styles.infoText}>{item}</Text>
          </View>
        ))}
      </View>

      {/* Driver Location Tracking */}
      {isAuthenticated && (
        <View style={styles.driverLocationSection}>
          <Text style={styles.sectionTitle}>🚍 Driver Location Updates</Text>
          <DriverLocationCard />
        </View>
      )}

      {/* Enhanced features section */}
      <View style={styles.featuresSection}>
        <Text style={styles.featuresTitle}>✨ New Features</Text>
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Ionicons name="time" size={20} color={COLORS.success} />
            <Text style={styles.featureText}>Real-time arrival estimates</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="notifications" size={20} color={COLORS.warning} />
            <Text style={styles.featureText}>Smart notification system</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="people" size={20} color={COLORS.primary} />
            <Text style={styles.featureText}>Multiple driver tracking</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="location" size={20} color={COLORS.purple} />
            <Text style={styles.featureText}>Live location updates</Text>
          </View>
        </View>
      </View>

      {/* Notification Manager Modal */}
      <NotificationManager
        userId={userSession?.dbUserData?.id || 0}
        visible={notificationModalVisible}
        onClose={() => setNotificationModalVisible(false)}
      />
    </ScrollView>
  );
};

// Enhanced styles extending the existing ones
const enhancedStyles = {
  ...styles,
  arrivalSection: {
    margin: 16,
    marginBottom: 8,
  },
  arrivalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  arrivalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.dark,
  },
  routeSelector: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
  },
  routeSelectorText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500' as const,
    marginRight: 4,
  },
  arrivalTrackerContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxHeight: 300,
  },
  gridIconContainer: {
    position: 'relative' as const,
    marginBottom: 8,
  },
  badge: {
    position: 'absolute' as const,
    top: -4,
    right: -4,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '600' as const,
  },
  featuresSection: {
    margin: 16,
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.dark,
    marginBottom: 12,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.dark,
    marginLeft: 8,
  },
};

// Merge enhanced styles with existing styles
Object.assign(styles, enhancedStyles);

export default EnhancedHomeView;
