import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { ThemedText, ThemedView } from '@/src/components/ui';
import { useTheme } from '@/src/utils/use-theme-color';
import { Spacing, Typography, BorderRadius, AppColors } from '@/src/utils/theme';

interface CatalogueSearchBarProps {
  onSearch: (query: string) => void;
  onClear?: () => void;
  placeholder?: string;
}

/**
 * Search bar component for filtering catalogues
 */
export default function CatalogueSearchBar({ 
  onSearch, 
  onClear,
  placeholder = "Search catalogues..." 
}: CatalogueSearchBarProps) {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    onSearch(text);
  };

  const handleClear = () => {
    setSearchQuery('');
    onSearch('');
    onClear?.();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={[styles.searchContainer, { borderColor: colors.border }]}>
        <ThemedText style={styles.searchIcon}>🔍</ThemedText>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder={placeholder}
          placeholderTextColor={colors.text + '60'}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={handleClear}
          >
            <ThemedText style={styles.clearIcon}>✕</ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  searchIcon: {
    fontSize: Typography.sizes.base,
    marginRight: Spacing.sm,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontSize: Typography.sizes.base,
    paddingVertical: 0, // Remove default padding on some platforms
  },
  clearButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  clearIcon: {
    fontSize: Typography.sizes.sm,
    opacity: 0.6,
  },
});