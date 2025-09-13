import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CEFRLevel } from '@/src/types/language';
import { ExploreCatalogue, CataloguesByLevel } from '@/src/types/catalogue';
import { Spacing } from '@/src/utils/theme';
import LevelSection from './LevelSection';

interface LevelAccordionProps {
  cataloguesByLevel: CataloguesByLevel;
  expandedLevels: Set<CEFRLevel>;
  onToggleLevel: (level: CEFRLevel) => void;
  onCataloguePress: (catalogue: ExploreCatalogue) => void;
}

/**
 * Accordion component managing all CEFR level sections
 */
export default function LevelAccordion({ 
  cataloguesByLevel, 
  expandedLevels, 
  onToggleLevel, 
  onCataloguePress 
}: LevelAccordionProps) {
  const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

  return (
    <View style={styles.container}>
      {levels.map((level) => (
        <LevelSection
          key={level}
          level={level}
          catalogues={cataloguesByLevel[level] || []}
          isExpanded={expandedLevels.has(level)}
          onToggle={() => onToggleLevel(level)}
          onCataloguePress={onCataloguePress}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
  },
});