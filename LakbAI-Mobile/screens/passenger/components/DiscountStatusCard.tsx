import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { CreditCard, RefreshCw } from 'lucide-react-native';
import { discountService } from '../../../shared/services/discountService';
import { DiscountStatus } from '../../../shared/services/discountService';
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

      const status = await discountService.getDiscountStatus();
      setDiscountStatus(status);
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

  const canApplyForDiscount = discountStatus?.status === 'none' || 
                              discountStatus?.status === 'rejected';

  const getDiscountStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getDiscountStatusMessage = (status: string) => {
    switch (status) {
      case 'pending': return 'Your discount application is under review. Please wait for approval.';
      case 'approved': return 'Your discount has been approved and is now active.';
      case 'rejected': return 'Your discount application was rejected. You can apply again with updated documents.';
      default: return 'No discount application submitted.';
    }
  };

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
                {getDiscountIcon(discountStatus.type)}
              </Text>
              <View style={profileStyles.discountInfo}>
                <Text style={profileStyles.discountType}>
                  {discountStatus.status !== 'none' ? 
                    getDiscountTypeDisplay(discountStatus.type) : 
                    'No discount applied'
                  }
                </Text>
                
                <Text style={[
                  profileStyles.discountStatus,
                  { color: getDiscountStatusColor(discountStatus.status) }
                ]}>
                  {discountStatus.status.charAt(0).toUpperCase() + discountStatus.status.slice(1)}
                </Text>
                
                <Text style={profileStyles.discountMessage}>
                  {getDiscountStatusMessage(discountStatus.status)}
                </Text>
                
                {discountStatus.percentage > 0 && discountStatus.status === 'approved' && (
                  <View style={profileStyles.discountAmountContainer}>
                    <Text style={profileStyles.discountAmountLabel}>Discount Percentage:</Text>
                    <Text style={profileStyles.discountAmountValue}>
                      {discountStatus.percentage}% off regular fare
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
                  {discountStatus.status === 'rejected' ? 'Reapply for Discount' : 'Apply for Discount'}
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
