import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { localNotificationService, EarningsNotificationData } from '../../shared/services/localNotificationService';
import { COLORS, SPACING } from '../../shared/styles';

const FONTS = {
  body3: { fontSize: 14, fontWeight: '500' as const },
  h3: { fontSize: 18, fontWeight: 'bold' as const },
  body4: { fontSize: 12, fontWeight: 'normal' as const },
  caption: { fontSize: 10, fontWeight: 'normal' as const },
};

const { width } = Dimensions.get('window');

interface EarningsNotificationDisplayProps {
  driverId: string;
}

export const EarningsNotificationDisplay: React.FC<EarningsNotificationDisplayProps> = ({
  driverId
}) => {
  const [notification, setNotification] = useState<EarningsNotificationData | null>(null);
  const [visible, setVisible] = useState(false);
  const slideAnim = useState(new Animated.Value(-100))[0];
  const opacityAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const handleNotification = (notificationData: any) => {
      // Only show earnings notifications for this driver
      if (notificationData.type === 'earnings_update' && notificationData.driverId === driverId) {
        const earningsNotification = notificationData as EarningsNotificationData;
        setNotification(earningsNotification);
        showNotification();
      }
    };

    // Add listener for local notifications
    localNotificationService.addListener(handleNotification);

    return () => {
      localNotificationService.removeListener(handleNotification);
    };
  }, [driverId]);

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

    // Auto-hide after 4 seconds
    setTimeout(() => {
      hideNotification();
    }, 4000);
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

  const amountDifference = notification.newEarnings - notification.previousEarnings;

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
            name="wallet" 
            size={24} 
            color={COLORS.white} 
          />
        </View>
        
        <View style={styles.contentContainer}>
          <Text style={styles.title}>💰 Payment Received!</Text>
          <Text style={styles.amount}>+₱{notification.amount}</Text>
          {notification.senderName && (
            <Text style={styles.senderName}>
              from {notification.senderName}
            </Text>
          )}
          <Text style={styles.subtitle}>
            Today's Total: ₱{notification.newEarnings}
          </Text>
          <Text style={styles.paymentMethod}>
            via {notification.paymentMethod?.toUpperCase() || 'Payment'}
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
    backgroundColor: COLORS.success,
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
  amount: {
    ...FONTS.h3,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 2,
  },
  senderName: {
    ...FONTS.body4,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: 2,
    fontStyle: 'italic',
  },
  subtitle: {
    ...FONTS.body4,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: 2,
  },
  paymentMethod: {
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
