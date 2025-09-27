import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../shared/styles';
import { BiyaBotScreen } from './BiyaBotScreen';

interface BiyaBotDemoProps {
  onBack?: () => void;
}

export const BiyaBotDemo: React.FC<BiyaBotDemoProps> = ({ onBack }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gray800} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>BiyaBot Demo</Text>
        <View style={styles.placeholder} />
      </View>
      
      <BiyaBotScreen />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray800,
  },
  placeholder: {
    width: 40,
  },
});
