import { SupportedLanguage, CEFRLevel } from '@/src/types/language';
import { SocialProvider } from '@/src/types/auth';
import * as Localization from 'expo-localization';

/**
 * Supported languages with metadata
 */
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  {
    id: 'en',
    name: 'English',
    native_name: 'English',
    code: 'en',
    flag_emoji: '🇺🇸',
    locale: 'en-US',
    region: 'United States',
  },
  {
    id: 'es',
    name: 'Spanish',
    native_name: 'Español',
    code: 'es',
    flag_emoji: '🇪🇸',
    locale: 'es-ES',
    region: 'Spain',
  },
  {
    id: 'de',
    name: 'German',
    native_name: 'Deutsch',
    code: 'de',
    flag_emoji: '🇩🇪',
    locale: 'de-DE',
    region: 'Germany',
  },
  {
    id: 'it',
    name: 'Italian',
    native_name: 'Italiano',
    code: 'it',
    flag_emoji: '🇮🇹',
    locale: 'it-IT',
    region: 'Italy',
  },
  {
    id: 'pt',
    name: 'Portuguese',
    native_name: 'Português',
    code: 'pt',
    flag_emoji: '🇵🇹',
    locale: 'pt-PT',
    region: 'Portugal',
  },
  {
    id: 'ru',
    name: 'Russian',
    native_name: 'Русский',
    code: 'ru',
    flag_emoji: '🇷🇺',
    locale: 'ru-RU',
    region: 'Russia',
  },
  {
    id: 'zh',
    name: 'Chinese',
    native_name: '中文',
    code: 'zh',
    flag_emoji: '🇨🇳',
    locale: 'zh-CN',
    region: 'China',
    rtl: false,
  },
  {
    id: 'ja',
    name: 'Japanese',
    native_name: '日本語',
    code: 'ja',
    flag_emoji: '🇯🇵',
    locale: 'ja-JP',
    region: 'Japan',
  },
  {
    id: 'ko',
    name: 'Korean',
    native_name: '한국어',
    code: 'ko',
    flag_emoji: '🇰🇷',
    locale: 'ko-KR',
    region: 'South Korea',
  },
];

/**
 * Popular languages for quick selection
 */
export const POPULAR_LANGUAGES = ['en', 'es', 'de', 'fr', 'zh', 'ja'];

/**
 * Language popularity scores for sorting
 */
export const LANGUAGE_POPULARITY: Record<string, number> = {
  en: 100,
  es: 95,
  zh: 90,
  de: 85,
  ja: 80,
  ru: 75,
  pt: 70,
  it: 65,
  ko: 60,
};

/**
 * CEFR (Common European Framework of Reference for Languages) levels
 */
export const CEFR_LEVELS: { level: CEFRLevel; name: string; description: string }[] = [
  {
    level: 'A1',
    name: 'Beginner',
    description: 'Basic expressions and everyday vocabulary',
  },
  {
    level: 'A2',
    name: 'Elementary',
    description: 'Simple conversations and routine tasks',
  },
  {
    level: 'B1',
    name: 'Intermediate',
    description: 'Clear communication on familiar topics',
  },
  {
    level: 'B2',
    name: 'Upper Intermediate',
    description: 'Complex texts and spontaneous communication',
  },
  {
    level: 'C1',
    name: 'Advanced',
    description: 'Flexible and effective language use',
  },
];

/**
 * Social authentication providers
 */
export const SOCIAL_PROVIDERS: SocialProvider[] = [
  {
    id: 'google',
    name: 'Google',
    color: '#DB4437',
    icon: 'logo-google',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    color: '#3B5998',
    icon: 'logo-facebook',
  },
  {
    id: 'twitter',
    name: 'Twitter',
    color: '#1DA1F2',
    icon: 'logo-twitter',
  },
  {
    id: 'apple',
    name: 'Apple',
    color: '#000000',
    icon: 'logo-apple',
  },
];

/**
 * App configuration constants
 */
export const APP_CONFIG = {
  NAME: 'Language Learning',
  VERSION: '1.0.0',
  CARDS_PER_SESSION: 20,
  SESSION_TIMEOUT_MINUTES: 30,
  MAX_DAILY_STREAK: 365,
  MIN_STUDY_MINUTES: 5,
} as const;

/**
 * API configuration constants
 */
export const API_CONFIG = {
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
  AUTH_TOKENS: 'auth_tokens',
  REFRESH_TOKEN: 'refresh_token',
  USER_PREFERENCES: 'user_preferences',
  LANGUAGE_SELECTION: 'language_selection',
  PRACTICE_SETTINGS: 'practice_settings',
} as const;

/**
 * Navigation routes
 */
export const ROUTES = {
  LOGIN: '/auth/login',
  LANGUAGE_SELECTION: '/auth/language-selection',
  DASHBOARD: '/dashboard',
  PRACTICE_WORDS: '/practice/words',
  PRACTICE_SENTENCES: '/practice/sentences',
  EXPLORE: '/explore',
  PROFILE: '/profile',
} as const;

/**
 * Theme colors
 */
export const COLORS = {
  PRIMARY: '#007AFF',
  SECONDARY: '#5856D6',
  SUCCESS: '#34C759',
  WARNING: '#FF9500',
  ERROR: '#FF3B30',
  INFO: '#5AC8FA',
  LIGHT: '#F2F2F7',
  DARK: '#1C1C1E',
} as const;

