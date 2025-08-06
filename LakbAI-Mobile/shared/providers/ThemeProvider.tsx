import React from 'react';
import { ThemeProvider as StyledProvider } from '@react-navigation/native';
import { theme } from '../themes';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <StyledProvider value={theme}>{children}</StyledProvider>
);