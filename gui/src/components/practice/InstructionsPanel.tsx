import React from 'react';
import { View, StyleSheet, Pressable, Modal } from 'react-native';
import { ThemedText, ThemedView, ErrorMessage } from '@/src/components/ui';
import { useTheme } from '@/src/utils/use-theme-color';
import { Spacing, BorderRadius, Typography, Shadows } from '@/src/utils/theme';
import { Ionicons } from '@expo/vector-icons';

export interface InstructionsPanelProps {
  visible: boolean;
  isFlipped: boolean;
  onDismiss: () => void;
  onExit?: () => void;
  error?: string | null;
  onDismissError?: () => void;
}

/**
 * Instructions panel overlay with controls and help
 */
export default function InstructionsPanel({
  visible,
  isFlipped,
  onDismiss,
  onExit,
  error,
  onDismissError,
}: InstructionsPanelProps) {
  const { colors } = useTheme();

  if (!visible && !error) {
    return null;
  }

  return (
    <Modal
      visible={visible || !!error}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <Pressable 
          style={styles.overlayPress} 
          onPress={onDismiss}
        />
        
        <View style={[styles.panel, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              {error ? 'Error' : 'How to Practice'}
            </ThemedText>
            
            <Pressable
              style={[styles.closeButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={onDismiss}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>

          {/* Error Message */}
          {error && (
            <ErrorMessage
              message={error}
              actionText="Dismiss"
              onAction={onDismissError}
              style={styles.errorMessage}
            />
          )}

          {/* Instructions Content */}
          {!error && (
            <View style={styles.content}>
              {/* Current State Instructions */}
              <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  {isFlipped ? 'Rate Your Knowledge' : 'Flip the Card'}
                </ThemedText>
                
                <ThemedText style={styles.description}>
                  {isFlipped 
                    ? 'Did you know this word? Swipe or use keyboard controls.'
                    : 'Look at the image and native word, then flip to see the translation.'
                  }
                </ThemedText>
              </View>

              {/* Controls */}
              <View style={styles.section}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  Controls
                </ThemedText>

                <View style={styles.controlsList}>
                  {/* Flip Controls */}
                  {!isFlipped && (
                    <View style={styles.controlItem}>
                      <View style={styles.controlKeys}>
                        <View style={[styles.key, { backgroundColor: colors.backgroundSecondary }]}>
                          <ThemedText style={styles.keyText}>TAP</ThemedText>
                        </View>
                        <View style={[styles.key, { backgroundColor: colors.backgroundSecondary }]}>
                          <ThemedText style={styles.keyText}>W</ThemedText>
                        </View>
                        <View style={[styles.key, { backgroundColor: colors.backgroundSecondary }]}>
                          <ThemedText style={styles.keyText}>↑</ThemedText>
                        </View>
                      </View>
                      <ThemedText style={styles.controlDescription}>
                        Flip card to see translation
                      </ThemedText>
                    </View>
                  )}

                  {/* Answer Controls */}
                  {isFlipped && (
                    <>
                      <View style={styles.controlItem}>
                        <View style={styles.controlKeys}>
                          <View style={[styles.key, { backgroundColor: colors.incorrect + '20' }]}>
                            <ThemedText style={[styles.keyText, { color: colors.incorrect }]}>A</ThemedText>
                          </View>
                          <View style={[styles.key, { backgroundColor: colors.incorrect + '20' }]}>
                            <ThemedText style={[styles.keyText, { color: colors.incorrect }]}>←</ThemedText>
                          </View>
                          <View style={[styles.key, { backgroundColor: colors.incorrect + '20' }]}>
                            <ThemedText style={[styles.keyText, { color: colors.incorrect }]}>SWIPE ←</ThemedText>
                          </View>
                        </View>
                        <ThemedText style={styles.controlDescription}>
                          I didn't know this word
                        </ThemedText>
                      </View>

                      <View style={styles.controlItem}>
                        <View style={styles.controlKeys}>
                          <View style={[styles.key, { backgroundColor: colors.correct + '20' }]}>
                            <ThemedText style={[styles.keyText, { color: colors.correct }]}>D</ThemedText>
                          </View>
                          <View style={[styles.key, { backgroundColor: colors.correct + '20' }]}>
                            <ThemedText style={[styles.keyText, { color: colors.correct }]}>→</ThemedText>
                          </View>
                          <View style={[styles.key, { backgroundColor: colors.correct + '20' }]}>
                            <ThemedText style={[styles.keyText, { color: colors.correct }]}>SWIPE →</ThemedText>
                          </View>
                        </View>
                        <ThemedText style={styles.controlDescription}>
                          I knew this word
                        </ThemedText>
                      </View>
                    </>
                  )}

                  {/* Universal Controls */}
                  <View style={styles.controlItem}>
                    <View style={styles.controlKeys}>
                      <View style={[styles.key, { backgroundColor: colors.backgroundSecondary }]}>
                        <ThemedText style={styles.keyText}>ESC</ThemedText>
                      </View>
                      <View style={[styles.key, { backgroundColor: colors.backgroundSecondary }]}>
                        <ThemedText style={styles.keyText}>H</ThemedText>
                      </View>
                    </View>
                    <ThemedText style={styles.controlDescription}>
                      Exit session / Toggle help
                    </ThemedText>
                  </View>
                </View>
              </View>

              {/* Tips */}
              <View style={styles.section}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  Tips
                </ThemedText>
                
                <View style={styles.tipsList}>
                  <ThemedText style={styles.tip}>
                    • Be honest about your knowledge - it helps improve learning
                  </ThemedText>
                  <ThemedText style={styles.tip}>
                    • Audio will play automatically when you flip the card
                  </ThemedText>
                  <ThemedText style={styles.tip}>
                    • Practice regularly for best results
                  </ThemedText>
                </View>
              </View>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            {onExit && (
              <Pressable
                style={[styles.exitButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={onExit}
              >
                <ThemedText style={styles.exitButtonText}>Exit Practice</ThemedText>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  overlayPress: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  panel: {
    maxWidth: 400,
    width: '100%',
    maxHeight: '80%',
    borderRadius: BorderRadius.xl,
    ...Shadows.light.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorMessage: {
    margin: Spacing.lg,
    marginTop: 0,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: Typography.sizes.sm,
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.sm,
    opacity: 0.8,
  },
  controlsList: {
    gap: Spacing.md,
  },
  controlItem: {
    gap: Spacing.xs,
  },
  controlKeys: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  key: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    minWidth: 32,
    alignItems: 'center',
  },
  keyText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  controlDescription: {
    fontSize: Typography.sizes.sm,
    opacity: 0.7,
  },
  tipsList: {
    gap: Spacing.xs,
  },
  tip: {
    fontSize: Typography.sizes.sm,
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.sm,
    opacity: 0.8,
  },
  footer: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  exitButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  exitButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
});
