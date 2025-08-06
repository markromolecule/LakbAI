import { StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../../../shared/styles';

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.primary,
    padding: SPACING.xl,
    borderRadius: SPACING.md,
    marginBottom: SPACING.xl,
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
});

export default styles;