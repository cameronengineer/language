import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { PracticeButton } from '@/src/components/ui';
import { Spacing } from '@/src/utils/theme';
import { NoWordsModal } from './NoWordsModal';
import { router } from 'expo-router';

interface PracticeActionsProps {
  hasWords: boolean | null;
  loading?: boolean;
  onWordPractice?: () => void;
  onSentencePractice?: () => void;
}

/**
 * Practice action buttons with conditional modal behavior
 * Shows modal when user has no words, navigates to practice when they do
 */
export function PracticeActions({
  hasWords,
  loading = false,
  onWordPractice,
  onSentencePractice,
}: PracticeActionsProps) {
  const [showNoWordsModal, setShowNoWordsModal] = useState(false);

  const handleWordPractice = () => {
    if (hasWords === false) {
      setShowNoWordsModal(true);
      return;
    }

    if (onWordPractice) {
      onWordPractice();
    } else {
      // Default navigation to word practice screen
      router.push('/(tabs)/word-practice');
    }
  };

  const handleSentencePractice = () => {
    if (hasWords === false) {
      setShowNoWordsModal(true);
      return;
    }

    if (onSentencePractice) {
      onSentencePractice();
    } else {
      // Default navigation to sentence practice screen
      router.push('/(tabs)/sentence-practice');
    }
  };

  const handleExploreNavigation = () => {
    setShowNoWordsModal(false);
    router.push('/(tabs)/explore');
  };

  return (
    <>
      <View style={styles.container}>
        <PracticeButton
          title="Practice Words"
          subtitle="Flashcards & vocabulary"
          icon="book.fill"
          variant="primary"
          size="large"
          loading={loading}
          disabled={loading || hasWords === null}
          onPress={handleWordPractice}
          style={styles.button}
        />
        
        <PracticeButton
          title="Practice Speaking"
          subtitle="Listening & pronunciation"
          icon="mic.fill"
          variant="secondary"
          size="large"
          loading={loading}
          disabled={loading || hasWords === null}
          onPress={handleSentencePractice}
          style={styles.button}
        />
      </View>

      <NoWordsModal
        visible={showNoWordsModal}
        onClose={() => setShowNoWordsModal(false)}
        onExplore={handleExploreNavigation}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  button: {
    marginBottom: Spacing.sm,
  },
});