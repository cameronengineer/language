import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, ViewStyle } from 'react-native';
import { ThemedText, ThemedView } from '@/src/components/ui';
import { useTheme } from '@/src/utils/use-theme-color';
import { Spacing, Typography, BorderRadius, AppColors } from '@/src/utils/theme';
import { ExploreCatalogue, CATALOGUE_THEMES } from '@/src/types/catalogue';
import { getCachedImageUrl } from '@/src/utils/hashUtils';

interface CatalogueCardProps {
  catalogue: ExploreCatalogue;
  onPress: () => void;
  style?: ViewStyle;
}

/**
 * Individual catalogue card displaying name, image, and metadata
 */
export default function CatalogueCard({ catalogue, onPress, style }: CatalogueCardProps) {
  const { colors } = useTheme();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  
  const themeInfo = CATALOGUE_THEMES[catalogue.theme] || CATALOGUE_THEMES.general;

  React.useEffect(() => {
    // Generate image URL from catalogue name hash
    const loadImage = async () => {
      try {
        const url = await getCachedImageUrl(catalogue.name);
        setImageUrl(url);
      } catch (error) {
        console.error('Failed to generate image URL:', error);
        setImageError(true);
      }
    };

    loadImage();
  }, [catalogue.name]);

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface }, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
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
          <View style={[styles.placeholder, { backgroundColor: themeInfo.color + '20' }]}>
            <ThemedText style={[styles.placeholderIcon, { color: themeInfo.color }]}>
              {themeInfo.icon}
            </ThemedText>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Theme Badge */}
        <View style={[styles.themeBadge, { backgroundColor: themeInfo.color }]}>
          <ThemedText style={styles.themeText}>
            {themeInfo.name}
          </ThemedText>
        </View>

        {/* Title */}
        <ThemedText 
          type="defaultSemiBold" 
          style={styles.title}
          numberOfLines={2}
        >
          {catalogue.name}
        </ThemedText>

        {/* Description */}
        <ThemedText 
          style={styles.description}
          numberOfLines={2}
        >
          {catalogue.description}
        </ThemedText>

        {/* Footer */}
        <View style={styles.footer}>
          <ThemedText style={styles.wordCount}>
            {catalogue.wordCount || catalogue.total_terms || 0} words
          </ThemedText>
          <ThemedText style={[styles.level, { color: themeInfo.color }]}>
            {catalogue.cefr_level}
          </ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: AppColors.gray200,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
  placeholderIcon: {
    fontSize: 32,
  },
  content: {
    padding: Spacing.sm,
  },
  themeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  themeText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  title: {
    marginBottom: Spacing.xs,
    fontSize: Typography.sizes.sm,
    lineHeight: Typography.lineHeights.tight * Typography.sizes.sm,
  },
  description: {
    fontSize: Typography.sizes.xs,
    opacity: 0.7,
    marginBottom: Spacing.sm,
    lineHeight: Typography.lineHeights.normal * Typography.sizes.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wordCount: {
    fontSize: Typography.sizes.xs,
    opacity: 0.6,
  },
  level: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
});