import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import { ArrowLeft, CreditCard, MapPin, Calendar, User, Truck } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PaymentHistoryService, PaymentHistoryItem } from '../../../shared/services/paymentHistoryService';
import { useAuthContext } from '../../../shared/providers/AuthProvider';

interface PaymentHistoryViewProps {
  onBack: () => void;
}

export const PaymentHistoryView: React.FC<PaymentHistoryViewProps> = ({ onBack }) => {
  const { user, session } = useAuthContext();
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const loadPayments = useCallback(async (reset = false) => {
    // Get the database user ID from session
    let userId = null;
    
    if (session?.dbUserData?.id) {
      userId = session.dbUserData.id.toString();
    } else if (session?.userId && session.userId !== 'guest') {
      userId = session.userId;
    }
    
    if (!userId) {
      setError('User not authenticated or no database user ID found');
      setLoading(false);
      return;
    }

    try {
      const currentOffset = reset ? 0 : offset;
      
      const response = await PaymentHistoryService.getPaymentHistory(
        userId,
        limit,
        currentOffset
      );

      if (response.status === 'success') {
        if (reset) {
          setPayments(response.payments);
          setOffset(limit);
        } else {
          setPayments(prev => [...prev, ...response.payments]);
          setOffset(prev => prev + limit);
        }
        setHasMore(response.payments.length === limit);
        setError(null);
      } else {
        setError('Failed to load payment history');
      }
    } catch (err) {
      console.error('Error loading payments:', err);
      setError('Failed to load payment history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.dbUserData?.id, session?.userId, offset, limit]);

  useEffect(() => {
    loadPayments(true);
  }, [session?.dbUserData?.id, session?.userId]);

  // Refresh payment history when screen comes into focus (e.g., after making a payment)
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 PaymentHistoryView focused - refreshing data');
      loadPayments(true);
    }, [loadPayments])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setOffset(0);
    loadPayments(true);
  }, [loadPayments]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadPayments(false);
    }
  }, [loading, hasMore, loadPayments]);


  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <CreditCard size={48} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>No Payment History</Text>
      <Text style={styles.emptySubtitle}>
        You haven't made any payments yet. Start by booking a trip!
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorState}>
      <Text style={styles.errorText}>Failed to load payment history</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => loadPayments(true)}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && payments.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment History</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading payment history...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment History</Text>
      </View>

      {error && payments.length === 0 ? (
        renderError()
      ) : payments.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
            if (isCloseToBottom && hasMore && !loading) {
              handleLoadMore();
            }
          }}
          scrollEventThrottle={400}
        >
          {payments.map((payment) => (
            <View key={`payment-${payment.id}`} style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentAmount}>
                    {PaymentHistoryService.formatAmount(payment.final_fare)}
                  </Text>
                  <Text style={styles.paymentDate}>
                    {PaymentHistoryService.formatDate(payment.created_at)}
                  </Text>
                </View>
                <View style={styles.paymentStatus}>
                  <CreditCard size={16} color="#10B981" />
                  <Text style={styles.statusText}>Paid</Text>
                </View>
              </View>

              <View style={styles.routeInfo}>
                <View style={styles.routeItem}>
                  <MapPin size={14} color="#6B7280" />
                  <Text style={styles.routeText}>
                    From: {payment.pickup_location}
                  </Text>
                </View>
                <View style={styles.routeItem}>
                  <MapPin size={14} color="#6B7280" />
                  <Text style={styles.routeText}>
                    To: {payment.destination}
                  </Text>
                </View>
              </View>

              <View style={styles.driverInfo}>
                <View style={styles.driverItem}>
                  <User size={14} color="#6B7280" />
                  <Text style={styles.driverText}>
                    Driver: {PaymentHistoryService.getDriverName(payment)}
                  </Text>
                </View>
                <View style={styles.driverItem}>
                  <Truck size={14} color="#6B7280" />
                  <Text style={styles.driverText}>
                    {PaymentHistoryService.getJeepneyInfo(payment)}
                  </Text>
                </View>
              </View>

              {parseFloat(payment.discount_amount || '0') > 0 && (
                <View style={styles.discountInfo}>
                  <Text style={styles.discountText}>
                    Original: {PaymentHistoryService.formatAmount(payment.original_fare)} | 
                    Discount: -{PaymentHistoryService.formatAmount(payment.discount_amount)}
                  </Text>
                </View>
              )}

              <View style={styles.paymentMethod}>
                <Text style={styles.methodText}>
                  Payment Method: {payment.payment_method.toUpperCase()}
                </Text>
              </View>
            </View>
          ))}
          
          {loading && payments.length > 0 && (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text style={styles.loadingMoreText}>Loading more...</Text>
            </View>
          )}
          
          {!hasMore && payments.length > 0 && (
            <View style={styles.endOfList}>
              <Text style={styles.endOfListText}>No more payments to load</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  paymentDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
    marginLeft: 4,
  },
  routeInfo: {
    marginBottom: 12,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  routeText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  driverInfo: {
    marginBottom: 12,
  },
  driverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  driverText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  discountInfo: {
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  discountText: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
  },
  paymentMethod: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
  },
  methodText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  endOfList: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  endOfListText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
