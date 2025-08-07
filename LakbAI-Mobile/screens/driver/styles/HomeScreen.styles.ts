import { StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../../../shared/themes/colors';
import { SPACING } from '../../../shared/styles/spacing';

const { width: screenWidth } = Dimensions.get('window');

// Responsive helpers
const getColumnCount = () => screenWidth > 768 ? 4 : 2; // 4 columns on tablet/web, 2 on mobile
const getActionCardWidth = () => {
  const columns = getColumnCount();
  const padding = screenWidth > 768 ? SPACING.xl : SPACING.lg;
  const gap = SPACING.md;
  return (screenWidth - (padding * 2) - (gap * (columns - 1))) / columns;
};

export const homeStyles = StyleSheet.create({
  headerCard: {
    backgroundColor: COLORS.driverPrimary,
    borderRadius: 12,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.primaryLight,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  jeepneyLabel: {
    fontSize: 14,
    color: '#BBF7D0',
  },
  jeepneyNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: screenWidth > 768 ? SPACING.lg : SPACING.md,
    marginBottom: screenWidth > 768 ? SPACING.xl : SPACING.lg,
    flexWrap: 'wrap', // Allow wrapping on smaller screens
  },
  statCard: {
    flex: 1,
    minWidth: screenWidth > 768 ? 200 : 150, // Minimum width for responsive design
    backgroundColor: COLORS.white,
    padding: screenWidth > 768 ? SPACING.xl : SPACING.lg,
    borderRadius: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: screenWidth > 768 ? SPACING.lg : SPACING.md,
    marginBottom: screenWidth > 768 ? SPACING.xl : SPACING.lg,
    justifyContent: 'space-between',
  },
  actionCard: {
    width: getActionCardWidth(),
    backgroundColor: '#FFFFFF',
    padding: screenWidth > 768 ? SPACING.xl : SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    minHeight: screenWidth > 768 ? 120 : 100, // Consistent height
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  statusInfo: {
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  dutyButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  dutyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});