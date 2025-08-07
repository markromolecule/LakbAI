import { StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../../../shared/themes/colors';
import { SPACING } from '../../../shared/styles/spacing';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive helper functions
const getResponsivePadding = () => {
  if (screenWidth > 768) return SPACING.xl; // Tablet/Web
  if (screenWidth > 480) return SPACING.lg; // Large mobile
  return SPACING.md; // Small mobile
};

const getResponsiveSpacing = () => {
  if (screenWidth > 768) return SPACING.lg;
  return SPACING.md;
};

export const driverStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: getResponsivePadding(),
    paddingVertical: getResponsiveSpacing(),
    backgroundColor: COLORS.gray50,
    minHeight: '100%', // Ensure full height coverage
  },
  fullContainer: {
    flex: 1,
    backgroundColor: COLORS.gray50,
    minHeight: screenHeight,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: SPACING.xl, // Extra bottom padding for scroll
  },
});