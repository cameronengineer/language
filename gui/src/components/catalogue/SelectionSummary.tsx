import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/src/components/ui';
import { useTheme } from '@/src/utils/use-theme-color';
import { Spacing, Typography, BorderRadius, AppColors } from '@/src/utils/theme';

interface SelectionSummaryProps {
  selectedCount: number;
  onViewSelected: () => void;
  onAddToStudy: () => void;
}

/**
 * Fixed bottom panel showing selection summary and actions
 */
export default function SelectionSummary({ 
  selectedCount, 
  onViewSelected, 
  onAddToStudy 
}: SelectionSummaryProps) {
  const { colors } = useTheme();

  if (selectedCount === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.surface,
      borderTopColor: colors.border,
    }]}>
      {/* Selection Info */}
      <View style={styles.infoContainer}>
        <ThemedText type="subtitle" style={styles.selectedCount}>
          {selectedCount} word{selectedCount !== 1 ? 's' : ''} selected
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Ready to add to your study collection
        </ThemedText>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.viewButton, { borderColor: AppColors.primary }]}
          onPress={onViewSelected}
          activeOpacity={0.7}
        >
          <ThemedText style={[styles.buttonText, { color: AppColors.primary }]}>
            View Selected
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.addButton, { backgroundColor: AppColors.primary }]}
          onPress={onAddToStudy}
          activeOpacity={0.7}
        >
          <ThemedText style={[styles.buttonText, styles.addButtonText]}>
            Add to Study
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoContainer: {
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  selectedCount: {
    marginBottom: Spacing.xs / 2,
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    opacity: 0.7,
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  addButton: {
    borderWidth: 0,
  },
  buttonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  addButtonText: {
    color: '#FFFFFF',
  },
});