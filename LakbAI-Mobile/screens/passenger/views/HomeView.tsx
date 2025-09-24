// screens/passenger/views/HomeScreen.tsx
import React, { useCallback, useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { PassengerRoutes, PassengerRouteHref } from '../../../routes/PassengerRoutes';
import { COLORS } from '../../../shared/styles';
import { globalStyles } from '../../../shared/styles/globalStyles';
import { useAuthContext } from '../../../shared/providers/AuthProvider';
import styles from '../styles/HomeScreen.styles';
import DriverLocationCard from '../components/DriverLocationCard';
import { getBaseUrl } from '../../../config/apiConfig';
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

interface Route {
  id: number;
  route_name: string;
  origin: string;
  destination: string;
  description?: string;
  fare_base?: string;
  checkpoints?: Array<{
    checkpoint_name: string;
    sequence_order: number;
    fare_from_origin: string;
    is_origin: number;
    is_destination: number;
  }>;
}

export const HomeScreen: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthContext();
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [loadingRoutes, setLoadingRoutes] = useState(false);

  // Load available routes
  const loadRoutes = async () => {
    try {
      setLoadingRoutes(true);
      console.log('🛣️ Loading routes from API...');
      
      // Get base URL and construct the correct routes endpoint
      const baseUrl = getBaseUrl();
      const routesUrl = `${baseUrl}/routes`;
      console.log('🛣️ Routes URL:', routesUrl);
      
      const response = await fetch(routesUrl);
      console.log('🛣️ Routes response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🛣️ Routes data:', data);
        
        if (data.status === 'success' && data.routes) {
          // All routes from API are active (no status filtering needed)
          console.log('🛣️ Available routes:', data.routes);
          
          setRoutes(data.routes);
          
          // Set default route to first one if none selected
          if (!selectedRoute && data.routes.length > 0) {
            setSelectedRoute(data.routes[0]);
            console.log('🛣️ Default route set:', data.routes[0]);
          }
        } else {
          console.warn('🛣️ No routes found in response');
        }
      } else {
        console.error('🛣️ Failed to fetch routes:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('🛣️ Error loading routes:', error);
    } finally {
      setLoadingRoutes(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  // Auto-refresh routes every 30 seconds to get updated fare information
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing routes...');
      loadRoutes();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  useFocusEffect(
    useCallback(() => {
      // This will run every time the screen comes into focus
    }, [])
  );

  const gridItems: Array<{
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    color: string;
    borderColor: string;
    route?: PassengerRouteHref;
    onPress?: () => void;
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
            onPress={item.onPress || (() => router.push(item.route as Href))}
          />
        ))}
      </View>

      {/* Compact Route Selector */}
      {isAuthenticated && selectedRoute && (
        <View style={styles.compactRouteSelector}>
          <View style={styles.compactRouteInfo}>
            <View style={styles.compactRouteText}>
              <Text style={styles.compactRouteName} numberOfLines={1}>
                {selectedRoute.route_name}
              </Text>
              <Text style={styles.compactRouteDetails} numberOfLines={1}>
                {selectedRoute.origin} → {selectedRoute.destination}
              </Text>
            </View>
            <View style={styles.compactRouteActions}>
              <Text style={styles.compactRouteFare}>
                ₱{selectedRoute.fare_base || '13.00'}
              </Text>
              <TouchableOpacity 
                style={styles.compactRouteButton}
                onPress={() => {
                  console.log('🛣️ Opening route modal, current routes:', routes);
                  setShowRouteModal(true);
                }}
              >
                <Ionicons name="swap-horizontal" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Driver Location Tracking */}
      {isAuthenticated && selectedRoute && (
        <View style={styles.driverLocationSection}>
          <DriverLocationCard routeId={selectedRoute.id.toString()} />
        </View>
      )}

      {/* Info section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>How to use LakbAI:</Text>
        {infoItems.map((item, index) => (
          <Text key={index} style={styles.infoItem}>{item}</Text>
        ))}
      </View>

      {/* Route Selection Modal */}
      <Modal
        visible={showRouteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRouteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Route</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowRouteModal(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.gray600} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.routesList}>
              {loadingRoutes ? (
                <Text style={styles.loadingText}>Loading routes...</Text>
              ) : routes.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No routes available</Text>
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={loadRoutes}
                  >
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                routes.map((route) => (
                  <TouchableOpacity
                    key={route.id}
                    style={[
                      styles.routeItem,
                      selectedRoute?.id === route.id && styles.selectedRouteItem
                    ]}
                    onPress={() => {
                      console.log('🛣️ Route selected:', route);
                      setSelectedRoute(route);
                      setShowRouteModal(false);
                    }}
                  >
                    <View style={styles.routeItemContent}>
                      <Text style={styles.routeItemName}>{route.route_name}</Text>
                      <Text style={styles.routeItemDetails}>
                        {route.origin} → {route.destination}
                      </Text>
                      <Text style={styles.routeItemFare}>₱{route.fare_base || '8.00'}</Text>
                    </View>
                    {selectedRoute?.id === route.id && (
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default HomeScreen;