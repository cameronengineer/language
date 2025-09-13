import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColor } from '@/src/utils/use-theme-color';
import { Spacing, Typography, BorderRadius } from '@/src/utils/theme';
import { IconSymbol } from './ui/icon-symbol';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  leftAction?: {
    icon?: string;
    onPress: () => void;
  };
  rightAction?: {
    icon?: string;
    text?: string;
    onPress: () => void;
  };
  centerContent?: React.ReactNode;
  backgroundColor?: string;
  style?: any;
}

/**
 * Consistent header component for screens
 */
export function Header({
  title,
  subtitle,
  leftAction,
  rightAction,
  centerContent,
  backgroundColor,
  style,
}: HeaderProps) {
  const defaultBackgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const iconColor = useThemeColor({}, 'icon');

  return (
    <SafeAreaView 
      style={[
        styles.container, 
        { backgroundColor: backgroundColor || defaultBackgroundColor },
        style
      ]} 
      edges={['top']}
    >
      <View style={styles.header}>
        {/* Left Action */}
        <View style={styles.leftSection}>
          {leftAction && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={leftAction.onPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {leftAction.icon && (
                <IconSymbol
                  name={leftAction.icon as any}
                  size={24}
                  color={iconColor}
                />
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Center Content */}
        <View style={styles.centerSection}>
          {centerContent || (
            <View style={styles.titleContainer}>
              {title && (
                <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text style={[styles.subtitle, { color: textSecondaryColor }]} numberOfLines={1}>
                  {subtitle}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Right Action */}
        <View style={styles.rightSection}>
          {rightAction && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={rightAction.onPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {rightAction.text ? (
                <Text style={[styles.actionText, { color: textColor }]}>
                  {rightAction.text}
                </Text>
              ) : rightAction.icon ? (
                <IconSymbol
                  name={rightAction.icon as any}
                  size={24}
                  color={iconColor}
                />
              ) : null}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 56,
  },
  leftSection: {
    width: 50,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    width: 50,
    alignItems: 'flex-end',
  },
  actionButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    marginTop: 2,
  },
  actionText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
  },
});