import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Modal, PracticeButton } from '@/src/components/ui';
import { useTheme } from '@/src/utils/use-theme-color';
import { Spacing, Typography, BorderRadius } from '@/src/utils/theme';

interface NoWordsModalProps {
  visible: boolean;
  onClose: () => void;
  onExplore: () => void;
}

/**
 * Modal shown when user tries to practice but has no vocabulary words
 * Guides them to the explore screen to add words
 */
export function NoWordsModal({ visible, onClose, onExplore }: NoWordsModalProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="No Words to Practice"
    >
      <View style={styles.content}>
        {/* Icon/Illustration */}
        <View style={[styles.iconContainer, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={styles.icon}>📚</Text>
        </View>

        {/* Message */}
        <Text style={[styles.title, { color: colors.text }]}>
          Build Your Vocabulary First
        </Text>
        
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          You need to add some words to your vocabulary before you can start practicing. 
          Explore our content library to discover new words and phrases!
        </Text>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <PracticeButton
            title="Explore Content"
            subtitle="Find words to learn"
            icon="magnifyingglass"
            variant="primary"
            size="large"
            onPress={onExplore}
            style={styles.primaryButton}
          />
          
          <PracticeButton
            title="Maybe Later"
            variant="outline"
            size="medium"
            onPress={onClose}
            style={styles.secondaryButton}
          />
        </View>

        {/* Tips */}
        <View style={[styles.tips, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.tipsTitle, { color: colors.text }]}>
            💡 Quick Tip
          </Text>
          <Text style={[styles.tipsText, { color: colors.textSecondary }]}>
            Start with common words and phrases in your target language. 
            The more you add, the better your practice sessions will be!
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: Typography.sizes.base,
    lineHeight: Typography.sizes.base * 1.5,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  actions: {
    width: '100%',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  primaryButton: {
    marginBottom: 0,
  },
  secondaryButton: {
    marginBottom: 0,
  },
  tips: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    width: '100%',
  },
  tipsTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.xs,
  },
  tipsText: {
    fontSize: Typography.sizes.sm,
    lineHeight: Typography.sizes.sm * 1.4,
  },
});