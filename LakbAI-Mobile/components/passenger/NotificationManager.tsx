import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Switch, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../common';
import { COLORS, SPACING } from '../../shared/styles';
import { getBaseUrl } from '../../config/apiConfig';

interface Route {
  id: number;
  route_name: string;
  origin: string;
  destination: string;
}

interface Notification {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  data: any;
  created_at: string;
  read_at: string | null;
}

interface NotificationManagerProps {
  userId: number;
  visible: boolean;
  onClose: () => void;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({
  userId,
  visible,
  onClose
}) => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [subscriptions, setSubscriptions] = useState<{ [key: number]: boolean }>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'history'>('subscriptions');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && userId) {
      fetchRoutes();
      fetchNotificationHistory();
    }
  }, [visible, userId]);

  const fetchRoutes = async () => {
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/admin/routes`);
      const data = await response.json();

      if (data.status === 'success') {
        setRoutes(data.routes || []);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const fetchNotificationHistory = async () => {
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/mobile/notifications/history/${userId}?limit=20`);
      const data = await response.json();

      if (data.status === 'success') {
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notification history:', error);
    }
  };

  const handleSubscriptionToggle = async (routeId: number, isSubscribed: boolean) => {
    setLoading(true);
    try {
      const baseUrl = getBaseUrl();
      const url = isSubscribed 
        ? `${baseUrl}/api/mobile/notifications/subscribe`
        : `${baseUrl}/api/mobile/notifications/unsubscribe`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          passenger_id: userId,
          route_id: routeId,
          preference: 'all'
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        setSubscriptions(prev => ({
          ...prev,
          [routeId]: isSubscribed
        }));
        
        Alert.alert(
          'Success',
          isSubscribed 
            ? 'You will now receive arrival notifications for this route'
            : 'Notification subscription has been disabled for this route'
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to update subscription');
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/mobile/notifications/read/${notificationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId
              ? { ...notif, read_at: new Date().toISOString() }
              : notif
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'location_update':
        return 'location';
      case 'arrival_estimate':
        return 'time';
      case 'route_change':
        return 'swap-horizontal';
      case 'emergency':
        return 'warning';
      default:
        return 'notifications';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notification Settings</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.dark} />
          </TouchableOpacity>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'subscriptions' && styles.activeTab
            ]}
            onPress={() => setActiveTab('subscriptions')}
          >
            <Ionicons 
              name="notifications" 
              size={20} 
              color={activeTab === 'subscriptions' ? COLORS.primary : COLORS.gray} 
            />
            <Text style={[
              styles.tabText,
              activeTab === 'subscriptions' && styles.activeTabText
            ]}>
              Subscriptions
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'history' && styles.activeTab
            ]}
            onPress={() => setActiveTab('history')}
          >
            <Ionicons 
              name="time" 
              size={20} 
              color={activeTab === 'history' ? COLORS.primary : COLORS.gray} 
            />
            <Text style={[
              styles.tabText,
              activeTab === 'history' && styles.activeTabText
            ]}>
              History
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {activeTab === 'subscriptions' ? (
            <View>
              <Text style={styles.sectionTitle}>Route Notifications</Text>
              <Text style={styles.sectionSubtitle}>
                Get notified when jeepneys arrive at checkpoints on these routes
              </Text>

              {routes.map((route) => (
                <Card key={route.id} style={styles.routeCard}>
                  <View style={styles.routeHeader}>
                    <View style={styles.routeInfo}>
                      <Text style={styles.routeName}>{route.route_name}</Text>
                      <Text style={styles.routeDetails}>
                        {route.origin} → {route.destination}
                      </Text>
                    </View>
                    <Switch
                      value={subscriptions[route.id] || false}
                      onValueChange={(value) => handleSubscriptionToggle(route.id, value)}
                      disabled={loading}
                      trackColor={{ false: COLORS.lightGray, true: COLORS.primary + '40' }}
                      thumbColor={subscriptions[route.id] ? COLORS.primary : COLORS.gray}
                    />
                  </View>
                </Card>
              ))}

              <Card style={styles.infoCard}>
                <View style={styles.infoHeader}>
                  <Ionicons name="information-circle" size={24} color={COLORS.info} />
                  <Text style={styles.infoTitle}>How it works</Text>
                </View>
                <Text style={styles.infoText}>
                  • Receive real-time notifications when jeepneys scan checkpoint QR codes{'\n'}
                  • Get estimated arrival times: "Next Jeep Arrival – 5-7 mins"{'\n'}
                  • Stay updated on multiple drivers on the same route{'\n'}
                  • Notifications are sent only when drivers are actively scanning checkpoints
                </Text>
              </Card>
            </View>
          ) : (
            <View>
              <Text style={styles.sectionTitle}>Notification History</Text>
              <Text style={styles.sectionSubtitle}>
                Recent arrival notifications and updates
              </Text>

              {notifications.length === 0 ? (
                <Card style={styles.emptyCard}>
                  <View style={styles.emptyContainer}>
                    <Ionicons name="notifications-off" size={48} color={COLORS.gray} />
                    <Text style={styles.emptyTitle}>No Notifications Yet</Text>
                    <Text style={styles.emptySubtitle}>
                      Subscribe to routes to start receiving arrival notifications
                    </Text>
                  </View>
                </Card>
              ) : (
                notifications.map((notification) => (
                  <TouchableOpacity
                    key={notification.id}
                    onPress={() => !notification.read_at && handleMarkAsRead(notification.id)}
                  >
                    <Card style={[
                      styles.notificationCard,
                      !notification.read_at && styles.unreadNotification
                    ]}>
                      <View style={styles.notificationHeader}>
                        <View style={styles.notificationIcon}>
                          <Ionicons 
                            name={getNotificationIcon(notification.notification_type)} 
                            size={20} 
                            color={COLORS.primary} 
                          />
                        </View>
                        <View style={styles.notificationContent}>
                          <Text style={styles.notificationTitle}>
                            {notification.title}
                          </Text>
                          <Text style={styles.notificationMessage}>
                            {notification.message}
                          </Text>
                          {notification.data?.estimated_arrival && (
                            <Text style={styles.notificationETA}>
                              ETA: {notification.data.estimated_arrival}
                            </Text>
                          )}
                        </View>
                        <View style={styles.notificationMeta}>
                          <Text style={styles.notificationTime}>
                            {formatTimeAgo(notification.created_at)}
                          </Text>
                          {!notification.read_at && (
                            <View style={styles.unreadDot} />
                          )}
                        </View>
                      </View>
                    </Card>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: COLORS.dark,
  },
  tabContainer: {
    flexDirection: 'row' as const,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: SPACING.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: COLORS.gray,
    marginLeft: SPACING.xs,
  },
  activeTabText: {
    color: COLORS.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.dark,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: SPACING.md,
  },
  routeCard: {
    marginBottom: SPACING.sm,
  },
  routeHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  routeInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.dark,
  },
  routeDetails: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
  },
  infoCard: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.info + '10',
  },
  infoHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: SPACING.sm,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.info,
    marginLeft: SPACING.xs,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.dark,
    lineHeight: 20,
  },
  emptyCard: {
    marginTop: SPACING.md,
  },
  emptyContainer: {
    alignItems: 'center' as const,
    paddingVertical: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.dark,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center' as const,
    marginTop: SPACING.xs,
  },
  notificationCard: {
    marginBottom: SPACING.sm,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  notificationHeader: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '10',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: SPACING.sm,
  },
  notificationContent: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.dark,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 18,
  },
  notificationETA: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.success,
    marginTop: 4,
  },
  notificationMeta: {
    alignItems: 'flex-end' as const,
  },
  notificationTime: {
    fontSize: 12,
    color: COLORS.gray,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: 4,
  },
};

export default NotificationManager;
