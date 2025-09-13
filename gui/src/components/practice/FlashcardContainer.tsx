import React, { useEffect, useCallback, useState } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import FlashcardComponent from './FlashcardComponent';
import { InstructionsPanel } from './index';
import { usePracticeStore } from '@/src/stores/practiceStore';
import { useAuth, useAudioStore } from '@/src/stores';
import { useTheme } from '@/src/utils/use-theme-color';
import { Spacing } from '@/src/utils/theme';
import { audioPreloader } from '@/src/services/audio';
import { AudioErrorHandler } from '@/src/components/ui';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface FlashcardContainerProps {
  catalogueId?: string;
  cardsPerSession?: number;
  onSessionComplete?: (results: any) => void;
  onExit?: () => void;
}

/**
 * Main container for flashcard practice session
 */
export default function FlashcardContainer({
  catalogueId,
  cardsPerSession = 20,
  onSessionComplete,
  onExit,
}: FlashcardContainerProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  // Audio state
  const {
    initialize: initializeAudio,
    settings: audioSettings,
    lastError: audioError,
    clearError: clearAudioError,
  } = useAudioStore();
  
  // Local audio state
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [preloadedWords, setPreloadedWords] = useState<string[]>([]);
  
  const {
    currentTranslation,
    isFlipped,
    isLoading,
    isSessionActive,
    cardsReviewed,
    cardsKnown,
    cardsUnknown,
    sessionDuration,
    error,
    showInstructions,
    startSession,
    endSession,
    flipCard,
    markCardKnown,
    markCardUnknown,
    toggleInstructions,
    clearError,
  } = usePracticeStore();

  // Initialize audio system
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await initializeAudio();
        setAudioInitialized(true);
        console.log('Audio system initialized for practice session');
      } catch (error) {
        console.error('Failed to initialize audio system:', error);
      }
    };

    if (!audioInitialized) {
      setupAudio();
    }
  }, [initializeAudio, audioInitialized]);

  // Start session when component mounts
  useEffect(() => {
    if (user && !isSessionActive && audioInitialized) {
      const config = {
        catalogue_id: catalogueId || '',
        session_type: 'words' as const,
        cards_per_session: cardsPerSession,
        include_audio: true,
        shuffle_cards: true,
      };
      
      startSession(user.id, config);
    }
  }, [user, catalogueId, cardsPerSession, isSessionActive, startSession, audioInitialized]);

  // Preload audio for upcoming words
  useEffect(() => {
    const preloadAudio = async () => {
      if (currentTranslation && audioSettings.preloadEnabled) {
        try {
          // For demo purposes, create some sample upcoming words
          // In a real implementation, this would come from the practice store or API
          const upcomingWords = [
            currentTranslation.study_term.phrase,
            // Add more words that would be coming up in the session
          ].filter(Boolean);

          if (upcomingWords.length > 0) {
            await audioPreloader.preloadSession(upcomingWords);
            setPreloadedWords(upcomingWords);
            console.log('Preloaded audio for upcoming words:', upcomingWords);
          }
        } catch (error) {
          console.warn('Failed to preload audio:', error);
        }
      }
    };

    if (currentTranslation && audioInitialized) {
      preloadAudio();
    }
  }, [currentTranslation, audioSettings.preloadEnabled, audioInitialized]);

  // Handle session completion
  useEffect(() => {
    if (!isSessionActive && cardsReviewed > 0) {
      const results = {
        cards_reviewed: cardsReviewed,
        cards_known: cardsKnown,
        cards_unknown: cardsUnknown,
        duration_minutes: sessionDuration,
        accuracy: cardsReviewed > 0 ? (cardsKnown / cardsReviewed) * 100 : 0,
      };
      
      onSessionComplete?.(results);
    }
  }, [isSessionActive, cardsReviewed, cardsKnown, cardsUnknown, sessionDuration, onSessionComplete]);

  // Keyboard handling
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'web') {
        const handleKeyPress = (event: KeyboardEvent) => {
          if (!user || !isSessionActive || isLoading) return;

          switch (event.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
              event.preventDefault();
              if (!isFlipped) {
                flipCard();
              }
              break;
            case 'a':
            case 'arrowleft':
              event.preventDefault();
              if (isFlipped) {
                markCardUnknown(user.id);
              }
              break;
            case 'd':
            case 'arrowright':
              event.preventDefault();
              if (isFlipped) {
                markCardKnown(user.id);
              }
              break;
            case 'escape':
              event.preventDefault();
              handleExit();
              break;
            case 'h':
            case '?':
              event.preventDefault();
              toggleInstructions();
              break;
          }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
      }
    }, [user, isSessionActive, isLoading, isFlipped, flipCard, markCardKnown, markCardUnknown, toggleInstructions])
  );

  const handleFlip = () => {
    if (!isLoading && !isFlipped) {
      flipCard();
    }
  };

  const handleSwipeLeft = () => {
    if (user && isFlipped && !isLoading) {
      markCardUnknown(user.id);
    }
  };

  const handleSwipeRight = () => {
    if (user && isFlipped && !isLoading) {
      markCardKnown(user.id);
    }
  };

  const handleExit = async () => {
    if (user && isSessionActive) {
      await endSession(user.id);
    }
    onExit?.();
  };

  const handleDismissError = () => {
    clearError();
  };

  const handleAudioPlay = (studyWord: string) => {
    console.log('Audio started playing for:', studyWord);
  };

  const handleAudioError = (error: string) => {
    console.error('Audio error:', error);
    // Audio errors are handled by the audio store, but we can log them here
  };

  const handleRetryAudio = () => {
    clearAudioError();
    // The AudioButton will automatically retry when the error is cleared
  };

  // Progress calculation
  const progressPercentage = cardsPerSession > 0 ? (cardsReviewed / cardsPerSession) * 100 : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Progress Header */}
        <View style={styles.header}>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: colors.tint,
                  width: `${Math.min(100, progressPercentage)}%`,
                }
              ]} 
            />
          </View>
          
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <View style={styles.statText}>
                {cardsReviewed} / {cardsPerSession}
              </View>
            </View>
          </View>
        </View>

        {/* Audio Error Display */}
        {audioError && (
          <View style={styles.audioErrorContainer}>
            <AudioErrorHandler
              error={audioError}
              studyWord={currentTranslation?.study_term?.phrase}
              onRetry={handleRetryAudio}
              onDismiss={clearAudioError}
              compact={true}
            />
          </View>
        )}

        {/* Flashcard */}
        <View style={styles.flashcardArea}>
          <FlashcardComponent
            translation={currentTranslation}
            isFlipped={isFlipped}
            isLoading={isLoading || !audioInitialized}
            onFlip={handleFlip}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            disabled={!isSessionActive || !audioInitialized}
            autoPlayAudio={audioSettings.autoPlay}
            preloadNextWords={preloadedWords}
            onAudioPlay={handleAudioPlay}
            onAudioError={handleAudioError}
          />
        </View>

        {/* Instructions Panel */}
        <InstructionsPanel
          visible={showInstructions}
          isFlipped={isFlipped}
          onDismiss={() => toggleInstructions()}
          onExit={handleExit}
          error={error}
          onDismissError={handleDismissError}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  header: {
    paddingVertical: Spacing.md,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
  audioErrorContainer: {
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  flashcardArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: SCREEN_HEIGHT * 0.6,
  },
});
