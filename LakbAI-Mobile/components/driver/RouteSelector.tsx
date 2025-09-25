import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ChevronDown, MapPin, Check } from 'lucide-react-native';
import { routeSelectorStyles } from './RouteSelector.styles';
import { getBaseUrl } from '../../config/apiConfig';

interface Route {
  id: number;
  route_name: string;
  origin: string;
  destination: string;
}

interface RouteSelectorProps {
  currentRoute: string;
  driverId: string | number;
  onRouteChange: (newRoute: string) => void;
}

export const RouteSelector: React.FC<RouteSelectorProps> = ({
  currentRoute,
  driverId,
  onRouteChange,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Load available routes from API
  const loadAvailableRoutes = async () => {
    try {
      setLoading(true);
      console.log('🛣️ Loading available routes from API...');
      
      const baseUrl = getBaseUrl().replace('/routes/api.php', '');
      const routesUrl = `${baseUrl}/routes`;
      console.log('🛣️ Routes URL:', routesUrl);
      
      const response = await fetch(routesUrl);
      console.log('🛣️ Routes response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🛣️ Routes data:', data);
        
        if (data.status === 'success' && data.routes) {
          console.log('🛣️ Available routes loaded:', data.routes);
          setRoutes(data.routes);
        } else {
          console.warn('⚠️ API returned unsuccessful response:', data);
          // Fallback to hardcoded routes
          setRoutes([
            { id: 1, route_name: 'SM Epza → SM Dasmariñas', origin: 'SM Epza', destination: 'SM Dasmariñas' },
            { id: 2, route_name: 'SM Dasmariñas → SM Epza', origin: 'SM Dasmariñas', destination: 'SM Epza' },
          ]);
        }
      } else {
        console.warn('⚠️ Failed to load routes from API:', response.status);
        // Fallback to hardcoded routes
        setRoutes([
          { id: 1, route_name: 'SM Epza → SM Dasmariñas', origin: 'SM Epza', destination: 'SM Dasmariñas' },
          { id: 2, route_name: 'SM Dasmariñas → SM Epza', origin: 'SM Dasmariñas', destination: 'SM Epza' },
        ]);
      }
    } catch (error) {
      console.error('❌ Error loading routes:', error);
      // Fallback to hardcoded routes
      setRoutes([
        { id: 1, route_name: 'SM Epza → SM Dasmariñas', origin: 'SM Epza', destination: 'SM Dasmariñas' },
        { id: 2, route_name: 'SM Dasmariñas → SM Epza', origin: 'SM Dasmariñas', destination: 'SM Epza' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Load routes when component mounts
  useEffect(() => {
    loadAvailableRoutes();
  }, []);

  const handleRouteSelect = async (selectedRoute: Route) => {
    if (selectedRoute.route_name === currentRoute) {
      setIsModalVisible(false);
      return;
    }

    setUpdating(true);
    
    try {
      const baseUrl = getBaseUrl().replace('/routes/api.php', '');
      const apiUrl = `${baseUrl}/api/mobile/driver/route/${driverId}`;
      console.log('🔄 Updating driver route:', {
        driverId,
        routeId: selectedRoute.id,
        routeName: selectedRoute.route_name,
        apiUrl
      });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route_id: selectedRoute.id,
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      console.log('📡 Route update response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      const result = await response.json();
      console.log('📦 Route update result:', result);

      if (result.status === 'success') {
        onRouteChange(selectedRoute.route_name);
        setIsModalVisible(false);
        Alert.alert(
          'Route Updated',
          `Your route has been changed to ${selectedRoute.route_name}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Error',
          result.message || 'Failed to update route',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error updating route:', error);
      
      let errorMessage = 'Failed to update route. Please try again.';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. Please check your connection and try again.';
        } else if (error.message.includes('Network request failed')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Unable to connect to server. Please check your connection and try again.';
        }
      }
      
      Alert.alert(
        'Error',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setUpdating(false);
    }
  };

  const renderRouteItem = ({ item }: { item: Route }) => (
    <TouchableOpacity
      style={[
        routeSelectorStyles.routeItem,
        currentRoute === item.route_name && routeSelectorStyles.routeItemSelected,
      ]}
      onPress={() => handleRouteSelect(item)}
      disabled={updating}
    >
      <View style={routeSelectorStyles.routeItemContent}>
        <View style={routeSelectorStyles.routeItemHeader}>
          <MapPin size={20} color="#3B82F6" />
          <Text style={routeSelectorStyles.routeItemName}>{item.route_name}</Text>
          {currentRoute === item.route_name && (
            <Check size={20} color="#16A34A" />
          )}
        </View>
        <Text style={routeSelectorStyles.routeItemDetails}>
          From: {item.origin} → To: {item.destination}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={routeSelectorStyles.routeSelectorContainer}>
      <TouchableOpacity
        style={routeSelectorStyles.routeSelectorButton}
        onPress={() => setIsModalVisible(true)}
        disabled={updating}
      >
        <View style={routeSelectorStyles.routeSelectorContent}>
          <MapPin size={20} color="#3B82F6" />
          <View style={routeSelectorStyles.routeSelectorText}>
            <Text style={routeSelectorStyles.routeSelectorLabel}>Current Route:</Text>
            <Text style={routeSelectorStyles.routeSelectorValue}>{currentRoute}</Text>
          </View>
          <ChevronDown size={20} color="#6B7280" />
        </View>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={routeSelectorStyles.routeModalContainer}>
          <View style={routeSelectorStyles.routeModalHeader}>
            <Text style={routeSelectorStyles.routeModalTitle}>Select Route</Text>
            <TouchableOpacity
              style={routeSelectorStyles.routeModalCloseButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={routeSelectorStyles.routeModalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <Text style={routeSelectorStyles.routeModalSubtitle}>
            Choose your preferred route to update your assignment
          </Text>

          {updating && (
            <View style={routeSelectorStyles.routeUpdatingContainer}>
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text style={routeSelectorStyles.routeUpdatingText}>Updating route...</Text>
            </View>
          )}

          {loading ? (
            <View style={routeSelectorStyles.routeLoadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={routeSelectorStyles.routeLoadingText}>Loading routes...</Text>
            </View>
          ) : routes.length === 0 ? (
            <View style={routeSelectorStyles.routeEmptyContainer}>
              <Text style={routeSelectorStyles.routeEmptyText}>No routes available</Text>
              <TouchableOpacity 
                style={routeSelectorStyles.routeRetryButton}
                onPress={loadAvailableRoutes}
              >
                <Text style={routeSelectorStyles.routeRetryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={routes}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderRouteItem}
              style={routeSelectorStyles.routeList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </Modal>
    </View>
  );
};
