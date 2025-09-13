import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import CardFace from './CardFace';
import { Translation } from '@/src/types/language';
import { useTheme } from '@/src/utils/use-theme-color';
import { Spacing } from '@/src/utils/theme';
import { useAudioStore, audioHelpers } from '@/src/stores';
import { audioPreloader } from '@/src/services/audio';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - (Spacing.lg * 2);
const FLIP_THRESHOLD = 50;
const SWIPE_THRESHOLD = 100;

export interface FlashcardComponentProps {
  translation: Translation | null;
  isFlipped: boolean;
  isLoading?: boolean;
  onFlip: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  disabled?: boolean;
  autoPlayAudio?: boolean;
  preloadNextWords?: string[];
  onAudioPlay?: (studyWord: string) => void;
  onAudioError?: (error: string) => void;
}

/**
 * Main flashcard component with flip animation and gesture handling
 */
export default function FlashcardComponent({
  translation,
  isFlipped,
  isLoading = false,
  onFlip,
  onSwipeLeft,
  onSwipeRight,
  disabled = false,
  autoPlayAudio = true,
  preloadNextWords = [],
  onAudioPlay,
  onAudioError,
}: FlashcardComponentProps) {
  const { colors } = useTheme();
  
  // Audio store for managing audio playback
  const { settings: audioSettings, initialize: initializeAudio } = useAudioStore();
  
  // Animation values
  const flipProgress = useSharedValue(0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Initialize audio system
  useEffect(() => {
    initializeAudio().catch(error => {
      console.error('Failed to initialize audio system:', error);
      onAudioError?.('Failed to initialize audio system');
    });
  }, [initializeAudio, onAudioError]);

  // Update flip animation when isFlipped changes
  React.useEffect(() => {
    flipProgress.value = withTiming(isFlipped ? 1 : 0, { duration: 600 });
  }, [isFlipped, flipProgress]);

  // Auto-play audio when card is flipped to back side
  useEffect(() => {
    const handleAutoPlay = async () => {
      if (
        isFlipped &&
        translation?.study_term?.phrase &&
        autoPlayAudio &&
        audioSettings.autoPlay &&
        !disabled &&
        !isLoading
      ) {
        try {
          await audioHelpers.autoPlay(translation.study_term.phrase);
          onAudioPlay?.(translation.study_term.phrase);
        } catch (error) {
          console.error('Auto-play failed:', error);
          onAudioError?.('Audio auto-play failed');
        }
      }
    };

    // Small delay to ensure flip animation starts first
    const timeoutId = setTimeout(handleAutoPlay, 300);
    return () => clearTimeout(timeoutId);
  }, [
    isFlipped,
    translation?.study_term?.phrase,
    autoPlayAudio,
    audioSettings.autoPlay,
    disabled,
    isLoading,
    onAudioPlay,
    onAudioError,
  ]);

  // Preload next words for better UX
  useEffect(() => {
    const preloadNext = async () => {
      if (preloadNextWords.length > 0 && audioSettings.preloadEnabled) {
        try {
          await audioPreloader.preloadSession(preloadNextWords);
        } catch (error) {
          console.warn('Failed to preload next audio files:', error);
        }
      }
    };

    // Preload after a delay to not interfere with current card
    const timeoutId = setTimeout(preloadNext, 1000);
    return () => clearTimeout(timeoutId);
  }, [preloadNextWords, audioSettings.preloadEnabled]);

  // Tap gesture for flipping
  const tapGesture = Gesture.Tap()
    .enabled(!disabled && !isLoading)
    .onEnd(() => {
      if (!isFlipped) {
        runOnJS(onFlip)();
      }
    });

  // Pan gesture for swiping
  const panGesture = Gesture.Pan()
    .enabled(!disabled && !isLoading && isFlipped)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      
      // Add subtle scale effect during swipe
      const progress = Math.abs(event.translationX) / SWIPE_THRESHOLD;
      scale.value = Math.max(0.95, 1 - progress * 0.05);
      
      // Change opacity based on swipe direction and distance
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD * 0.5) {
        opacity.value = 0.8;
      } else {
        opacity.value = 1;
      }
    })
    .onEnd((event) => {
      const shouldSwipeLeft = event.translationX < -SWIPE_THRESHOLD;
      const shouldSwipeRight = event.translationX > SWIPE_THRESHOLD;

      if (shouldSwipeLeft) {
        // Animate off screen left
        translateX.value = withTiming(-SCREEN_WIDTH, { duration: 200 });
        opacity.value = withTiming(0, { duration: 200 });
        runOnJS(onSwipeLeft)();
      } else if (shouldSwipeRight) {
        // Animate off screen right
        translateX.value = withTiming(SCREEN_WIDTH, { duration: 200 });
        opacity.value = withTiming(0, { duration: 200 });
        runOnJS(onSwipeRight)();
      } else {
        // Snap back
        translateX.value = withTiming(0, { duration: 200 });
        scale.value = withTiming(1, { duration: 200 });
        opacity.value = withTiming(1, { duration: 200 });
      }
    });

  // Combined gesture
  const combinedGesture = Gesture.Simultaneous(tapGesture, panGesture);

  // Front face animation
  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [0, 1], [0, 180]);
    const frontOpacity = interpolate(flipProgress.value, [0, 0.5, 1], [1, 0, 0]);

    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
        { translateX: translateX.value },
        { scale: scale.value },
      ],
      opacity: frontOpacity * opacity.value,
    };
  });

  // Back face animation
  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [0, 1], [180, 360]);
    const backOpacity = interpolate(flipProgress.value, [0, 0.5, 1], [0, 0, 1]);

    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
        { translateX: translateX.value },
        { scale: scale.value },
      ],
      opacity: backOpacity * opacity.value,
    };
  });

  // Swipe indicator styles
  const leftIndicatorStyle = useAnimatedStyle(() => {
    const progress = Math.max(0, -translateX.value / SWIPE_THRESHOLD);
    return {
      opacity: Math.min(1, progress),
      transform: [{ scale: Math.min(1.2, 0.8 + progress * 0.4) }],
    };
  });

  const rightIndicatorStyle = useAnimatedStyle(() => {
    const progress = Math.max(0, translateX.value / SWIPE_THRESHOLD);
    return {
      opacity: Math.min(1, progress),
      transform: [{ scale: Math.min(1.2, 0.8 + progress * 0.4) }],
    };
  });

  if (!translation) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <CardFace
            isRevealed={false}
            isLoading={true}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Swipe Indicators */}
      {isFlipped && (
        <>
          <Animated.View style={[styles.swipeIndicator, styles.leftIndicator, leftIndicatorStyle]}>
            <View style={[styles.indicatorContent, { backgroundColor: colors.incorrect }]}>
              <View style={styles.indicatorIcon}>
                <View style={[styles.indicatorDot, { backgroundColor: colors.background }]} />
              </View>
            </View>
          </Animated.View>

          <Animated.View style={[styles.swipeIndicator, styles.rightIndicator, rightIndicatorStyle]}>
            <View style={[styles.indicatorContent, { backgroundColor: colors.correct }]}>
              <View style={styles.indicatorIcon}>
                <View style={[styles.indicatorDot, { backgroundColor: colors.background }]} />
              </View>
            </View>
          </Animated.View>
        </>
      )}

      {/* Flashcard */}
      <GestureDetector gesture={combinedGesture}>
        <View style={styles.cardContainer}>
          {/* Front Face */}
          <Animated.View style={[styles.card, frontAnimatedStyle]}>
            <CardFace
              isRevealed={false}
              nativeWord={translation.native_term.phrase}
              onPress={!disabled && !isLoading ? onFlip : undefined}
              isLoading={isLoading}
              showImage={true}
              showAudio={false}
            />
          </Animated.View>

          {/* Back Face */}
          <Animated.View style={[styles.card, styles.backCard, backAnimatedStyle]}>
            <CardFace
              isRevealed={true}
              studyWord={translation.study_term.phrase}
              onPress={undefined}
              isLoading={isLoading}
              showImage={false}
              showAudio={true}
              audioProps={{
                autoPlay: false, // Controlled by flashcard auto-play
                onPlayStart: () => onAudioPlay?.(translation.study_term.phrase),
                onError: onAudioError,
              }}
            />
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: 500,
    position: 'relative',
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
  },
  backCard: {
    transform: [{ rotateY: '180deg' }],
  },
  swipeIndicator: {
    position: 'absolute',
    top: '50%',
    width: 80,
    height: 80,
    marginTop: -40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  leftIndicator: {
    left: Spacing.xl,
  },
  rightIndicator: {
    right: Spacing.xl,
  },
  indicatorContent: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  indicatorIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
