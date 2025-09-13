import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemeColor } from '@/src/utils/use-theme-color';
import { Spacing, Typography, AppColors } from '@/src/utils/theme';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  style?: ViewStyle;
  overlay?: boolean;
}

/**
 * Loading spinner component with optional message
 * Can be used as overlay or inline
 */
export function LoadingSpinner({
  size = 'large',
  color,
  message,
  style,
  overlay = false,
}: LoadingSpinnerProps) {
  const textColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const spinnerColor = color || AppColors.primary;

  const containerStyle = [
    overlay ? styles.overlay : styles.container,
    overlay && { backgroundColor: `${backgroundColor}CC` }, // Semi-transparent background
    style,
  ];

  return (
    <View style={containerStyle}>
      <ActivityIndicator size={size} color={spinnerColor} />
      {message && (
        <Text style={[styles.message, { color: textColor }]}>
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  message: {
    marginTop: Spacing.md,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    textAlign: 'center',
  },
});