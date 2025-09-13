import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText, ThemedView } from '@/src/components/ui';
// import ImageDisplay from './ImageDisplay';
import AudioButton, { AudioButtonProps } from './AudioButton';
import { useTheme } from '@/src/utils/use-theme-color';
import { Spacing, Typography, BorderRadius, Shadows } from '@/src/utils/theme';

export interface CardFaceProps {
  isRevealed: boolean;
  nativeWord?: string;
  studyWord?: string;
  imageUrl?: string | null;
  audioUrl?: string | null;
  onPress?: () => void;
  isLoading?: boolean;
  showImage?: boolean;
  showAudio?: boolean;
  audioProps?: Partial<AudioButtonProps>;
}

/**
 * Individual card face component for front/back display
 */
export default function CardFace({
  isRevealed,
  nativeWord,
  studyWord,
  imageUrl,
  audioUrl,
  onPress,
  isLoading = false,
  showImage = true,
  showAudio = true,
  audioProps,
}: CardFaceProps) {
  const { colors } = useTheme();

  const displayWord = isRevealed ? studyWord : nativeWord;
  const shouldShowImage = showImage && !isRevealed && imageUrl !== undefined;
  const shouldShowAudio = showAudio && isRevealed && audioUrl !== undefined;

  return (
    <Pressable
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          shadowColor: colors.shadow,
        },
      ]}
      onPress={onPress}
      disabled={isLoading}
      android_ripple={{
        color: colors.tint + '20',
        borderless: false,
      }}
    >
      <ThemedView style={styles.content}>
        {/* Image Display (Front Side Only) */}
        {shouldShowImage && (
          <View style={styles.imageContainer}>
            {/* <ImageDisplay
              imageUrl={imageUrl}
              nativeWord={nativeWord}
              style={styles.image}
              isLoading={isLoading}
            /> */}
            <View style={[styles.image, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
              <ThemedText>🖼️ Image</ThemedText>
            </View>
          </View>
        )}

        {/* Word Display */}
        <View style={styles.wordContainer}>
          <ThemedText
            type="title"
            style={[
              styles.word,
              isRevealed ? styles.studyWord : styles.nativeWord,
            ]}
            numberOfLines={3}
            adjustsFontSizeToFit
          >
            {displayWord || '...'}
          </ThemedText>
        </View>

        {/* Audio Button (Back Side Only) */}
        {shouldShowAudio && (
          <View style={styles.audioContainer}>
            <AudioButton
              audioUrl={audioUrl}
              studyWord={studyWord}
              size="large"
              autoPlay={false} // Controlled by flashcard
              {...audioProps}
            />
          </View>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <View style={[styles.loadingOverlay, { backgroundColor: colors.background + 'AA' }]}>
            <ThemedText style={styles.loadingText}>Loading...</ThemedText>
          </View>
        )}
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    ...Shadows.light.md,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  imageContainer: {
    flex: 0.4,
    width: '100%',
    marginBottom: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    maxWidth: 200,
    maxHeight: 150,
  },
  wordContainer: {
    flex: 0.4,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  word: {
    textAlign: 'center',
    lineHeight: Typography.lineHeights.tight * Typography.sizes.xl,
  },
  nativeWord: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  studyWord: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    opacity: 0.9,
  },
  audioContainer: {
    flex: 0.2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
  },
  loadingText: {
    fontSize: Typography.sizes.sm,
    opacity: 0.7,
  },
});
