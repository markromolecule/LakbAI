import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SPACING } from '../../shared/styles/spacing';
import { COLORS } from '../../shared/themes/colors';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  userType?: 'Passenger' | 'Driver';
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'LakbAI',
  showBackButton = false,
  onBackPress,
  userType = 'Passenger'
}) => {

  // Dynamic colors based on user type
  const isDriver = userType === 'Driver';
  const titleColor = isDriver ? COLORS.driverPrimary : COLORS.primary;
  const backButtonColor = isDriver ? COLORS.driverPrimary : COLORS.gray500;
  const badgeBackgroundColor = isDriver ? COLORS.driverPrimaryLight : COLORS.primaryLight;
  const badgeTextColor = isDriver ? COLORS.driverPrimaryDark : COLORS.primaryDark;

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {showBackButton && (
          <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
            <Ionicons name="close" size={20} color={backButtonColor} />
          </TouchableOpacity>
        )}
        <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
      </View>
      
      <View style={[styles.badge, { backgroundColor: badgeBackgroundColor }]}>
        <Text style={[styles.badgeText, { color: badgeTextColor }]}>{userType}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});