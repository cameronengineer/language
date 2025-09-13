import React from 'react';
import { View, StyleSheet } from 'react-native';
import { 
  Modal, 
  ThemedView, 
  ThemedText, 
  PracticeButton,
  LanguageFlag,
  LoadingSpinner 
} from '@/src/components/ui';
import { useTheme } from '@/src/utils/use-theme-color';
import { Spacing, Typography, BorderRadius, AppColors } from '@/src/utils/theme';
import { IconSymbol } from '@/src/components/ui/ui/icon-symbol';
import { LanguageChangeRequest } from '@/src/types/profile';

interface LanguageChangeConfirmationModalProps {
  visible: boolean;
  request: LanguageChangeRequest | null;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmation modal for language changes with impact warnings
 */
export function LanguageChangeConfirmationModal({
  visible,
  request,
  isLoading = false,
  onConfirm,
  onCancel,
}: LanguageChangeConfirmationModalProps) {
  const { colors } = useTheme();

  if (!request) return null;

  const getTitle = () => {
    const languageType = request.type === 'native' ? 'Native' : 'Study';
    return `Change ${languageType} Language`;
  };

  const getImpactWarnings = () => {
    const warnings: string[] = [];
    
    if (request.type === 'study') {
      warnings.push('Your current learning progress may be affected');
      warnings.push('Vocabulary words may need to be re-synchronized');
      warnings.push('Learning statistics will continue from this point');
    } else {
      warnings.push('Translation accuracy may be affected');
      warnings.push('Interface language preferences may change');
    }

    return warnings;
  };

  return (
    <Modal
      visible={visible}
      onClose={onCancel}
      title={getTitle()}
      size="medium"
      closeOnBackdrop={false}
    >
      <View style={styles.content}>
        {/* Change summary */}
        <View style={[styles.changesSummary, { backgroundColor: colors.surface }]}>
          <View style={styles.changeRow}>
            <ThemedText style={styles.changeLabel}>From:</ThemedText>
            <View style={styles.languageInfo}>
              {request.currentLanguage ? (
                <>
                  <LanguageFlag 
                    languageId={request.currentLanguage.id} 
                    size="small" 
                  />
                  <ThemedText style={styles.languageName}>
                    {request.currentLanguage.name}
                  </ThemedText>
                </>
              ) : (
                <ThemedText style={[styles.noLanguage, { color: colors.textMuted }]}>
                  Not set
                </ThemedText>
              )}
            </View>
          </View>

          <View style={styles.arrowContainer}>
            <IconSymbol 
              name="chevron.right" 
              size={20} 
              color={colors.tint} 
            />
          </View>

          <View style={styles.changeRow}>
            <ThemedText style={styles.changeLabel}>To:</ThemedText>
            <View style={styles.languageInfo}>
              <LanguageFlag 
                languageId={request.newLanguage.id} 
                size="small" 
              />
              <ThemedText style={styles.languageName}>
                {request.newLanguage.name}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Impact warnings */}
        <View style={[styles.warningsSection, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={styles.warningsHeader}>
            <IconSymbol 
              name="exclamationmark.triangle.fill" 
              size={20} 
              color={AppColors.warning} 
              style={styles.warningIcon}
            />
            <ThemedText style={[styles.warningsTitle, { color: AppColors.warning }]}>
              Important Changes
            </ThemedText>
          </View>

          <View style={styles.warningsList}>
            {getImpactWarnings().map((warning, index) => (
              <View key={index} style={styles.warningItem}>
                <View style={[styles.warningBullet, { backgroundColor: AppColors.warning }]} />
                <ThemedText style={[styles.warningText, { color: colors.textSecondary }]}>
                  {warning}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <PracticeButton
            title="Cancel"
            variant="outline"
            onPress={onCancel}
            disabled={isLoading}
            style={styles.actionButton}
          />
          
          <PracticeButton
            title={isLoading ? "Changing..." : "Confirm Change"}
            variant="primary"
            onPress={onConfirm}
            disabled={isLoading}
            style={styles.actionButton}
          />
        </View>

        {/* Loading overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <LoadingSpinner message="Updating language..." overlay />
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    position: 'relative',
  },
  changesSummary: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  changeRow: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  changeLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.sm,
    alignSelf: 'flex-start',
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  languageName: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.medium,
  },
  noLanguage: {
    fontSize: Typography.sizes.base,
    fontStyle: 'italic',
  },
  arrowContainer: {
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  warningsSection: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  warningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  warningIcon: {
    marginRight: Spacing.sm,
  },
  warningsTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
  },
  warningsList: {
    gap: Spacing.sm,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 8,
    marginRight: Spacing.sm,
  },
  warningText: {
    fontSize: Typography.sizes.sm,
    flex: 1,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});