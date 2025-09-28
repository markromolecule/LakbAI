import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { 
  DollarSign, 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  Clock,
  RefreshCw
} from 'lucide-react-native';
import { DriverProfile } from '../../../shared/types/driver';
import { driverStyles } from '../styles';
import { earningsService } from '../../../shared/services/earningsService';
import { EarningsNotificationDisplay } from '../../../components/driver/EarningsNotificationDisplay';

interface EarningsViewProps {
  driverProfile: DriverProfile;
  onRefresh: () => void;
}

interface EarningsData {
  todayEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  yearlyEarnings: number;
  totalEarnings: number;
  todayTrips: number;
  averageFarePerTrip: number;
  lastUpdate: string;
}

export const EarningsView: React.FC<EarningsViewProps> = ({
  driverProfile,
  onRefresh
}) => {
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Load earnings data
  const loadEarningsData = async () => {
    try {
      console.log('💰 Driver app loading earnings data for driver:', driverProfile.id);
      // Use refreshDriverEarnings to trigger notifications when driver app loads data
      // Pass undefined as senderName to let the service retrieve stored sender name
      const earnings = await earningsService.refreshDriverEarnings(driverProfile.id.toString(), undefined);
      
      setEarningsData({
        todayEarnings: earnings.todayEarnings,
        weeklyEarnings: earnings.weeklyEarnings,
        monthlyEarnings: earnings.monthlyEarnings,
        yearlyEarnings: earnings.yearlyEarnings,
        totalEarnings: earnings.totalEarnings,
        todayTrips: earnings.todayTrips,
        averageFarePerTrip: earnings.averageFarePerTrip,
        lastUpdate: earnings.lastUpdate
      });
      
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('❌ Failed to load earnings data:', error);
    }
  };

  // Auto-refresh earnings data
  useEffect(() => {
    loadEarningsData();
    
    // Set up earnings listener for immediate updates
    const unsubscribe = earningsService.addListener((driverId) => {
      if (driverProfile.id?.toString() === driverId) {
        console.log('💰 Earnings updated, refreshing earnings view...');
        // Add small delay to batch rapid updates and ensure smooth UI
        setTimeout(() => {
          loadEarningsData();
        }, 100);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [driverProfile.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEarningsData();
    setRefreshing(false);
  };


  const EarningsCard: React.FC<{
    title: string;
    amount: number;
    icon: React.ComponentType<any>;
    iconColor: string;
    backgroundColor: string;
    borderColor: string;
    subtitle?: string;
    period?: string;
  }> = ({ title, amount, icon: Icon, iconColor, backgroundColor, borderColor, subtitle, period }) => (
    <View style={[earningsStyles.earningsCard, { backgroundColor, borderColor }]}>
      <View style={earningsStyles.cardHeader}>
        <View style={[earningsStyles.iconContainer, { backgroundColor: iconColor + '20' }]}>
          <Icon size={24} color={iconColor} />
        </View>
        <View style={earningsStyles.cardInfo}>
          <Text style={earningsStyles.cardTitle}>{title}</Text>
          {period && <Text style={earningsStyles.cardPeriod}>{period}</Text>}
          {subtitle && <Text style={earningsStyles.cardSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Text style={earningsStyles.cardAmount}>₱{amount.toLocaleString()}</Text>
    </View>
  );

  if (!earningsData) {
    return (
      <ScrollView style={driverStyles.container} contentContainerStyle={driverStyles.contentContainer}>
        <View style={earningsStyles.header}>
          <View style={earningsStyles.placeholder} />
          <Text style={earningsStyles.headerTitle}>Earnings</Text>
          <View style={earningsStyles.placeholder} />
        </View>
        <View style={earningsStyles.loadingContainer}>
          <RefreshCw size={32} color="#6B7280" />
          <Text style={earningsStyles.loadingText}>Loading earnings...</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={driverStyles.container}>
      {/* Earnings Notification Display */}
      <EarningsNotificationDisplay driverId={driverProfile.id.toString()} />
      
      <ScrollView 
        style={driverStyles.container} 
        contentContainerStyle={driverStyles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
      {/* Header */}
      <View style={earningsStyles.header}>
        <View style={earningsStyles.placeholder} />
        <Text style={earningsStyles.headerTitle}>Earnings Overview</Text>
        <TouchableOpacity onPress={handleRefresh} style={earningsStyles.refreshButton}>
          <RefreshCw size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Today's Earnings - Highlighted */}
      <View style={earningsStyles.sectionHeader}>
        <Clock size={20} color="#16A34A" />
        <Text style={earningsStyles.sectionTitle}>Today's Performance</Text>
      </View>
      
      <EarningsCard
        title="Today's Earnings"
        amount={earningsData.todayEarnings}
        icon={DollarSign}
        iconColor="#16A34A"
        backgroundColor="#F0FDF4"
        borderColor="#BBF7D0"
        subtitle={`${earningsData.todayTrips} trips • ₱${earningsData.averageFarePerTrip} avg`}
      />

      {/* Period Earnings */}
      <View style={earningsStyles.sectionHeader}>
        <BarChart3 size={20} color="#3B82F6" />
        <Text style={earningsStyles.sectionTitle}>Period Earnings</Text>
      </View>

      <View style={earningsStyles.earningsGrid}>
        <View style={earningsStyles.gridCard}>
          <EarningsCard
            title="Weekly"
            amount={earningsData.weeklyEarnings}
            icon={Calendar}
            iconColor="#3B82F6"
            backgroundColor="#EFF6FF"
            borderColor="#BFDBFE"
            period="Rolling 7 days"
          />
        </View>
        <View style={earningsStyles.gridCard}>
          <EarningsCard
            title="Monthly"
            amount={earningsData.monthlyEarnings}
            icon={BarChart3}
            iconColor="#8B5CF6"
            backgroundColor="#F3F4F6"
            borderColor="#E5E7EB"
            period="Current month"
          />
        </View>
      </View>

      <View style={earningsStyles.earningsGrid}>
        <View style={earningsStyles.gridCard}>
          <EarningsCard
            title="Yearly"
            amount={earningsData.yearlyEarnings}
            icon={TrendingUp}
            iconColor="#F59E0B"
            backgroundColor="#FFFBEB"
            borderColor="#FED7AA"
            period="Current year"
          />
        </View>
        <View style={earningsStyles.gridCard}>
          <EarningsCard
            title="All-Time"
            amount={earningsData.totalEarnings}
            icon={DollarSign}
            iconColor="#DC2626"
            backgroundColor="#FEF2F2"
            borderColor="#FECACA"
            period="Never resets"
          />
        </View>
      </View>

      {/* Summary Stats */}
      <View style={earningsStyles.summaryCard}>
        <Text style={earningsStyles.summaryTitle}>Performance Summary</Text>
        <View style={earningsStyles.summaryRow}>
          <Text style={earningsStyles.summaryLabel}>Today's Trips:</Text>
          <Text style={earningsStyles.summaryValue}>{earningsData.todayTrips}</Text>
        </View>
        <View style={earningsStyles.summaryRow}>
          <Text style={earningsStyles.summaryLabel}>Average Fare:</Text>
          <Text style={earningsStyles.summaryValue}>₱{earningsData.averageFarePerTrip}</Text>
        </View>
        <View style={earningsStyles.summaryRow}>
          <Text style={earningsStyles.summaryLabel}>Last Updated:</Text>
          <Text style={earningsStyles.summaryValue}>{lastUpdate}</Text>
        </View>
      </View>

      {/* Dynamic Calculation Info */}
      <View style={earningsStyles.infoCard}>
        <Text style={earningsStyles.infoTitle}>📊 Dynamic Earnings System</Text>
        <Text style={earningsStyles.infoText}>
          • Daily: Resets when you end shift{'\n'}
          • Weekly: Rolling 7-day window{'\n'}
          • Monthly: Current calendar month{'\n'}
          • Yearly: Current calendar year{'\n'}
          • All-Time: Never resets, permanent record
        </Text>
      </View>
    </ScrollView>
    </View>
  );
};

// Styles
const earningsStyles = {
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#111827',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#374151',
    marginLeft: 8,
  },
  earningsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 0,
    minHeight: 120,
  },
  cardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 10,
    marginTop: 2,
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center' as const,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 2,
  },
  cardPeriod: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 0,
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  cardAmount: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#111827',
    textAlign: 'center' as const,
    marginTop: 8,
  },
  earningsGrid: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 16,
    gap: 12,
  },
  gridCard: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
  },
  infoCard: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginTop: 24,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0C4A6E',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#075985',
    lineHeight: 20,
  },
};
