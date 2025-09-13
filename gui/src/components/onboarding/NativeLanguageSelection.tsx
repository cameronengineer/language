import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
} from 'react-native';
import { COLORS, LanguageUtils } from '@/src/utils/constants';
import { SupportedLanguage } from '@/src/types/language';
import { LanguageFlag } from '@/src/components/ui/LanguageFlag';
import { LanguageGrid } from '@/src/components/ui/LanguageGrid';
import { OnboardingProgress } from './OnboardingProgress';

interface NativeLanguageSelectionProps {
  selectedLanguage: SupportedLanguage | null;
  onLanguageSelect: (language: SupportedLanguage) => void;
  onBack: () => void;
  onContinue: () => void;
  canContinue: boolean;
  autoDetectedLanguage?: SupportedLanguage | null;
}

export function NativeLanguageSelection({
  selectedLanguage,
  onLanguageSelect,
  onBack,
  onContinue,
  canContinue,
  autoDetectedLanguage,
}: NativeLanguageSelectionProps) {

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress */}
      <OnboardingProgress 
        currentStep={1} 
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
          <Text style={styles.title}>What's your native language?</Text>
          <Text style={styles.subtitle}>
            This helps us provide better translations and explanations
          </Text>
        </View>

        {/* Auto-detected notice */}
        {autoDetectedLanguage && (
          <View style={styles.autoDetectedNotice}>
            <Text style={styles.autoDetectedText}>
              We detected your device language: {autoDetectedLanguage.name}
            </Text>
          </View>
        )}

        {/* Language Grid */}
        <LanguageGrid
          selectedLanguage={selectedLanguage}
          onLanguageSelect={onLanguageSelect}
          showSearch={true}
          showPopularFirst={true}
          gridColumns={3}
          style={styles.languageGrid}
        />
      </ScrollView>

      {/* Continue Button */}
      {canContinue && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={onContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
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
  autoDetectedNotice: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.PRIMARY,
  },
  autoDetectedText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: '500',
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
  languageGrid: {
    paddingBottom: 32,
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
  autoDetectedLabel: {
    fontSize: 12,
    color: COLORS.PRIMARY,
    fontWeight: '500',
    marginTop: 4,
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
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});