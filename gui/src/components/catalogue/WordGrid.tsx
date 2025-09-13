import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { ThemedText } from '@/src/components/ui';
import { Spacing } from '@/src/utils/theme';
import { ExploreTranslation } from '@/src/types/catalogue';
import WordCard from './WordCard';

interface WordGridProps {
  translations: ExploreTranslation[];
  selectedWords: Set<string>;
  onWordPress: (translationId: string) => void;
  numColumns?: number;
}

/**
 * Grid layout for displaying words in 4 columns
 */
export default function WordGrid({ 
  translations, 
  selectedWords, 
  onWordPress, 
  numColumns = 4 
}: WordGridProps) {
  const renderWordItem = ({ item }: { item: ExploreTranslation }) => (
    <View style={styles.gridItem}>
      <WordCard
        translation={item}
        isSelected={selectedWords.has(item.id)}
        onPress={() => onWordPress(item.id)}
      />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <ThemedText style={styles.emptyText}>
        No words available in this catalogue
      </ThemedText>
    </View>
  );

  if (translations.length === 0) {
    return renderEmptyState();
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={translations}
        renderItem={renderWordItem}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false} // Disable scroll as this is inside a parent ScrollView
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
  },
  grid: {
    paddingBottom: Spacing.md,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  gridItem: {
    flex: 1,
    marginHorizontal: Spacing.xs / 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.6,
  },
});