import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING } from '../../shared/styles';

interface FooterProps {
  text?: string;
  version?: string;
}

export const Footer: React.FC<FooterProps> = ({
  text = 'Modern Jeepney',
  version = 'V1',
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        LakbAI {version} | {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  text: {
    color: COLORS.gray400,
    fontSize: 12,
    textAlign: 'center',
  },
});

export default Footer;