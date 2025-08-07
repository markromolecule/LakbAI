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

const getResponsiveGap = () => {
  if (screenWidth > 768) return SPACING.lg; // Larger gap for tablets
  if (screenWidth > 480) return SPACING.md; // Medium gap for large mobile
  return SPACING.sm; // Smaller gap for compact mobile
};

// Driver Screen Styles
export const driverStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: getResponsivePadding(),
    paddingVertical: getResponsiveSpacing(),
    backgroundColor: COLORS.white,
  },
  
  fullContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  
  mainContent: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: getResponsivePadding(),
    paddingVertical: getResponsiveSpacing(),
  },
  
  contentContainer: {
    flexGrow: 1,
    paddingBottom: SPACING.xl * 2,
  },
  
  viewContainer: {
    flex: 1,
  },
  
  scrollViewContainer: {
    flexGrow: 1,
    paddingBottom: SPACING.lg,
  },
});

// Home View Styles  
export const homeStyles = StyleSheet.create({
  headerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: getResponsiveSpacing(),
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },

  headerTitle: {
    fontSize: 16,
    color: COLORS.gray600,
    marginBottom: SPACING.xs,
  },

  headerSubtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray900,
  },

  headerRight: {
    alignItems: 'flex-end',
  },

  jeepneyLabel: {
    fontSize: 14,
    color: COLORS.gray600,
    marginBottom: SPACING.xs,
  },

  jeepneyNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray900,
  },

  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.sm,
  },

  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray700,
  },

  statsGrid: {
    flexDirection: 'row',
    marginBottom: getResponsiveSpacing(),
    gap: getResponsiveSpacing(),
  },

  // Actions Grid Styles - 2x2 Grid Layout
  actionsGrid: {
    flexDirection: 'row' as 'row',
    flexWrap: 'wrap' as 'wrap',
    justifyContent: 'space-between' as 'space-between',
    marginBottom: getResponsiveSpacing(),
    gap: getResponsiveGap(),
  },

  actionCardWrapper: {
    width: '25%',
    minWidth: screenWidth > 768 ? 150 : 120,
    aspectRatio: 1,
  },

  actionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    aspectRatio: 1, // Maintain square aspect ratio
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    paddingHorizontal: screenWidth > 768 ? SPACING.xl : SPACING.lg,
    paddingVertical: screenWidth > 768 ? SPACING.xl : SPACING.lg,
  },

  actionTitle: {
    fontSize: screenWidth > 768 ? 16 : 14,
    fontWeight: '600',
    color: COLORS.gray800,
    marginTop: SPACING.sm,
    textAlign: 'center' as 'center',
    lineHeight: screenWidth > 768 ? 20 : 18,
  },

  actionSubtitle: {
    fontSize: screenWidth > 768 ? 14 : 12,
    color: COLORS.gray500,
    marginTop: SPACING.xs,
    textAlign: 'center' as 'center',
    lineHeight: screenWidth > 768 ? 18 : 16,
  },

  // Duty Button Styles
  dutyButton: {
    borderRadius: 12,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: getResponsiveSpacing(),
    marginBottom: SPACING.md,
  },

  dutyButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },

  // Additional styles for components (if needed)
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: getResponsiveSpacing(),
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  gridContainer: {
    flexDirection: 'row' as 'row',
    flexWrap: 'wrap' as 'wrap',
    justifyContent: 'space-between' as 'space-between',
    marginBottom: getResponsiveSpacing(),
  },

  gridItem: {
    backgroundColor: COLORS.white,
    width: '48%',
    padding: SPACING.lg,
    borderRadius: 16,
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
    marginBottom: getResponsiveSpacing(),
    borderWidth: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 120,
  },

  gridTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray800,
    marginTop: SPACING.sm,
    textAlign: 'center' as 'center',
  },

  gridSubtitle: {
    fontSize: 12,
    color: COLORS.gray500,
    marginTop: SPACING.xs,
    textAlign: 'center' as 'center',
  },

  // Missing styles for components
  statContent: {
    flexDirection: 'row' as 'row',
    justifyContent: 'space-between' as 'space-between',
    alignItems: 'center' as 'center',
  },

  statLabel: {
    fontSize: 12,
    color: COLORS.gray500,
    marginBottom: SPACING.xs,
  },

  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray900,
  },

  sectionHeader: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    marginBottom: SPACING.md,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray800,
    marginLeft: SPACING.sm,
  },

  statusInfo: {
    gap: SPACING.sm,
  },

  statusRow: {
    flexDirection: 'row' as 'row',
    justifyContent: 'space-between' as 'space-between',
    alignItems: 'center' as 'center',
    paddingVertical: SPACING.xs,
  },

  statusLabel: {
    fontSize: 14,
    color: COLORS.gray600,
  },

  statusValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray900,
  },
});