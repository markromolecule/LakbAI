import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LucideIcon, RefreshCw } from 'lucide-react-native';
import { homeStyles } from '../styles';

interface StatusRowProps {
  label: string;
  value: string;
  valueColor?: string;
}

interface StatusCardProps {
  title: string;
  icon: LucideIcon;
  iconColor: string;
  rows: StatusRowProps[];
  onRefresh?: () => void;
  showRefreshButton?: boolean;
}

const StatusRow: React.FC<StatusRowProps> = ({ label, value, valueColor }) => (
  <View style={homeStyles.statusRow}>
    <Text style={homeStyles.statusLabel}>{label}:</Text>
    <Text style={[homeStyles.statusValue, valueColor ? { color: valueColor } : undefined]}>
      {value}
    </Text>
  </View>
);

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  icon: Icon,
  iconColor,
  rows,
  onRefresh,
  showRefreshButton = false
}) => {
  return (
    <View style={homeStyles.statusCard}>
      <View style={homeStyles.sectionHeader}>
        <Icon size={20} color={iconColor} />
        <Text style={homeStyles.sectionTitle}>{title}</Text>
        {showRefreshButton && onRefresh && (
          <TouchableOpacity 
            onPress={onRefresh}
            style={homeStyles.refreshButton}
          >
            <RefreshCw size={16} color={iconColor} />
          </TouchableOpacity>
        )}
      </View>
      <View style={homeStyles.statusInfo}>
        {rows.map((row, index) => (
          <StatusRow key={index} {...row} />
        ))}
      </View>
    </View>
  );
};