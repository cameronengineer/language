import { CEFRLevel, Catalogue as BaseCatalogue, Translation as BaseTranslation } from './language';

/**
 * CEFR level configuration with descriptions and word counts
 */
export interface CEFRLevelConfig {
  level: CEFRLevel;
  name: string;
  description: string;
  wordCount: number;
  color: string;
}

/**
 * Catalogue theme categories for organization
 */
export type CatalogueTheme = 
  | 'food'
  | 'travel'
  | 'business'
  | 'medical'
  | 'culture'
  | 'education'
  | 'technology'
  | 'sports'
  | 'family'
  | 'home'
  | 'nature'
  | 'shopping'
  | 'transportation'
  | 'clothing'
  | 'emotions'
  | 'time'
  | 'colors'
  | 'numbers'
  | 'general';

/**
 * Extended catalogue interface for explore functionality
 */
export interface ExploreCatalogue extends BaseCatalogue {
  theme: CatalogueTheme;
  wordCount: number;
  imageHash: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  translations?: ExploreTranslation[];
}

/**
 * Extended translation interface for explore functionality
 */
export interface ExploreTranslation extends BaseTranslation {
  nativeWord: string;
  studyWord: string;
  nativeDefinition?: string;
  studyDefinition?: string;
  imageHash: string;
  audioHash: string;
  difficulty: number;
  frequency: number;
  partOfSpeech?: string;
  examples?: TranslationExample[];
  tags?: string[];
  isSelected?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Example usage of a translation
 */
export interface TranslationExample {
  id: string;
  translationId: string;
  nativeExample: string;
  studyExample: string;
  context?: string;
}

/**
 * Organized catalogue data by CEFR level
 */
export type CataloguesByLevel = Record<CEFRLevel, ExploreCatalogue[]>;

/**
 * Catalogue detail with all translations loaded
 */
export interface CatalogueDetail extends ExploreCatalogue {
  translations: ExploreTranslation[];
  selectedCount: number;
  totalWords: number;
}

/**
 * User's word selection state
 */
export interface WordSelection {
  selectedWords: Set<string>;
  selectionsByCategory: Map<string, Set<string>>;
  totalSelected: number;
  lastUpdated: string;
}

/**
 * Catalogue search and filter options
 */
export interface CatalogueFilters {
  level?: CEFRLevel;
  theme?: CatalogueTheme;
  search?: string;
  minWords?: number;
  maxWords?: number;
  hasUserWords?: boolean;
}

/**
 * Catalogue search results
 */
export interface CatalogueSearchResults {
  catalogues: ExploreCatalogue[];
  totalCount: number;
  filteredCount: number;
  appliedFilters: CatalogueFilters;
}

/**
 * CEFR level progress tracking
 */
export interface LevelProgress {
  level: CEFRLevel;
  totalWords: number;
  learnedWords: number;
  selectedWords: number;
  completedCatalogues: number;
  totalCatalogues: number;
  progressPercentage: number;
  isUnlocked: boolean;
}

/**
 * User's overall explore progress
 */
export interface ExploreProgress {
  levelProgress: Record<CEFRLevel, LevelProgress>;
  totalSelectedWords: number;
  totalAvailableWords: number;
  currentLevel: CEFRLevel;
  recommendedCatalogues: string[];
  lastExploreDate: string;
}

/**
 * Catalogue recommendation based on user progress
 */
export interface CatalogueRecommendation {
  catalogue: ExploreCatalogue;
  reason: string;
  priority: number;
  estimatedTime: number;
  prerequisites?: string[];
}

/**
 * Explore screen state management
 */
export interface ExploreState {
  // Data
  cataloguesByLevel: CataloguesByLevel;
  selectedCatalogue: CatalogueDetail | null;
  recommendations: CatalogueRecommendation[];
  
  // UI State
  expandedLevels: Set<CEFRLevel>;
  isLoading: boolean;
  isLoadingCatalogue: boolean;
  error: string | null;
  
  // Filters
  activeFilters: CatalogueFilters;
  searchResults: CatalogueSearchResults | null;
  
  // Selection
  wordSelection: WordSelection;
  
