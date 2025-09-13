import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LoadingSpinner, ThemedText } from '@/src/components/ui';
import { Spacing, Typography } from '@/src/utils/theme';

interface ExploreLoadingStateProps {
  message?: string;
}

/**
 * Loading state component for explore screen
 */
export default function ExploreLoadingState({ 
  message = "Loading catalogues..." 
}: ExploreLoadingStateProps) {
  return (
    <View style={styles.container}>
      <LoadingSpinner size="large" />
      <ThemedText style={styles.message}>
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  message: {
    marginTop: Spacing.md,
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    opacity: 0.7,
  },
});