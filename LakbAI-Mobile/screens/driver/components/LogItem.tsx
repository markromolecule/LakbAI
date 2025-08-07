import React from 'react';
import { View, Text } from 'react-native';
import { Clock } from 'lucide-react-native';
import { LogItem as LogItemType } from '../../../shared/types/driver';
import { logsStyles } from '../styles';

interface LogItemProps {
  log: LogItemType;
}

export const LogItem: React.FC<LogItemProps> = ({ log }) => {
  return (
    <View style={logsStyles.logItem}>
      <View style={logsStyles.logLeft}>
        <View style={logsStyles.logIcon}>
          <Clock size={20} color="#16A34A" />
        </View>
        <View>
          <Text style={logsStyles.logLocation}>{log.location}</Text>
          <Text style={logsStyles.logPassengers}>{log.passengers} passengers</Text>
        </View>
      </View>
      <Text style={logsStyles.logTime}>{log.time}</Text>
    </View>
  );
};