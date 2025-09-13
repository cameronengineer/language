import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { useThemeColor, useTheme } from '@/src/utils/use-theme-color';
import { Spacing, BorderRadius, Typography, Shadows, AppColors } from '@/src/utils/theme';
import { IconSymbol } from './ui/icon-symbol';

interface PracticeButtonProps {
  title: string;
  subtitle?: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  onPress?: () => void;
}

const VARIANTS = {
  primary: {
    backgroundColor: AppColors.primary,
    textColor: '#FFFFFF',
    borderColor: AppColors.primary,
  },
  secondary: {
    backgroundColor: AppColors.secondary,
    textColor: '#FFFFFF',
    borderColor: AppColors.secondary,
  },
  success: {
    backgroundColor: AppColors.success,
    textColor: '#FFFFFF',
    borderColor: AppColors.success,
  },
  warning: {
    backgroundColor: AppColors.warning,
    textColor: '#FFFFFF',
    borderColor: AppColors.warning,
  },
  outline: {
    backgroundColor: 'transparent',
    textColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
} as const;

const SIZES = {
  small: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.sizes.sm,
    iconSize: 16,
    minHeight: 36,
  },
  medium: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.sizes.base,
    iconSize: 20,
    minHeight: 48,
  },
  large: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    fontSize: Typography.sizes.lg,
    iconSize: 24,
    minHeight: 56,
  },
} as const;

/**
 * Main action button component for practice screens
 * Supports different variants, sizes, and states
 */
export function PracticeButton({
  title,
  subtitle,
  icon,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  onPress,
}: PracticeButtonProps) {
  const { colorScheme } = useTheme();
  const variantStyle = VARIANTS[variant];
  const sizeStyle = SIZES[size];
  
  const isDisabled = disabled || loading;
  const opacity = isDisabled ? 0.6 : 1;

  const buttonStyle = [
    styles.button,
    {
      backgroundColor: variantStyle.backgroundColor,
      borderColor: variantStyle.borderColor,
      paddingVertical: sizeStyle.paddingVertical,
      paddingHorizontal: sizeStyle.paddingHorizontal,
      minHeight: sizeStyle.minHeight,
      opacity,
      ...Shadows[colorScheme].md,
    },
    variant === 'outline' && styles.outlineButton,
    style,
  ];

  const textColor = isDisabled 
    ? (variant === 'outline' ? AppColors.gray400 : '#FFFFFF') 
    : variantStyle.textColor;

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' ? AppColors.primary : '#FFFFFF'} 
        />
      ) : (
        <>
          {icon && (
            <IconSymbol
              name={icon as any}
              size={sizeStyle.iconSize}
              color={textColor}
              style={styles.icon}
            />
          )}
          <Text style={[styles.title, { color: textColor, fontSize: sizeStyle.fontSize }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: textColor, fontSize: sizeStyle.fontSize - 2 }]}>
              {subtitle}
            </Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  outlineButton: {
    backgroundColor: 'transparent',
  },
  icon: {
    marginRight: Spacing.sm,
  },
  title: {
    fontWeight: Typography.weights.semibold,
    textAlign: 'center',
  },
  subtitle: {
    fontWeight: Typography.weights.normal,
    textAlign: 'center',
    marginLeft: Spacing.xs,
    opacity: 0.9,
  },
});