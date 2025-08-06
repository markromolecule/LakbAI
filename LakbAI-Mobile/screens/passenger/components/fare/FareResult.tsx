import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING } from '../../../../shared/styles';

interface FareResultProps {
  fare: number;
  fromLocation: string;
  toLocation: string;
}

export const FareResult: React.FC<FareResultProps> = ({
  fare,
  fromLocation,
  toLocation
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Fare</Text>
      <Text style={styles.amount}>₱{fare}</Text>
      <Text style={styles.route}>From {fromLocation} to {toLocation}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.successLight,
    borderWidth: 1,
    borderColor: COLORS.successBorder,
    padding: SPACING.lg,
    borderRadius: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.successDark,
  },
  amount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.successDark,
    marginVertical: SPACING.sm,
  },
  route: {
    fontSize: 14,
    color: COLORS.green600,
  },
});