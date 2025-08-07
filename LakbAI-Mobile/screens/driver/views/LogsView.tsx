import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { LogItem as LogItemType } from '../../../shared/types/driver';
import { LogItem } from '../components';
import { driverStyles, logsStyles } from '../styles';

interface LogsViewProps {
  recentLogs: LogItemType[];
}

export const LogsView: React.FC<LogsViewProps> = ({
  recentLogs
}) => {
  const totalPassengers = recentLogs.reduce((sum, log) => sum + log.passengers, 0);

  return (
    <ScrollView 
      style={driverStyles.container} 
      contentContainerStyle={driverStyles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={logsStyles.pageTitle}>Trip Logs</Text>
      
      <View style={logsStyles.logsCard}>
        <View style={logsStyles.logsHeader}>
          <Text style={logsStyles.logsTitle}>Today's Activity</Text>
          <Text style={logsStyles.logsDate}>{new Date().toLocaleDateString()}</Text>
        </View>
        <View style={logsStyles.logsList}>
          {recentLogs.map((log, index) => (
            <LogItem key={index} log={log} />
          ))}
        </View>
      </View>

      <View style={logsStyles.summaryGrid}>
        <View style={logsStyles.summaryCard}>
          <Text style={logsStyles.summaryTitle}>Total Passengers</Text>
          <Text style={[logsStyles.summaryValue, { color: '#16A34A' }]}>{totalPassengers}</Text>
          <Text style={logsStyles.summaryLabel}>Today</Text>
        </View>
        
        <View style={logsStyles.summaryCard}>
          <Text style={logsStyles.summaryTitle}>Checkpoints</Text>
          <Text style={[logsStyles.summaryValue, { color: '#3B82F6' }]}>{recentLogs.length}</Text>
          <Text style={logsStyles.summaryLabel}>Scanned</Text>
        </View>
      </View>

      <View style={logsStyles.weeklyCard}>
        <Text style={logsStyles.weeklySectionTitle}>Weekly Summary</Text>
        <View style={logsStyles.weeklyRow}>
          <Text style={logsStyles.weeklyLabel}>Total Trips This Week:</Text>
          <Text style={logsStyles.weeklyValue}>67</Text>
        </View>
        <View style={logsStyles.weeklyRow}>
          <Text style={logsStyles.weeklyLabel}>Total Earnings:</Text>
          <Text style={[logsStyles.weeklyValue, { color: '#16A34A' }]}>₱12,450</Text>
        </View>
        <View style={logsStyles.weeklyRow}>
          <Text style={logsStyles.weeklyLabel}>Average Rating:</Text>
          <Text style={logsStyles.weeklyValue}>4.8/5.0</Text>
        </View>
      </View>
    </ScrollView>
  );
};