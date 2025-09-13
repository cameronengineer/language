import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { SupportedLanguage } from '@/src/types/language';
import { SUPPORTED_LANGUAGES } from '@/src/utils/constants';
import { Spacing, BorderRadius } from '@/src/utils/theme';

interface LanguageFlagProps {
  languageId?: string;
  languageCode?: string;
  language?: SupportedLanguage;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  showName?: boolean;
}

const SIZES = {
  small: { flag: 20, text: 12, container: 24 },
  medium: { flag: 28, text: 14, container: 32 },
  large: { flag: 36, text: 16, container: 40 },
} as const;

/**
 * Component to display country flags for languages
 * Can accept language by ID, code, or full language object
 */
export function LanguageFlag({
  languageId,
  languageCode,
  language,
  size = 'medium',
  style,
  showName = false,
}: LanguageFlagProps) {
  // Determine the language to display
  const displayLanguage = React.useMemo(() => {
    if (language) return language;
    if (languageId) {
      return SUPPORTED_LANGUAGES.find(lang => lang.id === languageId);
    }
    if (languageCode) {
      return SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
    }
    return null;
  }, [language, languageId, languageCode]);

  if (!displayLanguage) {
    return (
      <View style={[styles.container, { height: SIZES[size].container }, style]}>
        <Text style={[styles.fallback, { fontSize: SIZES[size].text }]}>?</Text>
      </View>
    );
  }

  const sizes = SIZES[size];

  return (
    <View style={[styles.wrapper, style]}>
      <View style={[styles.container, { height: sizes.container, width: sizes.container }]}>
        <Text style={[styles.flag, { fontSize: sizes.flag }]}>
          {displayLanguage.flag_emoji}
        </Text>
      </View>
      {showName && (
        <Text style={[styles.name, { fontSize: sizes.text }]} numberOfLines={1}>
          {displayLanguage.name}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  container: {
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  flag: {
    textAlign: 'center',
    lineHeight: undefined, // Let the system handle line height for emoji
  },
  fallback: {
    textAlign: 'center',
    color: '#999',
    fontWeight: 'bold',
  },
  name: {
    marginTop: Spacing.xs,
    textAlign: 'center',
    fontWeight: '500',
    color: '#374151',
  },
});