// Practice & Study Session Types
export interface FlashcardSession {
  current_translation: Translation | null;
  session_start: Date;
  cards_reviewed: number;
  cards_known: number;
  cards_unknown: number;
  session_type: 'words' | 'sentences';
}

export interface StudySessionResult {
  session_id: string;
  user_id: string;
  catalogue_id: string;
  session_type: 'words' | 'sentences';
  cards_reviewed: number;
  cards_known: number;
  cards_unknown: number;
  duration_minutes: number;
  completed_at: string;
}

export interface PracticeStats {
  today_cards: number;
  today_minutes: number;
  streak_days: number;
  total_words_learned: number;
  accuracy_percentage: number;
}

export interface FlashcardState {
  isRevealed: boolean;
  userAnswer: 'known' | 'unknown' | null;
  isLoading: boolean;
}

export interface SessionConfig {
  catalogue_id: string;
  session_type: 'words' | 'sentences';
  cards_per_session: number;
  include_audio: boolean;
  shuffle_cards: boolean;
}

// Import Translation type
import type { Translation } from './language';