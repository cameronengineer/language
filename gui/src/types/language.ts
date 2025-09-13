// Language & Translation Types
export interface Language {
  id: string;
  name: string;
  code: string;
  flag_emoji: string;
  is_active: boolean;
}

export interface Translation {
  id: string;
  native_term: Term;
  study_term: Term;
  catalogue_id: string;
  user_id: string;
  is_known: boolean;
}

export interface Term {
  id: string;
  phrase: string;
  language_id: string;
  type_id: string;
  audio_hash: string; // SHA-512 for MP3 file
  image_hash: string; // SHA-512 for image file
}

export interface Catalogue {
  id: string;
  name: string;
  description: string;
  language_id: string;
  cefr_level: CEFRLevel;
  total_terms: number;
  user_progress?: number; // Percentage completed
}

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export interface LanguageSelectionState {
  native_language: Language | null;
  study_language: Language | null;
  available_languages: Language[];
  is_loading: boolean;
  error: string | null;
}

// Supported languages with their metadata
export interface SupportedLanguage {
  id: string;
  name: string;
  native_name: string;
  code: string;
  flag_emoji: string;
  locale: string;
  region?: string;
  rtl?: boolean; // Right-to-left language
}

// Enhanced language selection state
export interface LanguagePreferences {
  native_language: SupportedLanguage | null;
  study_language: SupportedLanguage | null;
  onboarding_completed: boolean;
  last_updated: string;
}

// Onboarding flow state
export interface OnboardingState {
  current_step: 'welcome' | 'native' | 'study' | 'complete';
  selected_native: SupportedLanguage | null;
  selected_study: SupportedLanguage | null;
  is_loading: boolean;
  error: string | null;
  can_skip: boolean;
}

// Language search and filter
export interface LanguageFilter {
  search_query: string;
  exclude_language_id?: string;
  only_popular?: boolean;
}