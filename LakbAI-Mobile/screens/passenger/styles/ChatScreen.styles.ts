import { StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../../../shared/styles';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatHeader: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  chatHeaderSubtitle: {
    color: COLORS.blue100,
    fontSize: 14,
    marginTop: 2,
  },
  toggleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
    marginLeft: SPACING.md,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
  messagesContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  inputContainer: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    padding: SPACING.lg,
    paddingBottom: SPACING.lg,
    position: 'relative',
    zIndex: 1000,
  },
  inputContainerKeyboardVisible: {
    paddingBottom: SPACING.lg,
    marginBottom: 0,
  },
});

export default styles;