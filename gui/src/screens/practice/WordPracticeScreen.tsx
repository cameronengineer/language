import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ThemedView,
  ThemedText,
  StatisticBox,
  PracticeButton,
  LoadingSpinner,
  ErrorMessage,
  Modal
} from '@/src/components/ui';
import { FlashcardContainer } from '@/src/components/practice';
import { SessionTracker, useSessionTracker } from '@/src/components/analytics';
import { useTheme, useLanguageColors } from '@/src/utils/use-theme-color';
import { Spacing, Typography, AppColors } from '@/src/utils/theme';
import { useAuth, usePracticeStore } from '@/src/stores';
import { api } from '@/src/services/api';

/**
 * Word practice screen for flashcard-based vocabulary learning
 */
export default function WordPracticeScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const languageColors = useLanguageColors(user?.study_language_id || undefined);
  
  // Component state
  const [viewMode, setViewMode] = useState<'overview' | 'practice'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [practiceStats, setPracticeStats] = useState({
    todayWords: 0,
    reviewDue: 0,
    newWords: 0,
    mastered: 0,
  });
  const [hasWords, setHasWords] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [sessionResults, setSessionResults] = useState<any>(null);

  // Practice store and session tracking
  const { isSessionActive, resetSession } = usePracticeStore();
  const { recordInteraction, startNewSession, endCurrentSession } = useSessionTracker();

  // Load practice statistics
  useEffect(() => {
    const loadStats = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        // Check if user has words
        const hasWordsResponse = await api.user.hasWords(user.id);
        setHasWords(hasWordsResponse.data.has_words);

        if (hasWordsResponse.data.has_words) {
          // Load user statistics
          const statsResponse = await api.user.getStatistics(user.id);
          setPracticeStats({
            todayWords: 0, // TODO: Add to API
            reviewDue: 0, // TODO: Add to API
            newWords: 0, // TODO: Add to API
            mastered: statsResponse.data.words_in_deep_memory,
          });
        }
      } catch (error) {
        console.error('Failed to load practice stats:', error);
        setHasError(true);
        setErrorMessage('Failed to load practice data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [user]);

  // Handle back button in practice mode
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (viewMode === 'practice') {
          handleExitPractice();
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription?.remove();
    }, [viewMode])
  );

  const startPractice = (type: string) => {
    if (!hasWords) {
      router.push('/explore');
      return;
    }

    console.log(`Starting ${type} practice`);
    setViewMode('practice');
  };

  const handleSessionComplete = (results: any) => {
    setSessionResults(results);
    setShowResultsModal(true);
    setViewMode('overview');
  };

  const handleExitPractice = () => {
    if (isSessionActive) {
      resetSession();
    }
    setViewMode('overview');
  };

  const handleDismissResults = () => {
    setShowResultsModal(false);
    setSessionResults(null);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingSpinner 
          message="Preparing your flashcards..." 
          overlay 
        />
      </SafeAreaView>
    );
  }

  // Show practice mode
  if (viewMode === 'practice') {
    return (
      <>
        {/* Session Tracker for Analytics */}
        <SessionTracker
          userId={user?.id || ''}
          catalogueId={user?.study_language_id || 'default'}
          sessionType="words"
          difficultyLevel="B1"
          onSessionStart={(sessionId) => {
            console.log('Session started:', sessionId);
          }}
          onSessionEnd={(session) => {
            console.log('Session completed:', session);
            handleSessionComplete({
              cards_reviewed: session.cards_total,
              cards_known: session.cards_correct,
              cards_unknown: session.cards_incorrect,
              accuracy: session.accuracy_percentage,
              duration: session.duration_minutes
            });
          }}
        />
        
        <FlashcardContainer
          catalogueId={user?.study_language_id}
          cardsPerSession={20}
          onSessionComplete={handleSessionComplete}
          onExit={handleExitPractice}
        />
      </>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingSpinner
          message="Loading practice data..."
          overlay
        />
      </SafeAreaView>
    );
  }

  // Show main overview
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
            Word Practice
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Master vocabulary with spaced repetition
          </ThemedText>
        </View>

        {/* Error Message (if any) */}
        {hasError && (
          <ErrorMessage
            message={errorMessage}
            actionText="Retry"
            onAction={() => {
              setHasError(false);
              setErrorMessage('');
            }}
            style={styles.errorMessage}
          />
        )}

        {/* No Words Message */}
        {!hasWords && !isLoading && (
          <View style={styles.section}>
            <ThemedText style={styles.noWordsTitle}>
              No vocabulary words yet
            </ThemedText>
            <ThemedText style={styles.noWordsSubtitle}>
              Add some words from the Explore tab to start practicing!
            </ThemedText>
            <PracticeButton
              title="Explore Words"
              subtitle="Find vocabulary to practice"
              icon="search"
              variant="primary"
              onPress={() => router.push('/explore')}
              style={styles.exploreButton}
            />
          </View>
        )}

        {/* Progress Overview */}
        {hasWords && (
          <>
            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Today's Progress
              </ThemedText>
              
              <View style={styles.statsGrid}>
                <StatisticBox
                  title="Words Today"
                  value={practiceStats.todayWords}
                  subtitle="Practiced"
                  color={languageColors.primary}
                />
                <StatisticBox
                  title="Due for Review"
                  value={practiceStats.reviewDue}
                  subtitle="Ready to practice"
                  color={AppColors.warning}
                />
              </View>
              
              <View style={styles.statsGrid}>
                <StatisticBox
                  title="New Words"
                  value={practiceStats.newWords}
                  subtitle="To learn"
                  color={AppColors.info}
                />
                <StatisticBox
                  title="Mastered"
                  value={practiceStats.mastered}
                  subtitle="Well known"
                  color={AppColors.success}
                />
              </View>
            </View>

            {/* Practice Options */}
            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Practice Modes
              </ThemedText>
              
              <View style={styles.practiceOptions}>
                <PracticeButton
                  title="Start Practice"
                  subtitle="Mixed flashcard session"
                  icon="flashcard.fill"
                  variant="primary"
                  onPress={() => startPractice('mixed')}
                  style={styles.practiceButton}
                />
                
                <PracticeButton
                  title="Quick Review"
                  subtitle="Short 10-card session"
                  icon="bolt.fill"
                  variant="secondary"
                  onPress={() => startPractice('quick')}
                  style={styles.practiceButton}
                />
                
                <PracticeButton
                  title="Challenge Mode"
                  subtitle="Test your knowledge"
                  icon="flame.fill"
                  variant="outline"
                  onPress={() => startPractice('challenge')}
                  style={styles.practiceButton}
                />
              </View>
            </View>

            {/* Settings */}
            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Practice Settings
              </ThemedText>
              
              <View style={styles.settingsGrid}>
                <StatisticBox
                  title="Cards per Session"
                  value="20"
                  subtitle="Tap to change"
                  onPress={() => console.log('Change cards per session')}
                />
                <StatisticBox
                  title="Difficulty"
                  value="Mixed"
                  subtitle="Tap to change"
                  onPress={() => console.log('Change difficulty')}
                />
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Session Results Modal */}
      {showResultsModal && sessionResults && (
        <Modal
          visible={showResultsModal}
          onClose={handleDismissResults}
          title="Practice Complete!"
        >
          <View style={styles.resultsContent}>
            <View style={styles.resultsGrid}>
              <StatisticBox
                title="Cards Reviewed"
                value={sessionResults.cards_reviewed}
                subtitle="Total cards"
                color={AppColors.info}
              />
              <StatisticBox
                title="Accuracy"
                value={`${Math.round(sessionResults.accuracy)}%`}
                subtitle="Correct answers"
                color={sessionResults.accuracy >= 70 ? AppColors.success : AppColors.warning}
              />
            </View>
            
            <View style={styles.resultsGrid}>
              <StatisticBox
                title="Known"
                value={sessionResults.cards_known}
                subtitle="Words you knew"
                color={AppColors.success}
              />
              <StatisticBox
                title="Learning"
                value={sessionResults.cards_unknown}
                subtitle="Words to review"
                color={AppColors.warning}
              />
            </View>

            <ThemedText style={styles.resultsMessage}>
              {sessionResults.accuracy >= 80
                ? "Excellent work! Keep it up!"
                : sessionResults.accuracy >= 60
                ? "Good progress! Practice makes perfect."
                : "Keep practicing - you're improving!"}
            </ThemedText>
          </View>
        </Modal>
      )}
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
  },
  noWordsTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  noWordsSubtitle: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: Spacing.xl,
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.base,
  },
  exploreButton: {
    alignSelf: 'center',
    minWidth: 200,
  },
  resultsContent: {
    padding: Spacing.md,
  },
  resultsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  resultsMessage: {
    textAlign: 'center',
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    opacity: 0.8,
    marginTop: Spacing.md,
  },
});