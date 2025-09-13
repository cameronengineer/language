// API Response & Error Types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  status?: number;
  retry?: () => void;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  per_page: number;
  total: number;
  pages: number;
}

export interface ApiRequestConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
}

export interface LoadingState {
  isLoading: boolean;
  error: ApiError | null;
  lastUpdated?: Date;
}

// API Endpoint Response Types
export interface LanguagesResponse {
  languages: Language[];
}

export interface CataloguesResponse {
  catalogues: Catalogue[];
}

export interface RandomTranslationResponse {
  translation: Translation;
}

export interface UserProgressResponse {
  progress: UserProgress;
}

export interface AuthMeResponse {
  user: User;
}

// Request payload types
export interface CreateUserRequest {
  native_language_id: string;
  study_language_id: string;
}

export interface UpdateUserLanguagesRequest {
  native_language_id?: string;
  study_language_id?: string;
}

export interface CreateStudySessionRequest {
  catalogue_id: string;
  session_type: 'words' | 'sentences';
  cards_reviewed: number;
  cards_known: number;
  cards_unknown: number;
  duration_minutes: number;
}

// Import types from other modules
import type { Language, Catalogue, Translation } from './language';
import type { User, UserProgress } from './user';