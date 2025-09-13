import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { useThemeColor, useTheme } from '@/src/utils/use-theme-color';
import { Spacing, BorderRadius, Typography, Shadows } from '@/src/utils/theme';
import { IconSymbol } from './ui/icon-symbol';

interface StatisticBoxProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
  onPress?: () => void;
  loading?: boolean;
}

/**
 * Component for displaying statistics on the dashboard
 * Shows title, value, optional subtitle and icon
 */
export function StatisticBox({
  title,
  value,
  subtitle,
  icon,
  color,
  backgroundColor,
  style,
  onPress,
  loading = false,
}: StatisticBoxProps) {
  const { colors, colorScheme } = useTheme();
  const surfaceColor = useThemeColor({}, 'surface');
  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  
  const containerStyle = [
    styles.container,
    {
      backgroundColor: backgroundColor || surfaceColor,
      ...Shadows[colorScheme].md,
    },
    style,
  ];

  const content = (
    <>
      <View style={styles.header}>
        <Text style={[styles.title, { color: color || textSecondaryColor }]}>
          {title}
        </Text>
        {icon && (
          <IconSymbol
            name={icon as any}
            size={20}
            color={color || colors.icon}
          />
        )}
      </View>
      
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingPlaceholder} />
        ) : (
          <Text style={[styles.value, { color: color || textColor }]}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </Text>
        )}
        
        {subtitle && !loading && (
          <Text style={[styles.subtitle, { color: textSecondaryColor }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={containerStyle} onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    minHeight: 100,
    flex: 1,
    minWidth: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  value: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    lineHeight: Typography.sizes['2xl'] * 1.2,
    marginBottom: Spacing.xs / 2,
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.normal,
    opacity: 0.8,
  },
  loadingPlaceholder: {
    height: Typography.sizes['2xl'],
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs / 2,
  },
});