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
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  chatHeaderSubtitle: {
    color: COLORS.blue100,
    fontSize: 14,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: COLORS.gray50,
    padding: SPACING.lg,
  },
  inputContainer: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    padding: SPACING.lg,
  },
});

export default styles;