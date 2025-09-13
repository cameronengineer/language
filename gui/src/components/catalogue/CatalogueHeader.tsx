import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/src/components/ui';
import { useTheme } from '@/src/utils/use-theme-color';
import { Spacing, Typography, BorderRadius, AppColors } from '@/src/utils/theme';
import { CatalogueDetail, CATALOGUE_THEMES } from '@/src/types/catalogue';

interface CatalogueHeaderProps {
  catalogue: CatalogueDetail;
  onBack: () => void;
}

/**
 * Header component for catalogue detail screen
 */
export default function CatalogueHeader({ catalogue, onBack }: CatalogueHeaderProps) {
  const { colors } = useTheme();
  const themeInfo = CATALOGUE_THEMES[catalogue.theme] || CATALOGUE_THEMES.general;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <ThemedText style={styles.backIcon}>←</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.backText}>Back to Explore</ThemedText>
      </View>

      {/* Catalogue Info */}
      <View style={styles.content}>
        {/* Theme Badge */}
        <View style={[styles.themeBadge, { backgroundColor: themeInfo.color }]}>
          <ThemedText style={styles.themeIcon}>{themeInfo.icon}</ThemedText>
          <ThemedText style={styles.themeText}>{themeInfo.name}</ThemedText>
        </View>

        {/* Title and Level */}
        <View style={styles.titleRow}>
          <ThemedText type="title" style={styles.title}>
            {catalogue.name}
          </ThemedText>
          <View style={[styles.levelBadge, { backgroundColor: themeInfo.color + '20' }]}>
            <ThemedText style={[styles.levelText, { color: themeInfo.color }]}>
              {catalogue.cefr_level}
            </ThemedText>
          </View>
        </View>

        {/* Description */}
        <ThemedText style={styles.description}>
          {catalogue.description}
        </ThemedText>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <ThemedText style={styles.statValue}>
              {catalogue.totalWords}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Total Words</ThemedText>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.stat}>
            <ThemedText style={styles.statValue}>
              {catalogue.selectedCount}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Selected</ThemedText>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.stat}>
            <ThemedText style={[styles.statValue, { color: themeInfo.color }]}>
              {catalogue.totalWords > 0 ? Math.round((catalogue.selectedCount / catalogue.totalWords) * 100) : 0}%
            </ThemedText>
            <ThemedText style={styles.statLabel}>Progress</ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray200,
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.gray100,
    marginRight: Spacing.sm,
  },
  backIcon: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  backText: {
    fontSize: Typography.sizes.sm,
    opacity: 0.7,
  },
  content: {
    paddingHorizontal: Spacing.md,
  },
  themeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  themeIcon: {
    fontSize: Typography.sizes.sm,
    marginRight: Spacing.xs,
  },
  themeText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  title: {
    flex: 1,
    marginRight: Spacing.md,
  },
  levelBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  levelText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  description: {
    marginBottom: Spacing.lg,
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.base,
    opacity: 0.8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.xs / 2,
  },
  statLabel: {
    fontSize: Typography.sizes.xs,
    opacity: 0.6,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: AppColors.gray200,
    marginHorizontal: Spacing.sm,
  },
});