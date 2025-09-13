/**
 * AudioErrorHandler - Component for handling audio errors gracefully
 * Provides user-friendly error messages and recovery options
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText, Card } from '@/src/components/ui';
import { useTheme } from '@/src/utils/use-theme-color';
import { Spacing, Typography, BorderRadius } from '@/src/utils/theme';
import { AudioError, AudioErrorType } from '@/src/types/audio';

export interface AudioErrorHandlerProps {
  error: AudioError;
  studyWord?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showRetry?: boolean;
  compact?: boolean;
}

/**
 * Audio error handler component with user-friendly messages
 */
export default function AudioErrorHandler({
  error,
  studyWord,
  onRetry,
  onDismiss,
  showRetry = true,
  compact = false,
}: AudioErrorHandlerProps) {
  const { colors } = useTheme();

  const getErrorMessage = (errorType: AudioErrorType): { title: string; description: string; icon: string } => {
    switch (errorType) {
      case 'file_not_found':
        return {
          title: 'Audio Not Available',
          description: `No audio file found for "${studyWord || 'this word'}". This may be a new word that hasn't been recorded yet.`,
          icon: 'musical-note-off',
        };
      case 'network_error':
        return {
          title: 'Network Issue',
          description: 'Unable to download audio. Please check your internet connection.',
          icon: 'cloud-offline',
        };
      case 'format_unsupported':
        return {
          title: 'Audio Format Error',
          description: 'The audio file format is not supported on this device.',
          icon: 'warning',
        };
      case 'permission_denied':
        return {
          title: 'Permission Required',
          description: 'Audio playback permission is required. Please check your device settings.',
          icon: 'lock-closed',
        };
      case 'playback_failed':
        return {
          title: 'Playback Error',
          description: 'Unable to play audio. This may be a temporary issue.',
          icon: 'play-skip-forward',
        };
      default:
        return {
          title: 'Audio Error',
          description: 'An unexpected audio error occurred. Please try again.',
          icon: 'alert-circle',
        };
    }
  };

  const errorInfo = getErrorMessage(error.type);

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <Ionicons
          name={errorInfo.icon as any}
          size={16}
          color={colors.textMuted}
          style={styles.compactIcon}
        />
        <ThemedText style={[styles.compactText, { color: colors.textMuted }]}>
          {errorInfo.title}
        </ThemedText>
        {showRetry && onRetry && (
          <Pressable
            style={[styles.compactRetryButton, { backgroundColor: colors.tint }]}
            onPress={onRetry}
            android_ripple={{ color: colors.background + '40', borderless: true }}
          >
            <Ionicons name="refresh" size={14} color={colors.background} />
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <Card style={StyleSheet.flatten([styles.container, { borderColor: colors.border }])}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: colors.backgroundSecondary }]}>
          <Ionicons
            name={errorInfo.icon as any}
            size={24}
            color={colors.textSecondary}
          />
        </View>
        <View style={styles.titleContainer}>
          <ThemedText style={[styles.title, { color: colors.text }]}>
            {errorInfo.title}
          </ThemedText>
          {studyWord && (
            <ThemedText style={[styles.studyWord, { color: colors.tint }]}>
              "{studyWord}"
            </ThemedText>
          )}
        </View>
        {onDismiss && (
          <Pressable
            style={styles.dismissButton}
            onPress={onDismiss}
            android_ripple={{ color: colors.textMuted + '20', borderless: true }}
          >
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      <ThemedText style={[styles.description, { color: colors.textSecondary }]}>
        {errorInfo.description}
      </ThemedText>

      {error.code && (
        <ThemedText style={[styles.errorCode, { color: colors.textMuted }]}>
          Error code: {error.code}
        </ThemedText>
      )}

      <ThemedText style={[styles.timestamp, { color: colors.textMuted }]}>
        {error.timestamp.toLocaleTimeString()}
      </ThemedText>

      {showRetry && onRetry && (
        <View style={styles.actions}>
          <Pressable
            style={[styles.retryButton, { backgroundColor: colors.tint }]}
            onPress={onRetry}
            android_ripple={{ color: colors.background + '40' }}
          >
            <Ionicons name="refresh" size={18} color={colors.background} />
            <ThemedText style={[styles.retryButtonText, { color: colors.background }]}>
              Try Again
            </ThemedText>
          </Pressable>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    margin: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginVertical: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.xs,
  },
  studyWord: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    fontStyle: 'italic',
  },
  dismissButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  description: {
    fontSize: Typography.sizes.sm,
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.sm,
    marginBottom: Spacing.sm,
  },
  errorCode: {
    fontSize: Typography.sizes.xs,
    fontFamily: 'monospace',
    marginBottom: Spacing.xs,
  },
  timestamp: {
    fontSize: Typography.sizes.xs,
    marginBottom: Spacing.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    marginLeft: Spacing.xs,
  },
  compactIcon: {
    marginRight: Spacing.xs,
  },
  compactText: {
    flex: 1,
    fontSize: Typography.sizes.xs,
  },
  compactRetryButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginLeft: Spacing.xs,
  },
});