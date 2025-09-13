import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, ViewStyle } from 'react-native';
import { ThemedText } from '@/src/components/ui';
import { getCachedImageUrl } from '@/src/utils/hashUtils';
import { useTheme } from '@/src/utils/use-theme-color';
import { Spacing, BorderRadius, Typography } from '@/src/utils/theme';

export interface ImageDisplayProps {
  imageUrl?: string | null;
  nativeWord?: string;
  style?: ViewStyle;
  isLoading?: boolean;
  showPlaceholder?: boolean;
}

/**
 * Dynamic image display component with SHA-512 hash-based loading
 */
export default function ImageDisplay({
  imageUrl,
  nativeWord,
  style,
  isLoading = false,
  showPlaceholder = true,
}: ImageDisplayProps) {
  const { colors } = useTheme();
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  // Load image URL from hash if needed
  useEffect(() => {
    const loadImageUrl = async () => {
      if (imageUrl !== undefined) {
        setResolvedImageUrl(imageUrl);
        return;
      }

      if (nativeWord) {
        setImageLoading(true);
        try {
          const url = await getCachedImageUrl(nativeWord);
          setResolvedImageUrl(url);
        } catch (error) {
          console.error('Failed to load image URL:', error);
          setResolvedImageUrl(null);
        } finally {
          setImageLoading(false);
        }
      }
    };

    loadImageUrl();
  }, [imageUrl, nativeWord]);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageError(false);
    setImageLoading(false);
  };

  // Show loading state
  if (isLoading || imageLoading) {
    return (
      <View style={[styles.container, styles.placeholder, { backgroundColor: colors.backgroundSecondary }, style]}>
        <ThemedText style={styles.placeholderText}>Loading...</ThemedText>
      </View>
    );
  }

  // Show placeholder if no image or error
  if (!resolvedImageUrl || imageError) {
    if (!showPlaceholder) {
      return null;
    }

    return (
      <View style={[styles.container, styles.placeholder, { backgroundColor: colors.backgroundSecondary }, style]}>
        <ThemedText style={styles.placeholderText}>🖼️</ThemedText>
        <ThemedText style={[styles.placeholderSubtext, { color: colors.textMuted }]}>
          No image
        </ThemedText>
      </View>
    );
  }

  // Show actual image
  return (
    <View style={[styles.container, style]}>
      <Image
        source={{ uri: resolvedImageUrl }}
        style={styles.image}
        resizeMode="contain"
        onError={handleImageError}
        onLoad={handleImageLoad}
        onLoadStart={() => setImageLoading(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  placeholderText: {
    fontSize: Typography.sizes['2xl'],
    marginBottom: Spacing.xs,
  },
  placeholderSubtext: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    minHeight: 120,
  },
});
