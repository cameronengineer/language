import React from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextInputProps 
} from 'react-native';
import { useThemeColor } from '@/src/utils/use-theme-color';
import { Spacing, BorderRadius, Typography, AppColors } from '@/src/utils/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  style?: ViewStyle;
  containerStyle?: ViewStyle;
  variant?: 'default' | 'outlined' | 'filled';
  size?: 'small' | 'medium' | 'large';
}

const SIZES = {
  small: {
    height: 36,
    fontSize: Typography.sizes.sm,
    paddingHorizontal: Spacing.sm,
  },
  medium: {
    height: 48,
    fontSize: Typography.sizes.base,
    paddingHorizontal: Spacing.md,
  },
  large: {
    height: 56,
    fontSize: Typography.sizes.lg,
    paddingHorizontal: Spacing.lg,
  },
} as const;

/**
 * Input field component with consistent styling
 */
export function Input({
  label,
  error,
  style,
  containerStyle,
  variant = 'outlined',
  size = 'medium',
  ...props
}: InputProps) {
  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  
  const sizeStyle = SIZES[size];
  const hasError = !!error;

  const getInputStyle = () => {
    const baseStyle = {
      height: sizeStyle.height,
      fontSize: sizeStyle.fontSize,
      paddingHorizontal: sizeStyle.paddingHorizontal,
      color: textColor,
    };

    switch (variant) {
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor,
          borderWidth: 0,
          borderRadius: BorderRadius.md,
        };
      case 'outlined':
      default:
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: hasError ? AppColors.error : borderColor,
          borderRadius: BorderRadius.md,
        };
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: textColor }]}>
          {label}
        </Text>
      )}
      
      <TextInput
        style={[getInputStyle(), style]}
        placeholderTextColor={textSecondaryColor}
        {...props}
      />
      
      {error && (
        <Text style={[styles.error, { color: AppColors.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.xs,
  },
  error: {
    fontSize: Typography.sizes.xs,
    marginTop: Spacing.xs / 2,
  },
});