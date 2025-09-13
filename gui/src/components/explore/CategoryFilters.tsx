import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { PracticeButton } from '@/src/components/ui';
import { Spacing } from '@/src/utils/theme';
import { CatalogueTheme, CATALOGUE_THEMES } from '@/src/types/catalogue';

interface CategoryFiltersProps {
  selectedTheme?: CatalogueTheme;
  onSelectTheme: (theme?: CatalogueTheme) => void;
}

/**
 * Horizontal filter buttons for catalogue themes
 */
export default function CategoryFilters({ 
  selectedTheme, 
  onSelectTheme 
}: CategoryFiltersProps) {
  const themes: (CatalogueTheme | 'all')[] = [
    'all',
    'food',
    'travel',
    'business',
    'medical',
    'culture',
    'education',
    'technology',
    'sports',
    'family',
    'home',
    'nature',
  ];

  const renderThemeButton = (theme: CatalogueTheme | 'all') => {
    const isSelected = theme === 'all' ? !selectedTheme : selectedTheme === theme;
    const themeInfo = theme === 'all' 
      ? { name: 'All', icon: '📚', color: '#6B7280' }
      : CATALOGUE_THEMES[theme];

    return (
      <PracticeButton
        key={theme}
        title={`${themeInfo.icon} ${themeInfo.name}`}
        size="small"
        variant={isSelected ? 'primary' : 'outline'}
        onPress={() => onSelectTheme(theme === 'all' ? undefined : theme)}
        style={styles.filterButton}
      />
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {themes.map(renderThemeButton)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
  },
  filtersContainer: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  filterButton: {
    marginRight: Spacing.sm,
  },
});