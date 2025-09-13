import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { COLORS, LanguageUtils, ERROR_MESSAGES } from '@/src/utils/constants';
import { SupportedLanguage } from '@/src/types/language';
import { LanguageFlag } from '@/src/components/ui/LanguageFlag';
import { LanguageGrid } from '@/src/components/ui/LanguageGrid';
import { OnboardingProgress } from './OnboardingProgress';

interface StudyLanguageSelectionProps {
  nativeLanguage: SupportedLanguage;
  selectedLanguage: SupportedLanguage | null;
  onLanguageSelect: (language: SupportedLanguage) => void;
  onBack: () => void;
  onContinue: () => void;
  canContinue: boolean;
  isLoading?: boolean;
}

export function StudyLanguageSelection({
  nativeLanguage,
  selectedLanguage,
  onLanguageSelect,
  onBack,
  onContinue,
  canContinue,
  isLoading = false,
}: StudyLanguageSelectionProps) {
  const handleLanguageSelect = (language: SupportedLanguage) => {
    if (language.id === nativeLanguage.id) {
      Alert.alert(
        'Invalid Selection',
        ERROR_MESSAGES.SAME_LANGUAGE_ERROR,
        [{ text: 'OK' }]
      );
      return;
    }
    onLanguageSelect(language);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress */}
      <OnboardingProgress 
        currentStep={2} 
        totalSteps={2}
        stepTitles={['Native Language', 'Study Language']}
        showStepNames
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Which language do you want to learn?</Text>
          <Text style={styles.subtitle}>
            Choose the language you'd like to practice and master
          </Text>
        </View>

        {/* Native Language Display */}
        <View style={styles.nativeLanguageContainer}>
          <Text style={styles.nativeLanguageLabel}>Your native language:</Text>
          <View style={styles.nativeLanguageDisplay}>
            <LanguageFlag language={nativeLanguage} size="medium" />
            <Text style={styles.nativeLanguageName}>{nativeLanguage.name}</Text>
          </View>
        </View>

        {/* Language Grid */}
        <LanguageGrid
          selectedLanguage={selectedLanguage}
          excludeLanguageId={nativeLanguage.id}
          onLanguageSelect={handleLanguageSelect}
          showSearch={true}
          showPopularFirst={true}
          gridColumns={3}
          style={styles.languageGrid}
        />

        {/* Helpful Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Pro Tips</Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>
              • Start with a language similar to your native language for faster progress
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>
              • Consider your learning goals (travel, business, culture)
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>
              • You can always change your study language later in settings
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      {canContinue && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              isLoading && styles.continueButtonDisabled,
            ]}
            onPress={onContinue}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>
              {isLoading ? 'Setting up...' : 'Complete Setup'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.DARK,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  nativeLanguageContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  nativeLanguageLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  nativeLanguageDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nativeLanguageName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.DARK,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.DARK,
  },
  languageGrid: {
    marginBottom: 32,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },
  languageOptionSelected: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: '#f0f8ff',
  },
  languageInfo: {
    flex: 1,
    marginLeft: 16,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.DARK,
  },
  languageNameSelected: {
    color: COLORS.PRIMARY,
  },
  languageNative: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  languageRegion: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tipsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: 12,
  },
  tipItem: {
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  continueButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});