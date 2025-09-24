import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { localNotificationService, LocationNotificationData } from '../../shared/services/localNotificationService';
import { COLORS, SPACING } from '../../shared/styles';

const FONTS = {
  body3: { fontSize: 14, fontWeight: '500' as const },
  h4: { fontSize: 16, fontWeight: 'bold' as const },
  body4: { fontSize: 12, fontWeight: 'normal' as const },
  caption: { fontSize: 10, fontWeight: 'normal' as const },
};

const { width } = Dimensions.get('window');

interface LocationNotificationDisplayProps {
  routeId?: string; // Optional filter for specific routes
}

export const LocationNotificationDisplay: React.FC<LocationNotificationDisplayProps> = ({
  routeId
}) => {
  const [notification, setNotification] = useState<LocationNotificationData | null>(null);
  const [visible, setVisible] = useState(false);
  const slideAnim = useState(new Animated.Value(-100))[0];
  const opacityAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const handleNotification = (notificationData: any) => {
      // IMPORTANT: Only show location notifications to passengers, filter out earnings notifications
      if (notificationData.type === 'location_update') {
        const locationNotification = notificationData as LocationNotificationData;
        
        console.log('📍 Passenger app received location notification:', locationNotification);
        
        // Optional route filtering (if routeId is provided)
        if (routeId && locationNotification.route !== routeId) {
          console.log('📍 Filtering out notification for different route:', locationNotification.route);
          return;
        }
        
        setNotification(locationNotification);
        showNotification();
      } else {
        // Log and ignore non-location notifications (e.g., earnings notifications)
        console.log('🚫 Passenger app ignoring non-location notification:', notificationData.type);
      }
    };

    // Add listener for local notifications
    localNotificationService.addListener(handleNotification);

    return () => {
      localNotificationService.removeListener(handleNotification);
    };
  }, [routeId]);

  const showNotification = () => {
    setVisible(true);
    
    // Animate in
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-hide after 5 seconds
    setTimeout(() => {
      hideNotification();
    }, 5000);
  };

  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setNotification(null);
    });
  };

  if (!visible || !notification) {
    return null;
  }

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.notificationCard}
        onPress={hideNotification}
        activeOpacity={0.9}
      >
        <View style={styles.iconContainer}>
          <Ionicons 
            name="location" 
            size={24} 
            color={COLORS.white} 
          />
        </View>
        
        <View style={styles.contentContainer}>
          <Text style={styles.title}>📍 Driver Location Update</Text>
          <Text style={styles.location}>{notification.currentLocation}</Text>
          <Text style={styles.subtitle}>
            {notification.driverName} • {notification.jeepneyNumber}
          </Text>
          <Text style={styles.route}>
            Route: {notification.route}
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.closeButton}
          onPress={hideNotification}
        >
          <Ionicons 
            name="close" 
            size={20} 
            color={COLORS.white} 
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  notificationCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    ...FONTS.body3,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 2,
  },
  location: {
    ...FONTS.h4,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 2,
  },
  subtitle: {
    ...FONTS.body4,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: 2,
  },
  route: {
    ...FONTS.caption,
    color: COLORS.white,
    opacity: 0.8,
    fontWeight: '500',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
});
