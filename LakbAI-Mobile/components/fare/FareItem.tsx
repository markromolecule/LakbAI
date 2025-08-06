import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FareInfo } from '../../shared/types';
import { COLORS, SPACING } from '../../shared/styles';

interface FareItemProps {
  fareInfo: FareInfo;
  isLast?: boolean;
}

export const FareItem: React.FC<FareItemProps> = ({ fareInfo, isLast = false }) => {
  return (
    <View style={[styles.container, isLast && styles.lastItem]}>
      <View style={styles.route}>
        <Text style={styles.fromText}>{fareInfo.from}</Text>
        <Text style={styles.toText}>to {fareInfo.to}</Text>
      </View>
      <Text style={styles.price}>₱{fareInfo.fare}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  route: {
    flex: 1,
  },
  fromText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray800,
  },
  toText: {
    fontSize: 14,
    color: COLORS.gray500,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});