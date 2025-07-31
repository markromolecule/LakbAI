import React from 'react';
import {
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';
import { COLORS, SPACING } from '../../shared/styles';

type ButtonVariant = 'primary' | 'secondary' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
}) => {
  const sizeStyles: Record<ButtonSize, ViewStyle> = {
    small: styles.small,
    medium: styles.medium,
    large: styles.large,
  };

  const sizeTextStyles: Record<ButtonSize, TextStyle> = {
    small: styles.smallText,
    medium: styles.mediumText,
    large: styles.largeText,
  };

  const variantStyles: Record<ButtonVariant, ViewStyle> = {
    primary: styles.primary,
    secondary: styles.secondary,
    danger: styles.danger,
  };

  const variantTextStyles: Record<ButtonVariant, TextStyle> = {
    primary: styles.primaryText,
    secondary: styles.secondaryText,
    danger: styles.dangerText,
  };

  const getButtonStyle = (): StyleProp<ViewStyle> => {
    const baseStyle: ViewStyle[] = [styles.button, sizeStyles[size]];

    if (disabled) {
      baseStyle.push(styles.disabled);
    } else {
      baseStyle.push(variantStyles[variant]);
    }

    if (style) baseStyle.push(style as ViewStyle);

    return StyleSheet.flatten(baseStyle);
  };

  const getTextStyle = (): StyleProp<TextStyle> => {
    const baseStyle: TextStyle[] = [styles.text, sizeTextStyles[size]];

    if (disabled) {
      baseStyle.push(styles.disabledText);
    } else {
      baseStyle.push(variantTextStyles[variant]);
    }

    if (textStyle) baseStyle.push(textStyle as TextStyle);

    return StyleSheet.flatten(baseStyle);
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={getTextStyle()}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sizes
  small: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  medium: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  large: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },

  // Variants
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: COLORS.gray100,
    borderWidth: 1,
    borderColor: COLORS.gray300,
  },
  danger: {
    backgroundColor: '#EF4444',
  },
  disabled: {
    backgroundColor: COLORS.gray300,
  },

  // Text styles
  text: {
    fontWeight: '600',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },

  // Text variants
  primaryText: {
    color: COLORS.white,
  },
  secondaryText: {
    color: COLORS.gray700,
  },
  dangerText: {
    color: COLORS.white,
  },
  disabledText: {
    color: COLORS.gray500,
  },
});