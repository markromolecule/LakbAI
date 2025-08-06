import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SPACING } from '../../shared/styles/spacing';
import { COLORS } from '../../shared/themes/colors';

interface InfoCardProps {
  title: string;
  items: string[];
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  items,
  backgroundColor = COLORS.blue50,
  borderColor = COLORS.blue100,
  textColor = COLORS.blue800
}) => {
  return (
    <View style={[styles.container, { backgroundColor, borderColor }]}>
      <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      {items.map((item, index) => (
        <Text key={index} style={[styles.item, { color: textColor }]}>
          {item}
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    padding: SPACING.lg,
    borderRadius: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  item: {
    fontSize: 14,
    marginBottom: SPACING.xs,
  },
});