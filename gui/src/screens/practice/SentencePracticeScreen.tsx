import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ThemedView, 
  ThemedText, 
  StatisticBox, 
  PracticeButton,
  LoadingSpinner,
  ErrorMessage
} from '@/src/components/ui';
import { useTheme, useLanguageColors } from '@/src/utils/use-theme-color';
import { Spacing, Typography, AppColors } from '@/src/utils/theme';
import { useAuth } from '@/src/stores';

/**
 * Sentence practice screen for listening, speaking, and sentence construction
 */
export default function SentencePracticeScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const languageColors = useLanguageColors(user?.study_language_id || undefined);

  // Mock state for demonstration
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  // Mock data for demonstration
  const mockProgress = {
    listeningScore: 85,
    speakingScore: 72,
    sentencesCompleted: 34,
    pronunciationAccuracy: 78,
  };

  const startPractice = (type: string) => {
    console.log(`Starting ${type} practice`);
    setIsLoading(true);
    // Simulate loading
    setTimeout(() => setIsLoading(false), 2000);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingSpinner 
          message="Preparing your audio exercises..." 
          overlay 
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Sentence Practice
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Improve listening, speaking, and comprehension
          </ThemedText>
        </View>

        {/* Error Message (if any) */}
        {hasError && (
          <ErrorMessage
            message="Failed to load audio exercises. Please check your connection."
            actionText="Retry"
            onAction={() => setHasError(false)}
            style={styles.errorMessage}
          />
        )}

        {/* Skills Overview */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Your Skills
          </ThemedText>
          
          <View style={styles.statsGrid}>
            <StatisticBox
              title="Listening"
              value={`${mockProgress.listeningScore}%`}
              subtitle="Comprehension score"
              color={languageColors.primary}
            />
            <StatisticBox
              title="Speaking"
              value={`${mockProgress.speakingScore}%`}
              subtitle="Fluency score"
              color={languageColors.secondary}
            />
          </View>
          
          <View style={styles.statsGrid}>
            <StatisticBox
              title="Sentences"
              value={mockProgress.sentencesCompleted}
              subtitle="Completed today"
              color={AppColors.success}
            />
            <StatisticBox
              title="Pronunciation"
              value={`${mockProgress.pronunciationAccuracy}%`}
              subtitle="Accuracy"
              color={AppColors.info}
            />
          </View>
        </View>

        {/* Practice Modes */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Practice Modes
          </ThemedText>
          
          <View style={styles.practiceOptions}>
            <PracticeButton
              title="Listening Practice"
              subtitle="Understand spoken sentences"
              icon="mic.fill"
              variant="primary"
              onPress={() => startPractice('listening')}
              style={styles.practiceButton}
            />
            
            <PracticeButton
              title="Speaking Practice"
              subtitle="Improve pronunciation"
              icon="mic.fill"
              variant="secondary"
              onPress={() => startPractice('speaking')}
              style={styles.practiceButton}
            />
            
            <PracticeButton
              title="Sentence Building"
              subtitle="Construct sentences"
              icon="book.fill"
              variant="outline"
              onPress={() => startPractice('building')}
              style={styles.practiceButton}
            />
            
            <PracticeButton
              title="Conversation"
              subtitle="Interactive dialogue"
              icon="mic.fill"
              variant="success"
              onPress={() => startPractice('conversation')}
              style={styles.practiceButton}
            />
          </View>
        </View>

        {/* Audio Settings */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Audio Settings
          </ThemedText>
          
          <View style={styles.settingsGrid}>
            <StatisticBox
              title="Speech Speed"
              value="Normal"
              subtitle="Tap to adjust"
              onPress={() => console.log('Change speech speed')}
            />
            <StatisticBox
              title="Voice"
              value="Native"
              subtitle="Tap to change"
              onPress={() => console.log('Change voice')}
            />
          </View>
          
          <View style={styles.settingsGrid}>
            <StatisticBox
              title="Mic Sensitivity"
              value="Auto"
              subtitle="Tap to adjust"
              onPress={() => console.log('Change mic sensitivity')}
            />
            <StatisticBox
              title="Background"
              value="Quiet"
              subtitle="Noise level"
              onPress={() => console.log('Change background setting')}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  header: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  title: {
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  errorMessage: {
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  practiceOptions: {
    gap: Spacing.md,
  },
  practiceButton: {
    marginBottom: Spacing.sm,
  },
  settingsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
});