import React from 'react';
import { View, Text } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { homeStyles } from '../styles';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  valueColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  iconColor,
  valueColor
}) => {
  return (
    <View style={homeStyles.statCard}>
      <View style={homeStyles.statContent}>
        <View>
          <Text style={homeStyles.statLabel}>{label}</Text>
          <Text style={[homeStyles.statValue, valueColor ? { color: valueColor } : undefined]}>
            {value}
          </Text>
        </View>
        <Icon size={32} color={iconColor} />
      </View>
    </View>
  );
};