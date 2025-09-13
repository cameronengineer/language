import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import { COLORS, LanguageUtils } from '@/src/utils/constants';
import { SupportedLanguage, LanguageFilter } from '@/src/types/language';
import { LanguageFlag } from './LanguageFlag';

interface LanguageGridProps {
  languages?: SupportedLanguage[];
  selectedLanguage?: SupportedLanguage | null;
  excludeLanguageId?: string;
  onLanguageSelect: (language: SupportedLanguage) => void;
  showSearch?: boolean;
  showPopularFirst?: boolean;
  gridColumns?: 2 | 3 | 4;
  itemAspectRatio?: number;
  style?: any;
  disabled?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export function LanguageGrid({
  languages,
  selectedLanguage,
  excludeLanguageId,
  onLanguageSelect,
  showSearch = true,
  showPopularFirst = true,
  gridColumns = 3,
  itemAspectRatio = 1,
  style,
  disabled = false,
}: LanguageGridProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const filteredLanguages = React.useMemo(() => {
    let availableLanguages = languages || [];
    
    // If no languages provided, use all supported languages
    if (!languages) {
      availableLanguages = excludeLanguageId 
        ? LanguageUtils.getAvailableStudyLanguages(excludeLanguageId)
        : LanguageUtils.getPopularLanguages();
    }

    // Apply search filter
    if (searchQuery.trim()) {
      return LanguageUtils.filterLanguages(searchQuery, excludeLanguageId);
    }

    // Show popular languages first if enabled
    if (showPopularFirst) {
      return LanguageUtils.getPopularLanguages(excludeLanguageId);
    }

    return availableLanguages;
  }, [languages, searchQuery, excludeLanguageId, showPopularFirst]);

  const calculateItemWidth = () => {
    const padding = 20; // Container padding
    const gap = 12; // Gap between items
    const totalGap = (gridColumns - 1) * gap;
    const availableWidth = screenWidth - (padding * 2) - totalGap;
    return availableWidth / gridColumns;
  };

  const itemWidth = calculateItemWidth();

  const renderLanguageItem = (language: SupportedLanguage) => {
    const isSelected = selectedLanguage?.id === language.id;
    const isDisabled = disabled || language.id === excludeLanguageId;

    return (
      <TouchableOpacity
        key={language.id}
        style={[
          styles.languageItem,
          {
            width: itemWidth,
            height: itemWidth * itemAspectRatio,
          },
          isSelected && styles.languageItemSelected,
          isDisabled && styles.languageItemDisabled,
        ]}
        onPress={() => {
          if (!isDisabled) {
            onLanguageSelect(language);
          }
        }}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        <View style={styles.flagContainer}>
          <Text style={styles.flagEmoji}>{language.flag_emoji}</Text>
        </View>
        
        <Text style={[
          styles.languageName,
          isSelected && styles.languageNameSelected,
          isDisabled && styles.languageNameDisabled,
        ]} numberOfLines={1}>
          {language.name}
        </Text>
        
        <Text style={[
          styles.languageNative,
          isSelected && styles.languageNativeSelected,
          isDisabled && styles.languageNativeDisabled,
        ]} numberOfLines={1}>
          {language.native_name}
        </Text>

        {isSelected && (
          <View style={styles.selectionIndicator}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderGrid = () => {
    const rows = [];
    for (let i = 0; i < filteredLanguages.length; i += gridColumns) {
      const rowItems = filteredLanguages.slice(i, i + gridColumns);
      rows.push(
        <View key={i} style={styles.gridRow}>
          {rowItems.map(renderLanguageItem)}
          {/* Fill empty spaces in the last row */}
          {rowItems.length < gridColumns && (
            Array.from({ length: gridColumns - rowItems.length }, (_, index) => (
              <View
                key={`empty-${index}`}
                style={[
                  styles.emptyItem,
                  { width: itemWidth, height: itemWidth * itemAspectRatio }
                ]}
              />
            ))
          )}
        </View>
      );
    }
    return rows;
  };

  return (
    <View style={[styles.container, style]}>
      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search languages..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999999"
              editable={!disabled}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setSearchQuery('')}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Results Info */}
      {searchQuery.trim() && (
        <View style={styles.resultsInfo}>
          <Text style={styles.resultsText}>
            {filteredLanguages.length === 0 
              ? 'No languages found' 
              : `${filteredLanguages.length} language${filteredLanguages.length !== 1 ? 's' : ''} found`
            }
          </Text>
        </View>
      )}

      {/* Language Grid */}
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredLanguages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🌍</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery.trim() 
                ? 'No languages match your search'
                : 'No languages available'
              }
            </Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {renderGrid()}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
    color: '#666666',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#999999',
  },
  resultsInfo: {
    marginBottom: 12,
  },
  resultsText: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  gridContainer: {
    width: '100%',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  languageItem: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    position: 'relative',
  },
  languageItemSelected: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: '#f0f8ff',
  },
  languageItemDisabled: {
    opacity: 0.5,
    backgroundColor: '#f5f5f5',
  },
  emptyItem: {
    // Invisible placeholder for grid alignment
  },
  flagContainer: {
    marginBottom: 8,
  },
  flagEmoji: {
    fontSize: 28,
    textAlign: 'center',
  },
  languageName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.DARK,
    textAlign: 'center',
    marginBottom: 2,
  },
  languageNameSelected: {
    color: COLORS.PRIMARY,
  },
  languageNameDisabled: {
    color: '#999999',
  },
  languageNative: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'center',
  },
  languageNativeSelected: {
    color: COLORS.PRIMARY,
  },
  languageNativeDisabled: {
    color: '#999999',
  },
  selectionIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
});