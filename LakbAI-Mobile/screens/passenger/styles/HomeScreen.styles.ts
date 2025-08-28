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
});

export default styles;