import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { 
  ThemedView, 
  ThemedText, 
  LanguageFlag,
  LoadingSpinner 
} from '@/src/components/ui';
import { useTheme } from '@/src/utils/use-theme-color';
import { Spacing, Typography, BorderRadius } from '@/src/utils/theme';
import { IconSymbol } from '@/src/components/ui/ui/icon-symbol';
import { LanguageSectionProps } from '@/src/types/profile';
import { LanguageUtils } from '@/src/utils/constants';

/**
 * Language section component for managing native and study languages
 */
export function LanguageSection({ 
  nativeLanguage, 
  studyLanguage, 
  onChangeNative, 
  onChangeStudy, 
  isLoading = false 
}: LanguageSectionProps) {
  const { colors } = useTheme();

  const LanguageCard = ({ 
    title, 
    subtitle, 
    language, 
    onPress, 
    icon 
  }: {
    title: string;
    subtitle: string;
    language: any;
    onPress: () => void;
    icon: string;
  }) => (
    <TouchableOpacity
      style={[styles.languageCard, { backgroundColor: colors.surface }]}
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      <View style={styles.languageCardHeader}>
        <View style={styles.languageCardTitle}>
          <IconSymbol 
            name={icon as any} 
            size={20} 
            color={colors.icon} 
            style={styles.cardIcon}
          />
          <View>
            <ThemedText style={styles.languageTitle}>{title}</ThemedText>
            <ThemedText style={[styles.languageSubtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </ThemedText>
          </View>
        </View>
        
        <IconSymbol 
          name="chevron.right" 
          size={16} 
          color={colors.iconSecondary} 
        />
      </View>

      <View style={styles.languageCardContent}>
        {language ? (
          <View style={styles.selectedLanguage}>
            <LanguageFlag 
              languageId={language.id} 
              size="medium" 
            />
            <View style={styles.languageInfo}>
              <ThemedText style={styles.languageName}>
                {language.name}
              </ThemedText>
              <ThemedText style={[styles.languageNative, { color: colors.textSecondary }]}>
                {language.native_name}
              </ThemedText>
            </View>
          </View>
        ) : (
          <View style={styles.noLanguage}>
            <View style={[styles.placeholderFlag, { backgroundColor: colors.backgroundSecondary }]}>
              <ThemedText style={[styles.placeholderText, { color: colors.textMuted }]}>
                ?
              </ThemedText>
            </View>
            <View style={styles.languageInfo}>
              <ThemedText style={[styles.noLanguageText, { color: colors.textMuted }]}>
                Not selected
              </ThemedText>
              <ThemedText style={[styles.tapToSelect, { color: colors.textSecondary }]}>
                Tap to select
              </ThemedText>
            </View>
          </View>
        )}
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner size="small" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Language Settings
        </ThemedText>
        <ThemedText style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          Manage your native and study languages
        </ThemedText>
      </View>

      <View style={styles.languageCards}>
        <LanguageCard
          title="Native Language"
          subtitle="Your first language"
          language={nativeLanguage}
          onPress={onChangeNative}
          icon="house.fill"
        />

        <LanguageCard
          title="Study Language"
          subtitle="Language you're learning"
          language={studyLanguage}
          onPress={onChangeStudy}
          icon="safari.fill"
        />
      </View>

      {/* Validation info */}
      <View style={[styles.infoBox, { backgroundColor: colors.backgroundSecondary }]}>
        <IconSymbol 
          name="info.circle.fill" 
          size={16} 
          color={colors.tint}
          style={styles.infoIcon}
        />
        <ThemedText style={[styles.infoText, { color: colors.textSecondary }]}>
          Your native and study languages must be different. Changing your study language may affect your learning progress.
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  sectionDescription: {
    fontSize: Typography.sizes.sm,
  },
  languageCards: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  languageCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    position: 'relative',
  },
  languageCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  languageCardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    marginRight: Spacing.sm,
  },
  languageTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
  },
  languageSubtitle: {
    fontSize: Typography.sizes.sm,
    marginTop: 2,
  },
  languageCardContent: {
    minHeight: 60,
  },
  selectedLanguage: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  languageName: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.medium,
    marginBottom: 2,
  },
  languageNative: {
    fontSize: Typography.sizes.sm,
  },
  noLanguage: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeholderFlag: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.medium,
  },
  noLanguageText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
  },
  tapToSelect: {
    fontSize: Typography.sizes.sm,
    marginTop: 2,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  infoIcon: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  infoText: {
    fontSize: Typography.sizes.sm,
    flex: 1,
    lineHeight: 20,
  },
});