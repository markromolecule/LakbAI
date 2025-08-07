import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { SPACING } from '../../shared/styles/spacing';
import { COLORS } from '../../shared/themes/colors';
import { useLogout } from '../../shared/utils/authUtils';

const { width: screenWidth } = Dimensions.get('window');

// Responsive padding to match both driver and passenger screen containers
const getResponsivePadding = () => {
  if (screenWidth > 768) return SPACING.xl; // 24px - Tablet/Web
  return SPACING.lg; // 16px - Mobile (consistent with passenger global styles)
};

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  userType?: 'Passenger' | 'Driver';
  showLogout?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'LakbAI',
  showBackButton = false,
  onBackPress,
  userType = 'Passenger',
  showLogout = true
}) => {
  const { logout } = useLogout();

  // Dynamic colors based on user type
  const isDriver = userType === 'Driver';
  const titleColor = isDriver ? COLORS.driverPrimary : COLORS.primary;
  const backButtonColor = isDriver ? COLORS.driverPrimary : COLORS.gray500;
  const badgeBackgroundColor = isDriver ? COLORS.driverPrimaryLight : COLORS.primaryLight;
  const badgeTextColor = isDriver ? COLORS.driverPrimaryDark : COLORS.primaryDark;
  const logoutIconColor = isDriver ? COLORS.driverPrimary : COLORS.primary;

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
      
      <View style={styles.right}>
        <View style={[styles.badge, { backgroundColor: badgeBackgroundColor }]}>
          <Text style={[styles.badgeText, { color: badgeTextColor }]}>{userType}</Text>
        </View>
        
        {showLogout && (
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={() => logout()}
            accessibilityLabel="Logout"
            accessibilityHint="Tap to logout from your account"
          >
            <Ionicons name="log-out-outline" size={22} color={logoutIconColor} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getResponsivePadding(),
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    marginLeft: SPACING.sm,
  },
  badge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
    marginRight: SPACING.sm,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  logoutButton: {
    padding: SPACING.xs,
    borderRadius: 20,
    marginRight: SPACING.sm,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
});