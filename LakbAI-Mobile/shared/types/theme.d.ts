import { theme } from '../themes';

declare module '@react-navigation/native' {
  export type AppTheme = typeof theme;
  export function useTheme(): AppTheme;
}