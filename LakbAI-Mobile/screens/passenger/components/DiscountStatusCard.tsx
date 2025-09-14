import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { CreditCard, RefreshCw } from 'lucide-react-native';
import { discountStatusService, DiscountStatus } from '../../../shared/services/discountStatusService';
import { homeStyles, profileStyles } from '../styles/ProfileScreen.styles';

interface DiscountStatusCardProps {
  userId: string | number;
  onApplyForDiscount?: () => void;
}

export const DiscountStatusCard: React.FC<DiscountStatusCardProps> = ({
  userId,
  onApplyForDiscount
}) => {
  const [discountStatus, setDiscountStatus] = useState<DiscountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDiscountStatus = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await discountStatusService.getUserDiscountStatus(userId);
      
      if (response.status === 'success' && response.data) {
        setDiscountStatus(response.data);
      } else {
        console.error('Failed to fetch discount status:', response.message);
        Alert.alert('Error', 'Failed to load discount status. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching discount status:', error);
      Alert.alert('Error', 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDiscountStatus();
  }, [userId]);

  const handleRefresh = () => {
    fetchDiscountStatus(true);
  };

  const getDiscountTypeDisplay = (type: string | null) => {
    switch (type) {
      case 'PWD': 
        return 'Person with Disability';
      case 'Senior Citizen': 
        return 'Senior Citizen';
      case 'Student': 
        return 'Student';
      default: 
        return 'No discount type';
    }
  };

  const getDiscountIcon = (type: string | null) => {
    switch (type) {
      case 'PWD': return '♿';
      case 'Senior Citizen': return '👴';
      case 'Student': return '🎓';
      default: return '💳';
    }
  };

  const canApplyForDiscount = !discountStatus?.discount_applied || 
                              discountStatus?.discount_status === 'rejected';

  if (loading) {
    return (
      <View style={profileStyles.discountCard}>
        <View style={homeStyles.sectionHeader}>
          <CreditCard size={20} color="#16A34A" />
          <Text style={homeStyles.sectionTitle}>Fare Discount</Text>
        </View>
        <View style={profileStyles.loadingContainer}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={profileStyles.loadingText}>Loading discount status...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={profileStyles.discountCard}>
      <View style={homeStyles.sectionHeader}>
        <CreditCard size={20} color="#16A34A" />
        <Text style={homeStyles.sectionTitle}>Fare Discount</Text>
        <TouchableOpacity 
          onPress={handleRefresh} 
          disabled={refreshing}
          style={profileStyles.refreshButton}
        >
          <RefreshCw 
            size={16} 
            color="#6B7280" 
            style={refreshing ? { transform: [{ rotate: '180deg' }] } : {}} 
          />
        </TouchableOpacity>
      </View>
      
      <View style={profileStyles.discountContent}>
        {discountStatus ? (
          <>
            <View style={profileStyles.discountTypeRow}>
              <Text style={profileStyles.discountIcon}>
                {discountStatusService.getDiscountStatusIcon(discountStatus)}
              </Text>
              <View style={profileStyles.discountInfo}>
                <Text style={profileStyles.discountType}>
                  {discountStatus.discount_applied ? 
                    getDiscountTypeDisplay(discountStatus.discount_type) : 
                    'No discount applied'
                  }
                </Text>
                
                <Text style={[
                  profileStyles.discountStatus,
                  { color: discountStatusService.getDiscountStatusColor(discountStatus) }
                ]}>
                  {discountStatus.discount_status?.charAt(0).toUpperCase() + 
                   (discountStatus.discount_status?.slice(1) || '')}
                </Text>
                
                <Text style={profileStyles.discountMessage}>
                  {discountStatusService.getDiscountStatusMessage(discountStatus)}
                </Text>
                
                {discountStatus.discount_amount && discountStatus.discount_status === 'approved' && (
                  <View style={profileStyles.discountAmountContainer}>
                    <Text style={profileStyles.discountAmountLabel}>Discount Percentage:</Text>
                    <Text style={profileStyles.discountAmountValue}>
                      {discountStatus.discount_amount}% off regular fare
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Apply for Discount Button */}
            {canApplyForDiscount && onApplyForDiscount && (
              <TouchableOpacity 
                style={profileStyles.applyDiscountButton}
                onPress={onApplyForDiscount}
                accessibilityLabel="Apply for Discount"
                accessibilityHint="Tap to apply for a fare discount"
              >
                <CreditCard size={16} color="#3B82F6" />
                <Text style={profileStyles.applyDiscountButtonText}>
                  {discountStatus.discount_status === 'rejected' ? 'Reapply for Discount' : 'Apply for Discount'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={profileStyles.errorContainer}>
            <Text style={profileStyles.errorText}>
              Failed to load discount information
            </Text>
            <TouchableOpacity 
              style={profileStyles.retryButton}
              onPress={() => fetchDiscountStatus()}
            >
              <Text style={profileStyles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};
