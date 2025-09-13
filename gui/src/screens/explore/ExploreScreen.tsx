import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ThemedView,
  ThemedText,
  StatisticBox,
  ErrorMessage,
} from '@/src/components/ui';
import {
  ExploreHeader,
  LevelAccordion,
  ExploreLoadingState,
  CatalogueSearchBar,
  CategoryFilters,
} from '@/src/components/explore';
import { useTheme, useLanguageColors } from '@/src/utils/use-theme-color';
import { Spacing, Typography, AppColors, BorderRadius } from '@/src/utils/theme';
import { useAuth, useExploreStore, useExploreData, useExploreUI, useExploreActions } from '@/src/stores';
import { ExploreCatalogue, CatalogueTheme } from '@/src/types/catalogue';

/**
 * Explore screen for browsing language learning catalogues and content
 */
export default function ExploreScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const languageColors = useLanguageColors(user?.study_language_id || undefined);
  
  // Store hooks
  const { cataloguesByLevel, recommendations } = useExploreData();
  const { expandedLevels, isLoading, error } = useExploreUI();
  const {
    loadCatalogues,
    loadRecommendations,
    toggleLevelExpansion,
    searchCatalogues,
    selectCatalogue,
    clearError,
  } = useExploreActions();

  // State for filters
  const [selectedTheme, setSelectedTheme] = React.useState<CatalogueTheme | undefined>();

  // Load data on mount
  useEffect(() => {
    const initializeExplore = async () => {
      try {
        await loadCatalogues();
        await loadRecommendations();
      } catch (error) {
        console.error('Failed to initialize explore screen:', error);
      }
    };

    initializeExplore();
  }, [loadCatalogues, loadRecommendations]);

  // Handle catalogue selection
  const handleCataloguePress = (catalogue: ExploreCatalogue) => {
    selectCatalogue(catalogue);
    // For now, just log the selection - navigation will be implemented in next phase
    console.log('Selected catalogue:', catalogue.name);
  };

  // Handle search
  const handleSearch = (query: string) => {
    searchCatalogues(query);
  };

  // Handle theme filter
  const handleThemeFilter = (theme?: CatalogueTheme) => {
    setSelectedTheme(theme);
    loadCatalogues({ theme });
  };

  // Calculate total statistics
  const totalCatalogues = Object.values(cataloguesByLevel).flat().length;
  const totalWords = Object.values(cataloguesByLevel)
    .flat()
    .reduce((sum, cat) => sum + (cat.wordCount || cat.total_terms || 0), 0);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ExploreLoadingState />
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
        <ExploreHeader />

        {/* Error Display */}
        {error && (
          <View style={styles.section}>
            <ErrorMessage message={error} />
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                clearError();
                loadCatalogues();
              }}
            >
              <ThemedText style={styles.retryText}>Retry</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.section}>
          <View style={styles.statsGrid}>
            <StatisticBox
              title="Available"
              value={totalCatalogues}
              subtitle="Catalogues"
              color={languageColors.primary}
            />
            <StatisticBox
              title="Total Words"
              value={totalWords}
              subtitle="To learn"
              color={AppColors.info}
            />
          </View>
        </View>

        {/* Search Bar */}
        <CatalogueSearchBar onSearch={handleSearch} />

        {/* Category Filters */}
        <CategoryFilters
          selectedTheme={selectedTheme}
          onSelectTheme={handleThemeFilter}
        />

        {/* CEFR Level Accordion */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Learning Levels
          </ThemedText>
          <LevelAccordion
            cataloguesByLevel={cataloguesByLevel}
            expandedLevels={expandedLevels}
            onToggleLevel={toggleLevelExpansion}
            onCataloguePress={handleCataloguePress}
          />
        </View>

        {/* Recommended Section */}
        {recommendations.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Recommended for You
            </ThemedText>
            {recommendations.slice(0, 3).map((rec, index) => (
              <TouchableOpacity
                key={rec.catalogue.id}
                style={[
                  styles.recommendedCard,
                  index > 0 && { marginTop: Spacing.md }
                ]}
                onPress={() => handleCataloguePress(rec.catalogue)}
              >
                <ThemedText type="subtitle" style={styles.recommendedTitle}>
                  {rec.catalogue.name}
                </ThemedText>
                <ThemedText style={styles.recommendedText}>
                  {rec.reason} • Estimated {rec.estimatedTime} minutes
                </ThemedText>
                <View style={styles.recommendedFooter}>
                  <ThemedText style={styles.catalogueLevel}>
                    {rec.catalogue.cefr_level} Level
                  </ThemedText>
                  <ThemedText style={styles.startText}>
                    Tap to start →
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  retryButton: {
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: AppColors.primary,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: Typography.weights.medium,
  },
  recommendedCard: {
    padding: Spacing.md,
    backgroundColor: AppColors.gray50,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: AppColors.primary,
  },
  recommendedTitle: {
    marginBottom: Spacing.xs,
  },
  recommendedText: {
    marginBottom: Spacing.md,
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.base,
    opacity: 0.8,
  },
  recommendedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catalogueLevel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: AppColors.primary,
  },
  startText: {
    fontSize: Typography.sizes.sm,
    opacity: 0.7,
  },
});