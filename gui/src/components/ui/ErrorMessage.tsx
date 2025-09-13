import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { useThemeColor } from '@/src/utils/use-theme-color';
import { Spacing, BorderRadius, Typography, AppColors } from '@/src/utils/theme';
import { IconSymbol } from './ui/icon-symbol';

interface ErrorMessageProps {
  message: string;
  title?: string;
  variant?: 'error' | 'warning' | 'info';
  showIcon?: boolean;
  actionText?: string;
  onAction?: () => void;
  style?: ViewStyle;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const VARIANTS = {
  error: {
    backgroundColor: '#FEF2F2',
    borderColor: AppColors.error,
    textColor: '#7F1D1D',
    iconName: 'exclamationmark.triangle.fill',
  },
  warning: {
    backgroundColor: '#FFFBEB',
    borderColor: AppColors.warning,
    textColor: '#78350F',
    iconName: 'exclamationmark.triangle.fill',
  },
  info: {
    backgroundColor: '#EFF6FF',
    borderColor: AppColors.info,
    textColor: '#1E3A8A',
    iconName: 'info.circle.fill',
  },
} as const;

/**
 * Consistent error/warning/info message display component
 */
export function ErrorMessage({
  message,
  title,
  variant = 'error',
  showIcon = true,
  actionText,
  onAction,
  style,
  dismissible = false,
  onDismiss,
}: ErrorMessageProps) {
  const variantStyle = VARIANTS[variant];
  const backgroundColor = useThemeColor({ light: variantStyle.backgroundColor }, 'surface');

  return (
    <View style={[
      styles.container,
      {
        backgroundColor,
        borderColor: variantStyle.borderColor,
      },
      style,
    ]}>
      <View style={styles.content}>
        {showIcon && (
          <IconSymbol
            name={variantStyle.iconName as any}
            size={20}
            color={variantStyle.borderColor}
            style={styles.icon}
          />
        )}
        
        <View style={styles.textContainer}>
          {title && (
            <Text style={[
              styles.title,
              { color: variantStyle.textColor }
            ]}>
              {title}
            </Text>
          )}
          <Text style={[
            styles.message,
            { color: variantStyle.textColor }
          ]}>
            {message}
          </Text>
        </View>

        {dismissible && (
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={onDismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconSymbol
              name="xmark"
              size={16}
              color={variantStyle.textColor}
            />
          </TouchableOpacity>
        )}
      </View>

      {actionText && onAction && (
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: variantStyle.borderColor }]}
          onPress={onAction}
        >
          <Text style={[
            styles.actionText,
            { color: variantStyle.borderColor }
          ]}>
            {actionText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.xs / 2,
  },
  message: {
    fontSize: Typography.sizes.sm,
    lineHeight: Typography.lineHeights.normal * Typography.sizes.sm,
  },
  dismissButton: {
    padding: Spacing.xs / 2,
    marginLeft: Spacing.sm,
  },
  actionButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  actionText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
});