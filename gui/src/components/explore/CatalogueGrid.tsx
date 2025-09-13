import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { ExploreCatalogue } from '@/src/types/catalogue';
import { Spacing } from '@/src/utils/theme';
import CatalogueCard from './CatalogueCard';

interface CatalogueGridProps {
  catalogues: ExploreCatalogue[];
  onCataloguePress: (catalogue: ExploreCatalogue) => void;
  numColumns?: number;
}

/**
 * Grid layout for displaying catalogues in 3 columns
 */
export default function CatalogueGrid({ 
  catalogues, 
  onCataloguePress, 
  numColumns = 3 
}: CatalogueGridProps) {
  const renderCatalogueItem = ({ item }: { item: ExploreCatalogue }) => (
    <CatalogueCard 
      catalogue={item}
      onPress={() => onCataloguePress(item)}
      style={styles.gridItem}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={catalogues}
        renderItem={renderCatalogueItem}
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
    padding: Spacing.md,
  },
  grid: {
    paddingBottom: Spacing.sm,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  gridItem: {
    flex: 1,
    marginHorizontal: Spacing.xs / 2,
  },
});