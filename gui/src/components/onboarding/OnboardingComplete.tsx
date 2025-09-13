import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { COLORS } from '@/src/utils/constants';
import { SupportedLanguage } from '@/src/types/language';
import { LanguageFlag } from '@/src/components/ui/LanguageFlag';

interface OnboardingCompleteProps {
  nativeLanguage: SupportedLanguage;
  studyLanguage: SupportedLanguage;
  onContinue: () => void;
  isLoading?: boolean;
}

export function OnboardingComplete({
  nativeLanguage,
  studyLanguage,
  onContinue,
  isLoading = false,
}: OnboardingCompleteProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Text style={styles.successEmoji}>🎉</Text>
          </View>
          <Text style={styles.title}>Perfect! You're all set</Text>
          <Text style={styles.subtitle}>
            Your personalized learning journey is ready to begin
          </Text>
        </View>

        {/* Language Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Your Language Setup</Text>
          
          <View style={styles.languageRow}>
            <View style={styles.languageItem}>
              <Text style={styles.languageLabel}>Native Language</Text>
              <View style={styles.languageDisplay}>
                <LanguageFlag language={nativeLanguage} size="large" />
                <View style={styles.languageText}>
                  <Text style={styles.languageName}>{nativeLanguage.name}</Text>
                  <Text style={styles.languageNative}>{nativeLanguage.native_name}</Text>
                </View>
              </View>
            </View>

            <View style={styles.arrowContainer}>
              <Text style={styles.arrow}>→</Text>
            </View>

            <View style={styles.languageItem}>
              <Text style={styles.languageLabel}>Learning</Text>
              <View style={styles.languageDisplay}>
                <LanguageFlag language={studyLanguage} size="large" />
                <View style={styles.languageText}>
                  <Text style={styles.languageName}>{studyLanguage.name}</Text>
                  <Text style={styles.languageNative}>{studyLanguage.native_name}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Features Preview */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>What's Next?</Text>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📚</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Personalized Lessons</Text>
              <Text style={styles.featureDescription}>
                Tailored content based on your language pair
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🧠</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Smart Practice</Text>
              <Text style={styles.featureDescription}>
                AI-powered spaced repetition for optimal learning
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🎯</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Track Progress</Text>
              <Text style={styles.featureDescription}>
                Monitor your improvement with detailed statistics
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Continue Button */}
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
            {isLoading ? 'Preparing...' : 'Start Learning'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  successIcon: {
    marginBottom: 24,
  },
  successEmoji: {
    fontSize: 64,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.DARK,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  summaryContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.DARK,
    textAlign: 'center',
    marginBottom: 20,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  languageItem: {
    flex: 1,
    alignItems: 'center',
  },
  languageLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  languageDisplay: {
    alignItems: 'center',
  },
  languageText: {
    alignItems: 'center',
    marginTop: 8,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.DARK,
    textAlign: 'center',
  },
  languageNative: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 2,
  },
  arrowContainer: {
    marginHorizontal: 16,
  },
  arrow: {
    fontSize: 24,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  featuresContainer: {
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
    marginTop: 2,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
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