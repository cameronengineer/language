import React from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { ThemedText, ThemedView } from '@/src/components/ui';
import { useTheme } from '@/src/utils/use-theme-color';
import { Spacing, Typography, BorderRadius, AppColors } from '@/src/utils/theme';
import { CEFRLevelConfig, ExploreCatalogue, CEFR_LEVELS } from '@/src/types/catalogue';
import { CEFRLevel } from '@/src/types/language';
import CatalogueGrid from './CatalogueGrid';

interface LevelSectionProps {
  level: CEFRLevel;
  catalogues: ExploreCatalogue[];
  isExpanded: boolean;
  onToggle: () => void;
  onCataloguePress: (catalogue: ExploreCatalogue) => void;
}

/**
 * Individual CEFR level section with catalogues
 */
export default function LevelSection({ 
  level, 
  catalogues, 
  isExpanded, 
  onToggle, 
  onCataloguePress 
}: LevelSectionProps) {
  const { colors } = useTheme();
  const levelConfig = CEFR_LEVELS[level];
  const animatedHeight = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded]);

  const headerBackgroundColor = {
    backgroundColor: isExpanded ? levelConfig.color + '20' : colors.surface,
  };

  const borderColor = {
    borderColor: isExpanded ? levelConfig.color : colors.border,
  };

  return (
    <ThemedView style={[styles.container, borderColor]}>
      {/* Level Header */}
      <TouchableOpacity
        style={[styles.header, headerBackgroundColor]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.levelBadge, { backgroundColor: levelConfig.color }]}>
            <ThemedText style={styles.levelText}>
              {level}
            </ThemedText>
          </View>
          <View style={styles.levelInfo}>
            <ThemedText type="subtitle" style={styles.levelName}>
              {levelConfig.name}
            </ThemedText>
            <ThemedText style={styles.levelDescription}>
              {levelConfig.description}
            </ThemedText>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          <ThemedText style={styles.wordCount}>
            {levelConfig.wordCount} words
          </ThemedText>
          <ThemedText style={styles.catalogueCount}>
            {catalogues.length} catalogues
          </ThemedText>
          <ThemedText style={[styles.expandIcon, { transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }]}>
            ▼
          </ThemedText>
        </View>
      </TouchableOpacity>

      {/* Expandable Content */}
      <Animated.View
        style={[
          styles.content,
          {
            maxHeight: animatedHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1000], // Max height for content
            }),
            opacity: animatedHeight,
          },
        ]}
      >
        {isExpanded && catalogues.length > 0 && (
          <CatalogueGrid 
            catalogues={catalogues}
            onCataloguePress={onCataloguePress}
          />
        )}
        
        {isExpanded && catalogues.length === 0 && (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>
              No catalogues available for this level
            </ThemedText>
          </View>
        )}
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  levelBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  levelText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  levelInfo: {
    flex: 1,
  },
  levelName: {
    marginBottom: Spacing.xs / 2,
  },
  levelDescription: {
    fontSize: Typography.sizes.sm,
    opacity: 0.7,
    lineHeight: Typography.lineHeights.tight * Typography.sizes.sm,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  wordCount: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.xs / 2,
  },
  catalogueCount: {
    fontSize: Typography.sizes.xs,
    opacity: 0.6,
    marginBottom: Spacing.sm,
  },
  expandIcon: {
    fontSize: Typography.sizes.sm,
    opacity: 0.6,
  },
  content: {
    overflow: 'hidden',
  },
  emptyState: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.sizes.sm,
    opacity: 0.6,
    textAlign: 'center',
  },
});