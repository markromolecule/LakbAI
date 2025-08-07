import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { homeStyles } from '../styles';

interface ActionCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconColor: string;
  borderColor: string;
  onPress: () => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  borderColor,
  onPress
}) => {
  return (
    <TouchableOpacity 
      onPress={onPress}
      style={[homeStyles.actionCard, { borderColor }]}
    >
      <Icon size={32} color={iconColor} />
      <Text style={homeStyles.actionTitle}>{title}</Text>
      <Text style={homeStyles.actionSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
};