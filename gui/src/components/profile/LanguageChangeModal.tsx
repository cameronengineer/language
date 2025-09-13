import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { 
  Modal, 
  ThemedView, 
  ThemedText, 
  PracticeButton,
  LanguageGrid,
  ErrorMessage 
} from '@/src/components/ui';
import { useTheme } from '@/src/utils/use-theme-color';
import { Spacing, Typography, BorderRadius, AppColors } from '@/src/utils/theme';
import { IconSymbol } from '@/src/components/ui/ui/icon-symbol';
import { LanguageChangeModalProps } from '@/src/types/profile';
import { SupportedLanguage } from '@/src/types/language';
import { LanguageUtils } from '@/src/utils/constants';

/**
 * Modal for changing native or study language with validation
 */
export function LanguageChangeModal({
  visible,
  type,
  currentLanguage,
  excludeLanguageId,
  onClose,
  onSelectLanguage,
  onConfirm,
}: LanguageChangeModalProps) {
  const { colors } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (visible) {
      setSelectedLanguage(null);
      setValidationError(null);
    }
  }, [visible]);

  const handleLanguageSelect = (language: SupportedLanguage) => {
    setValidationError(null);
    
    // Validate selection
    if (language.id === excludeLanguageId) {
      const otherType = type === 'native' ? 'study' : 'native';
      setValidationError(`${language.name} is already selected as your ${otherType} language`);
      return;
    }

    setSelectedLanguage(language);
    onSelectLanguage(language);
  };

  const handleConfirm = () => {
    if (!selectedLanguage) {
      setValidationError('Please select a language');
      return;
    }

    // Create language change request
    const request = {
      type,
      currentLanguage,
      newLanguage: selectedLanguage,
      requiresConfirmation: true,
    };

    onConfirm(request);
  };

  const getModalTitle = () => {
    return type === 'native' 
      ? 'Select Native Language' 
      : 'Select Study Language';
  };

  const getModalSubtitle = () => {
    return type === 'native'
      ? 'Choose your first language for better translations'
      : 'Choose the language you want to learn';
  };

  const getAvailableLanguages = () => {
    return LanguageUtils.getAvailableStudyLanguages(excludeLanguageId);
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={getModalTitle()}
      size="large"
      actions={[
        {
          text: 'Cancel',
          variant: 'outline',
          onPress: onClose,
        },
        {
          text: 'Continue',
          variant: 'primary',
          onPress: handleConfirm,
        },
      ]}
    >
      <View style={styles.content}>
        {/* Subtitle */}
        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
          {getModalSubtitle()}
        </ThemedText>

        {/* Current language info */}
        {currentLanguage && (
          <View style={[styles.currentLanguage, { backgroundColor: colors.backgroundSecondary }]}>
            <IconSymbol 
              name="info.circle.fill" 
              size={16} 
              color={colors.tint} 
              style={styles.infoIcon}
            />
            <ThemedText style={[styles.currentLanguageText, { color: colors.textSecondary }]}>
              Currently: {currentLanguage.name}
            </ThemedText>
          </View>
        )}

        {/* Validation error */}
        {validationError && (
          <ErrorMessage 
            message={validationError} 
            style={styles.errorMessage}
          />
        )}

        {/* Language selection */}
        <View style={styles.languageSelection}>
          <LanguageGrid
            languages={getAvailableLanguages()}
            selectedLanguage={selectedLanguage}
            excludeLanguageId={excludeLanguageId}
            onLanguageSelect={handleLanguageSelect}
            showSearch={true}
            showPopularFirst={true}
            gridColumns={3}
            style={styles.languageGrid}
          />
        </View>

        {/* Selection info */}
        {selectedLanguage && (
          <View style={[styles.selectionInfo, { backgroundColor: colors.surface }]}>
            <View style={styles.selectionHeader}>
              <IconSymbol 
                name="person.fill" 
                size={16} 
                color={colors.tint} 
                style={styles.selectionIcon}
              />
              <ThemedText style={styles.selectionTitle}>Selected Language</ThemedText>
            </View>
            
            <View style={styles.selectedLanguageInfo}>
              <ThemedText style={styles.selectedLanguageName}>
                {selectedLanguage.name}
              </ThemedText>
              <ThemedText style={[styles.selectedLanguageNative, { color: colors.textSecondary }]}>
                {selectedLanguage.native_name}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Warning for study language change */}
        {type === 'study' && currentLanguage && selectedLanguage && (
          <View style={[styles.warningBox, { backgroundColor: colors.backgroundSecondary }]}>
            <IconSymbol 
              name="exclamationmark.triangle.fill" 
              size={16} 
              color={AppColors.warning}
              style={styles.warningIcon}
            />
            <View style={styles.warningContent}>
              <ThemedText style={[styles.warningTitle, { color: AppColors.warning }]}>
                Important
              </ThemedText>
              <ThemedText style={[styles.warningText, { color: colors.textSecondary }]}>
                Changing your study language may affect your learning progress and vocabulary.
              </ThemedText>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  subtitle: {
    fontSize: Typography.sizes.base,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  currentLanguage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  infoIcon: {
    marginRight: Spacing.sm,
  },
  currentLanguageText: {
    fontSize: Typography.sizes.sm,
  },
  errorMessage: {
    marginBottom: Spacing.md,
  },
  languageSelection: {
    flex: 1,
    marginBottom: Spacing.md,
  },
  languageGrid: {
    flex: 1,
  },
  selectionInfo: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  selectionIcon: {
    marginRight: Spacing.sm,
  },
  selectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  selectedLanguageInfo: {
    marginLeft: Spacing.lg,
  },
  selectedLanguageName: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    marginBottom: 2,
  },
  selectedLanguageNative: {
    fontSize: Typography.sizes.base,
  },
  warningBox: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  warningIcon: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    marginBottom: 4,
  },
  warningText: {
    fontSize: Typography.sizes.sm,
    lineHeight: 20,
  },
});