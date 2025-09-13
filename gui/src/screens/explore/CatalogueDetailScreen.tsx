import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ThemedView,
  ThemedText,
  LoadingSpinner,
  ErrorMessage,
} from '@/src/components/ui';
import {
  CatalogueHeader,
  SelectionControls,
  WordGrid,
  SelectionSummary,
} from '@/src/components/catalogue';
import { useTheme } from '@/src/utils/use-theme-color';
import { Spacing } from '@/src/utils/theme';
import { useExploreData, useExploreUI, useExploreActions, useWordSelection } from '@/src/stores';

/**
 * Catalogue detail screen showing all words with selection capabilities
 */
export default function CatalogueDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  // Store hooks
  const { selectedCatalogue } = useExploreData();
  const { isLoadingCatalogue, error } = useExploreUI();
  const { loadCatalogueDetail, clearSelectedCatalogue, clearError } = useExploreActions();
  const { wordSelection, toggleWordSelection, selectAllWords, clearWordSelection } = useWordSelection();

  // Load catalogue detail if not already loaded or if ID changed
  useEffect(() => {
    if (id && (!selectedCatalogue || selectedCatalogue.id !== id)) {
      loadCatalogueDetail(id);
    }
  }, [id, selectedCatalogue, loadCatalogueDetail]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't clear the selected catalogue on unmount to allow navigation back
    };
  }, []);

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  // Handle word selection
  const handleWordPress = (translationId: string) => {
    toggleWordSelection(translationId);
  };

  // Handle select all for this catalogue
  const handleSelectAll = () => {
    if (selectedCatalogue) {
      selectAllWords(selectedCatalogue.id);
    }
  };

  // Handle clear selection for this catalogue
  const handleClearSelection = () => {
    if (selectedCatalogue) {
      clearWordSelection(selectedCatalogue.id);
    }
  };

  // Calculate selection stats for this catalogue
  const catalogueSelectedWords = selectedCatalogue ? 
    wordSelection.selectionsByCategory.get(selectedCatalogue.id) || new Set() : 
    new Set();
  const selectedCount = catalogueSelectedWords.size;
  const totalWords = selectedCatalogue?.translations?.length || 0;

  // Loading state
  if (isLoadingCatalogue) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <ThemedText style={styles.loadingText}>
            Loading catalogue details...
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <ErrorMessage message={error} />
          <View style={styles.errorActions}>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {
                clearError();
                if (id) loadCatalogueDetail(id);
              }}
            >
              <ThemedText style={styles.retryText}>Retry</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBack}
            >
              <ThemedText style={styles.backText}>Go Back</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // No catalogue loaded
  if (!selectedCatalogue) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>
            Catalogue not found
          </ThemedText>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
          >
            <ThemedText style={styles.backText}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
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
        {/* Catalogue Header */}
        <CatalogueHeader 
          catalogue={selectedCatalogue}
          onBack={handleBack}
        />

        {/* Selection Controls */}
        <SelectionControls
          selectedCount={selectedCount}
          totalCount={totalWords}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
        />

        {/* Word Grid */}
        <WordGrid
          translations={selectedCatalogue.translations || []}
          selectedWords={catalogueSelectedWords}
          onWordPress={handleWordPress}
        />

        {/* Spacer for bottom panel */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Selection Summary - Fixed at bottom */}
      <SelectionSummary
        selectedCount={wordSelection.totalSelected}
        onViewSelected={() => console.log('View selected words')}
        onAddToStudy={() => console.log('Add to study')}
      />
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
    paddingBottom: 100, // Space for bottom panel
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    textAlign: 'center',
    opacity: 0.7,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  errorActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  retryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  backButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
  },
  backText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  errorText: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: Spacing.md,
  },
  bottomSpacer: {
    height: Spacing.xl,
  },
});