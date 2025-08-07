import React from 'react';
import { View, Text } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
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
  rows
}) => {
  return (
    <View style={homeStyles.statusCard}>
      <View style={homeStyles.sectionHeader}>
        <Icon size={20} color={iconColor} />
        <Text style={homeStyles.sectionTitle}>{title}</Text>
      </View>
      <View style={homeStyles.statusInfo}>
        {rows.map((row, index) => (
          <StatusRow key={index} {...row} />
        ))}
      </View>
    </View>
  );
};