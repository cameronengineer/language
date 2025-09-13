// User & Profile Types
export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  native_language_id: string | null;
  study_language_id: string | null;
  profile_picture_url: string | null;
  created_at: string;
  provider: string;
}

export interface UserProfile extends User {
  native_language?: Language;
  study_language?: Language;
  total_words: number;
  words_in_deep_memory: number;
  current_streak: number;
}

export interface UserProgress {
  total_words: number;
  words_in_deep_memory: number;
  current_streak: number;
  daily_progress: DailyProgress[];
}

export interface DailyProgress {
  date: string;
  words_learned: number;
  minutes_studied: number;
}

export interface UserSettings {
  audio_enabled: boolean;
  notifications_enabled: boolean;
  daily_goal: number;
  theme: 'light' | 'dark' | 'system';
}

// Import Language type (will be defined in language.ts)
import type { Language } from './language';