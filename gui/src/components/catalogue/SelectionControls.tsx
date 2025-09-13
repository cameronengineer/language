import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/src/components/ui';
import { useTheme } from '@/src/utils/use-theme-color';
import { Spacing, Typography, BorderRadius, AppColors } from '@/src/utils/theme';

interface SelectionControlsProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
}

/**
 * Controls for selecting/deselecting words in bulk
 */
export default function SelectionControls({ 
  selectedCount, 
  totalCount, 
  onSelectAll, 
  onClearSelection 
}: SelectionControlsProps) {
  const { colors } = useTheme();

  const isAllSelected = selectedCount === totalCount && totalCount > 0;
  const hasSelection = selectedCount > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Selection Status */}
      <View style={styles.statusContainer}>
        <ThemedText type="subtitle" style={styles.statusText}>
          {selectedCount} of {totalCount} words selected
        </ThemedText>
        {selectedCount > 0 && (
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: AppColors.primary,
                  width: `${(selectedCount / totalCount) * 100}%`
                }
              ]} 
            />
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.selectAllButton,
            isAllSelected && styles.buttonDisabled,
            { borderColor: AppColors.primary }
          ]}
          onPress={onSelectAll}
          disabled={isAllSelected}
          activeOpacity={0.7}
        >
          <ThemedText style={[
            styles.buttonText,
            { color: AppColors.primary },
            isAllSelected && styles.buttonTextDisabled
          ]}>
            Select All
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.clearButton,
            !hasSelection && styles.buttonDisabled,
            { backgroundColor: hasSelection ? AppColors.warning : AppColors.gray200 }
          ]}
          onPress={onClearSelection}
          disabled={!hasSelection}
          activeOpacity={0.7}
        >
          <ThemedText style={[
            styles.buttonText,
            styles.clearButtonText,
            !hasSelection && styles.buttonTextDisabled
          ]}>
            Clear Selection
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      {selectedCount > 0 && (
        <View style={styles.statsContainer}>
          <ThemedText style={styles.statsText}>
            {Math.round((selectedCount / totalCount) * 100)}% of catalogue selected
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray200,
  },
  statusContainer: {
    marginBottom: Spacing.md,
  },
  statusText: {
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectAllButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  clearButton: {
    borderWidth: 0,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  clearButtonText: {
    color: '#FFFFFF',
  },
  buttonTextDisabled: {
    opacity: 0.5,
  },
  statsContainer: {
    alignItems: 'center',
  },
  statsText: {
    fontSize: Typography.sizes.xs,
    opacity: 0.6,
  },
});