  // Progress
  userProgress: ExploreProgress | null;
}

/**
 * Catalogue store actions
 */
export interface ExploreActions {
  // Data fetching
  loadCatalogues: (filters?: CatalogueFilters) => Promise<void>;
  loadCatalogueDetail: (catalogueId: string) => Promise<void>;
  loadRecommendations: () => Promise<void>;
  
  // Level management
  toggleLevelExpansion: (level: CEFRLevel) => void;
  expandLevel: (level: CEFRLevel) => void;
  collapseLevel: (level: CEFRLevel) => void;
  collapseAllLevels: () => void;
  
  // Search and filtering
  setFilters: (filters: CatalogueFilters) => void;
  clearFilters: () => void;
  searchCatalogues: (query: string) => void;
  
  // Word selection
  toggleWordSelection: (translationId: string) => void;
  selectAllWords: (catalogueId: string) => void;
  clearWordSelection: (catalogueId?: string) => void;
  addWordsToStudy: (translationIds: string[]) => Promise<void>;
  removeWordsFromStudy: (translationIds: string[]) => Promise<void>;
  
  // Navigation
  selectCatalogue: (catalogue: ExploreCatalogue) => void;
  clearSelectedCatalogue: () => void;
  
  // State management
  clearError: () => void;
  reset: () => void;
}

/**
 * Constants for CEFR level configurations
 */
export const CEFR_LEVELS: Record<CEFRLevel, CEFRLevelConfig> = {
  A1: {
    level: 'A1',
    name: 'Beginner',
    description: 'Basic everyday expressions and simple phrases',
    wordCount: 500,
    color: '#4CAF50', // Green
  },
  A2: {
    level: 'A2',
    name: 'Elementary',
    description: 'Common expressions and routine information',
    wordCount: 500,
    color: '#8BC34A', // Light Green
  },
  B1: {
    level: 'B1',
    name: 'Intermediate',
    description: 'Familiar matters and areas of interest',
    wordCount: 1000,
    color: '#FF9800', // Orange
  },
  B2: {
    level: 'B2',
    name: 'Upper Intermediate',
    description: 'Complex texts and specialized topics',
    wordCount: 2000,
    color: '#FF5722', // Deep Orange
  },
  C1: {
    level: 'C1',
    name: 'Advanced',
    description: 'Wide range of demanding, longer texts',
    wordCount: 4000,
    color: '#9C27B0', // Purple
  },
};

/**
 * Default theme categories with display information
 */
export const CATALOGUE_THEMES: Record<CatalogueTheme, { name: string; icon: string; color: string }> = {
  food: { name: 'Food & Drink', icon: '🍽️', color: '#FF6B6B' },
  travel: { name: 'Travel', icon: '✈️', color: '#4ECDC4' },
  business: { name: 'Business', icon: '💼', color: '#45B7D1' },
  medical: { name: 'Medical', icon: '🏥', color: '#96CEB4' },
  culture: { name: 'Culture', icon: '🎭', color: '#FECA57' },
  education: { name: 'Education', icon: '📚', color: '#FF9FF3' },
  technology: { name: 'Technology', icon: '💻', color: '#54A0FF' },
  sports: { name: 'Sports', icon: '⚽', color: '#5F27CD' },
  family: { name: 'Family', icon: '👨‍👩‍👧‍👦', color: '#00D2D3' },
  home: { name: 'Home', icon: '🏠', color: '#FF6348' },
  nature: { name: 'Nature', icon: '🌳', color: '#2ED573' },
  shopping: { name: 'Shopping', icon: '🛍️', color: '#FFA502' },
  transportation: { name: 'Transportation', icon: '🚗', color: '#3742FA' },
  clothing: { name: 'Clothing', icon: '👕', color: '#2F3542' },
  emotions: { name: 'Emotions', icon: '😊', color: '#FF4757' },
  time: { name: 'Time', icon: '⏰', color: '#747D8C' },
  colors: { name: 'Colors', icon: '🎨', color: '#FF6B35' },
  numbers: { name: 'Numbers', icon: '🔢', color: '#2C2C54' },
  general: { name: 'General', icon: '📝', color: '#A4B0BE' },
};