/**
 * Utility functions for language management
 */
export const LanguageUtils = {
  /**
   * Get language by code
   */
  getLanguageByCode: (code: string): SupportedLanguage | undefined => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
  },

  /**
   * Get language by ID
   */
  getLanguageById: (id: string): SupportedLanguage | undefined => {
    return SUPPORTED_LANGUAGES.find(lang => lang.id === id);
  },

  /**
   * Get device locale language with fallback logic
   */
  getDeviceLanguage: (): SupportedLanguage | undefined => {
    try {
      // Get device locales using expo-localization
      const deviceLocales = Localization.getLocales();
      const primaryLocale = deviceLocales[0]?.languageTag || 'en-US';
      
      // Try to find exact locale match first
      const exactMatch = SUPPORTED_LANGUAGES.find(lang =>
        lang.locale.toLowerCase() === primaryLocale.toLowerCase()
      );
      if (exactMatch) return exactMatch;

      // Fall back to language code matching
      const languageCode = primaryLocale.split('-')[0].toLowerCase();
      const codeMatch = SUPPORTED_LANGUAGES.find(lang =>
        lang.code.toLowerCase() === languageCode
      );
      if (codeMatch) return codeMatch;

      // Try other device locales if primary didn't match
      for (const localeInfo of deviceLocales.slice(1)) {
        const locale = localeInfo.languageTag;
        const exactMatch = SUPPORTED_LANGUAGES.find(lang =>
          lang.locale.toLowerCase() === locale.toLowerCase()
        );
        if (exactMatch) return exactMatch;

        const languageCode = locale.split('-')[0].toLowerCase();
        const codeMatch = SUPPORTED_LANGUAGES.find(lang =>
          lang.code.toLowerCase() === languageCode
        );
        if (codeMatch) return codeMatch;
      }

      return undefined;
    } catch (error) {
      console.warn('Failed to detect device language:', error);
      return undefined;
    }
  },

  /**
   * Get default native language (based on device locale)
   */
  getDefaultNativeLanguage: (): SupportedLanguage => {
    const deviceLanguage = LanguageUtils.getDeviceLanguage();
    return deviceLanguage || SUPPORTED_LANGUAGES[0]; // Default to English
  },

  /**
   * Get available study languages (excluding native language)
   */
  getAvailableStudyLanguages: (nativeLanguageId?: string): SupportedLanguage[] => {
    return SUPPORTED_LANGUAGES.filter(lang => lang.id !== nativeLanguageId);
  },

  /**
   * Get popular languages sorted by popularity
   */
  getPopularLanguages: (excludeId?: string): SupportedLanguage[] => {
    return SUPPORTED_LANGUAGES
      .filter(lang => lang.id !== excludeId)
      .sort((a, b) => (LANGUAGE_POPULARITY[b.id] || 0) - (LANGUAGE_POPULARITY[a.id] || 0));
  },

  /**
   * Filter languages by search query
   */
  filterLanguages: (query: string, excludeId?: string): SupportedLanguage[] => {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) return LanguageUtils.getAvailableStudyLanguages(excludeId);

    return SUPPORTED_LANGUAGES
      .filter(lang => {
        if (lang.id === excludeId) return false;
        
        return (
          lang.name.toLowerCase().includes(searchTerm) ||
          lang.native_name.toLowerCase().includes(searchTerm) ||
          lang.code.toLowerCase().includes(searchTerm) ||
          (lang.region && lang.region.toLowerCase().includes(searchTerm))
        );
      })
      .sort((a, b) => {
        // Prioritize exact name matches
        const aNameMatch = a.name.toLowerCase().startsWith(searchTerm);
        const bNameMatch = b.name.toLowerCase().startsWith(searchTerm);
        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;
        
        // Then sort by popularity
        return (LANGUAGE_POPULARITY[b.id] || 0) - (LANGUAGE_POPULARITY[a.id] || 0);
      });
  },

  /**
   * Validate language selection
   */
  validateLanguageSelection: (nativeId: string, studyId: string): boolean => {
    const nativeLang = LanguageUtils.getLanguageById(nativeId);
    const studyLang = LanguageUtils.getLanguageById(studyId);
    
    return !!(nativeLang && studyLang && nativeId !== studyId);
  },

  /**
   * Get language display name (with native name if different)
   */
  getDisplayName: (language: SupportedLanguage, showNative = true): string => {
    if (!showNative || language.name === language.native_name) {
      return language.name;
    }
    return `${language.name} (${language.native_name})`;
  },

  /**
   * Check if device supports RTL languages
   */
  isRTL: (languageId: string): boolean => {
    const language = LanguageUtils.getLanguageById(languageId);
    return language?.rtl || false;
  },

  /**
   * Get language flag with fallback
   */
  getLanguageFlag: (languageId: string): string => {
    const language = LanguageUtils.getLanguageById(languageId);
    return language?.flag_emoji || '🌐';
  },
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Please check your internet connection and try again.',
  AUTH_FAILED: 'Authentication failed. Please try again.',
  INVALID_CREDENTIALS: 'Invalid credentials. Please check your login information.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  SAME_LANGUAGE_ERROR: 'Native and study languages must be different.',
  LANGUAGE_LOAD_ERROR: 'Failed to load languages. Please try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
} as const;