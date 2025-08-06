// shared/themes/index.ts
import { COLORS } from './colors';
import { SPACING } from '../styles/spacing';
import { TextStyle, ViewStyle } from 'react-native';

export const theme = {
  colors: COLORS,
  spacing: SPACING,
  typography: {
    heading: {
      fontSize: 24,
      fontWeight: 'bold',
      color: COLORS.gray800,
    } as TextStyle,
    body: {
      fontSize: 16,
      color: COLORS.gray600,
    } as TextStyle,
  },
  components: {
    card: {
      backgroundColor: COLORS.white,
      borderRadius: SPACING.md,
      padding: SPACING.lg,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    } as ViewStyle,
    button: {
      primary: {
        backgroundColor: COLORS.primary,
        padding: SPACING.lg,
        borderRadius: SPACING.md,
      } as ViewStyle,
      text: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
      } as TextStyle,
    }
  }
};