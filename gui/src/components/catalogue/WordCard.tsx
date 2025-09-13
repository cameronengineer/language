import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ThemedText } from '@/src/components/ui';
import { useTheme } from '@/src/utils/use-theme-color';
import { Spacing, Typography, BorderRadius, AppColors } from '@/src/utils/theme';
import { ExploreTranslation } from '@/src/types/catalogue';
import { getCachedImageUrl } from '@/src/utils/hashUtils';

interface WordCardProps {
  translation: ExploreTranslation;
  isSelected: boolean;
  onPress: () => void;
}

/**
 * Individual word card with image and selection state
 */
export default function WordCard({ translation, isSelected, onPress }: WordCardProps) {
  const { colors } = useTheme();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  React.useEffect(() => {
    // Generate image URL from native word hash
    const loadImage = async () => {
      try {
        const url = await getCachedImageUrl(translation.nativeWord);
        setImageUrl(url);
      } catch (error) {
        console.error('Failed to generate image URL:', error);
        setImageError(true);
      }
    };

    loadImage();
  }, [translation.nativeWord]);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { 
          backgroundColor: colors.surface,
          borderColor: isSelected ? AppColors.primary : colors.border,
        },
        isSelected && styles.selectedContainer
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <View style={[styles.selectionIndicator, { backgroundColor: AppColors.primary }]}>
          <ThemedText style={styles.checkmark}>✓</ThemedText>
        </View>
      )}

      {/* Image/Placeholder */}
      <View style={styles.imageContainer}>
        {imageUrl && !imageError ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            onError={() => setImageError(true)}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: AppColors.gray100 }]}>
            <ThemedText style={styles.placeholderText}>
              📝
            </ThemedText>
          </View>
        )}
      </View>

      {/* Word Content */}
      <View style={styles.content}>
        {/* Native Word (Primary) */}
        <ThemedText 
          type="defaultSemiBold" 
          style={styles.nativeWord}
          numberOfLines={2}
        >
          {translation.nativeWord}
        </ThemedText>

        {/* Study Word (Translation) */}
        <ThemedText 
          style={styles.studyWord}
          numberOfLines={1}
        >
          {translation.studyWord}
        </ThemedText>

        {/* Additional Info */}
        {translation.partOfSpeech && (
          <ThemedText style={styles.partOfSpeech}>
            {translation.partOfSpeech}
          </ThemedText>
        )}
      </View>

      {/* Difficulty Indicator */}
      {translation.difficulty && (
        <View style={styles.difficultyContainer}>
          <View style={[
            styles.difficultyDot,
            { backgroundColor: getDifficultyColor(translation.difficulty) }
          ]} />
        </View>
      )}
    </TouchableOpacity>
  );
}

/**
 * Get color based on difficulty level (1-5)
 */
const getDifficultyColor = (difficulty: number): string => {
  if (difficulty <= 1) return AppColors.success; // Easy - Green
  if (difficulty <= 2) return AppColors.warning; // Medium - Orange  
  if (difficulty <= 3) return AppColors.secondary; // Hard - Blue
  if (difficulty <= 4) return AppColors.error; // Very Hard - Red
  return AppColors.gray500; // Unknown
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedContainer: {
    borderWidth: 3,
    elevation: 4,
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  selectionIndicator: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  imageContainer: {
    height: 80,
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: Typography.sizes['2xl'],
    opacity: 0.5,
  },
  content: {
    padding: Spacing.sm,
    minHeight: 60,
  },
  nativeWord: {
    marginBottom: Spacing.xs / 2,
    fontSize: Typography.sizes.sm,
    lineHeight: Typography.lineHeights.tight * Typography.sizes.sm,
  },
  studyWord: {
    fontSize: Typography.sizes.xs,
    opacity: 0.7,
    marginBottom: Spacing.xs / 2,
  },
  partOfSpeech: {
    fontSize: Typography.sizes.xs,
    opacity: 0.5,
    fontStyle: 'italic',
  },
  difficultyContainer: {
    position: 'absolute',
    top: Spacing.xs,
    left: Spacing.xs,
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});