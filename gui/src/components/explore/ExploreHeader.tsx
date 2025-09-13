import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/src/components/ui';
import { Spacing, Typography } from '@/src/utils/theme';

interface ExploreHeaderProps {
  title?: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
}

/**
 * Header component for the explore screen
 */
export default function ExploreHeader({ 
  title = "Explore", 
  subtitle = "Discover new learning content and catalogues",
  rightElement 
}: ExploreHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <ThemedText type="title" style={styles.title}>
          {title}
        </ThemedText>
        {subtitle && (
          <ThemedText style={styles.subtitle}>
            {subtitle}
          </ThemedText>
        )}
      </View>
      {rightElement && (
        <View style={styles.rightElement}>
          {rightElement}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
    fontSize: Typography.sizes.sm,
  },
  rightElement: {
    position: 'absolute',
    right: Spacing.md,
  },
});