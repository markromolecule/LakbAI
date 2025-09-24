import { StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../../../shared/styles';

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.primary,
    padding: SPACING.xl,
    borderRadius: SPACING.md,
    marginBottom: SPACING.xl,
    marginTop: SPACING.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    color: COLORS.blue100,
    fontSize: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  gridItem: {
    backgroundColor: COLORS.white,
    width: '48%',
    padding: SPACING.xl,
    borderRadius: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray800,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  gridSubtitle: {
    fontSize: 12,
    color: COLORS.gray500,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  arrivalCard: {
    backgroundColor: COLORS.warningLight,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
    padding: SPACING.lg,
    borderRadius: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  arrivalContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrivalText: {
    marginLeft: SPACING.md,
  },
  arrivalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.warningDark,
  },
  arrivalTime: {
    color: COLORS.warningDark,
    fontSize: 14,
  },
  infoSection: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: SPACING.md,
    marginBottom: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray800,
    marginBottom: SPACING.md,
  },
  infoItem: {
    fontSize: 14,
    color: COLORS.gray600,
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  driverLocationSection: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray800,
    marginBottom: SPACING.md,
    marginLeft: SPACING.md,
  },
  // Compact Route Selector Styles
  compactRouteSelector: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  compactRouteInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactRouteText: {
    flex: 1,
    marginRight: SPACING.md,
  },
  compactRouteName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray800,
    marginBottom: 2,
  },
  compactRouteDetails: {
    fontSize: 12,
    color: COLORS.gray600,
  },
  compactRouteActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactRouteFare: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '600',
    marginRight: SPACING.sm,
  },
  compactRouteButton: {
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.sm,
    borderRadius: SPACING.sm,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SPACING.lg,
    borderTopRightRadius: SPACING.lg,
    maxHeight: '70%',
    paddingTop: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.gray800,
  },
  modalCloseButton: {
    padding: SPACING.sm,
  },
  routesList: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  loadingText: {
    textAlign: 'center',
    color: COLORS.gray500,
    fontSize: 16,
    padding: SPACING.xl,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedRouteItem: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  routeItemContent: {
    flex: 1,
  },
  routeItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray800,
    marginBottom: SPACING.xs,
  },
  routeItemDetails: {
    fontSize: 14,
    color: COLORS.gray600,
    marginBottom: SPACING.xs,
  },
  routeItemFare: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '500',
  },
  // Empty State Styles
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.gray500,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: SPACING.sm,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default styles;