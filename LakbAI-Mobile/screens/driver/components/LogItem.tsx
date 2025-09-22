import React from 'react';
import { View, Text } from 'react-native';
import { Clock, Play, MapPin, Flag } from 'lucide-react-native';
import { LogItem as LogItemType } from '../../../shared/types/driver';

// Extended LogItem type for checkpoint scans
interface ExtendedLogItem extends LogItemType {
  scanType?: 'start' | 'intermediate' | 'end';
}
import { logsStyles } from '../styles';

interface LogItemProps {
  log: ExtendedLogItem;
}

export const LogItem: React.FC<LogItemProps> = ({ log }) => {
  // Choose icon and color based on scan type
  const getIconConfig = () => {
    switch (log.scanType) {
      case 'start':
        return { Icon: Play, color: '#22C55E', bgColor: '#DCFCE7' };
      case 'intermediate':
        return { Icon: MapPin, color: '#3B82F6', bgColor: '#DBEAFE' };
      case 'end':
        return { Icon: Flag, color: '#EF4444', bgColor: '#FEE2E2' };
      default:
        return { Icon: Clock, color: '#16A34A', bgColor: '#DCFCE7' };
    }
  };

  const { Icon, color, bgColor } = getIconConfig();

  return (
    <View style={logsStyles.logItem}>
      <View style={logsStyles.logLeft}>
        <View style={[logsStyles.logIcon, { backgroundColor: bgColor }]}>
          <Icon size={20} color={color} />
        </View>
        <View>
          <Text style={logsStyles.logLocation}>{log.location}</Text>
          <Text style={logsStyles.logDetails}>
            {log.scanType ? `${log.scanType.charAt(0).toUpperCase() + log.scanType.slice(1)} checkpoint` : 'Checkpoint scan'}
          </Text>
        </View>
      </View>
      <Text style={logsStyles.logTime}>{log.time}</Text>
    </View>
  );
};