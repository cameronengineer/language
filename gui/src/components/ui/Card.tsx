import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/src/utils/use-theme-color';
import { Spacing, BorderRadius, Shadows } from '@/src/utils/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  padding?: keyof typeof Spacing;
  backgroundColor?: string;
}

/**
 * Card container component for consistent styling
 */
export function Card({
  children,
  style,
  onPress,
  disabled = false,
  shadow = 'md',
  padding = 'md',
  backgroundColor,
}: CardProps) {
  const { colors, colorScheme } = useTheme();
  
  const cardStyle = [
    styles.card,
    {
      backgroundColor: backgroundColor || colors.surface,
      padding: Spacing[padding],
      ...(shadow !== 'none' ? Shadows[colorScheme][shadow] : {}),
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
});