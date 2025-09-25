import { StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../../shared/themes/colors';
import { SPACING } from '../../shared/styles/spacing';

const { width: screenWidth } = Dimensions.get('window');

// Responsive helper functions
const getResponsiveSpacing = () => {
  if (screenWidth > 768) return SPACING.lg;
  return SPACING.md;
};

export const routeSelectorStyles = StyleSheet.create({
  // Route Selector Styles
  routeSelectorContainer: {
    marginBottom: getResponsiveSpacing(),
  },

  routeSelectorButton: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },

  routeSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  routeSelectorText: {
    flex: 1,
    marginLeft: SPACING.md,
  },

  routeSelectorLabel: {
    fontSize: 14,
    color: COLORS.gray600,
    marginBottom: SPACING.xs,
  },

  routeSelectorValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray900,
  },

  routeModalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: SPACING.xl,
  },

  routeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },

  routeModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray900,
  },

  routeModalCloseButton: {
    padding: SPACING.sm,
  },

  routeModalCloseText: {
    fontSize: 16,
    color: COLORS.blue500,
    fontWeight: '500',
  },

  routeModalSubtitle: {
    fontSize: 14,
    color: COLORS.gray600,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    textAlign: 'center',
  },

  routeUpdatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
  },

  routeUpdatingText: {
    fontSize: 14,
    color: COLORS.gray600,
    marginLeft: SPACING.sm,
  },

  routeList: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },

  routeItem: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  routeItemSelected: {
    borderColor: COLORS.blue500,
    backgroundColor: COLORS.blue50,
  },

  routeItemContent: {
    flex: 1,
  },

  routeItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },

  routeItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray900,
    flex: 1,
    marginLeft: SPACING.sm,
  },

  routeItemDetails: {
    fontSize: 14,
    color: COLORS.gray600,
    marginLeft: 28, // Align with icon
  },

  // Loading and empty state styles
  routeLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },

  routeLoadingText: {
    fontSize: 16,
    color: COLORS.gray600,
    marginTop: SPACING.md,
  },

  routeEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },

  routeEmptyText: {
    fontSize: 16,
    color: COLORS.gray600,
    marginBottom: SPACING.lg,
  },

  routeRetryButton: {
    backgroundColor: COLORS.blue500,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 8,
  },

  routeRetryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
  },
});
