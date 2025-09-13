import { apiClient } from './client';
import { 
  ApiResponse, 
  LanguagesResponse, 
  CataloguesResponse, 
  RandomTranslationResponse,
  UserProgressResponse,
  AuthMeResponse,
  CreateUserRequest,
  UpdateUserLanguagesRequest,
  CreateStudySessionRequest,
} from '@/src/types/api';
import { SocialLoginResponse, AuthRequest } from '@/src/types/auth';
import { User } from '@/src/types/user';
import {
  ProgressEntry,
  SessionEntry,
  AnalyticsResponse,
  InsightsResponse,
  WordStrength,
  ReviewSchedule,
  Milestone,
  Achievement,
  ChartTimeRange,
  AnalyticsFilterOptions
} from '@/src/types/analytics';

/**
 * Authentication API endpoints
 */
export const authApi = {
  /**
   * Social login with provider token
   */
  socialLogin: (data: AuthRequest): Promise<ApiResponse<SocialLoginResponse>> => 
    apiClient.post('/auth/social-login', data),

  /**
   * Get current user profile
   */
  getMe: (): Promise<ApiResponse<User>> => 
    apiClient.get('/auth/me'),

  /**
   * Logout user
   */
  logout: (): Promise<ApiResponse<void>> => 
    apiClient.post('/auth/logout'),
};

/**
 * User API endpoints
 */
export const userApi = {
  /**
   * Create user with language preferences (for new users)
   */
  createUser: (data: CreateUserRequest): Promise<ApiResponse<User>> => 
    apiClient.post('/users/', data),

  /**
   * Update user language preferences
   */
  updateLanguages: (userId: string, data: UpdateUserLanguagesRequest): Promise<ApiResponse<User>> => 
    apiClient.patch(`/users/${userId}/languages`, data),

  /**
   * Get user progress statistics
   */
  getProgress: (userId: string): Promise<ApiResponse<UserProgressResponse>> => 
    apiClient.get(`/users/${userId}/progress`),

  /**
   * Get user's translation count
   */
  getTranslationCount: (userId: string): Promise<ApiResponse<{ count: number }>> =>
    apiClient.get(`/users/${userId}/translations/count`),

  /**
   * Get user statistics for dashboard
   */
  getStatistics: (userId: string): Promise<ApiResponse<{
    total_words: number;
    words_in_deep_memory: number;
    current_streak: number;
    today_minutes: number;
  }>> =>
    apiClient.get(`/users/${userId}/statistics`),

  /**
   * Check if user has any vocabulary words
   */
  hasWords: (userId: string): Promise<ApiResponse<{ has_words: boolean }>> =>
    apiClient.get(`/users/${userId}/has-words`),

  /**
   * Get weekly progress data for dashboard charts
   */
  getWeeklyProgress: (userId: string): Promise<ApiResponse<{
    daily_progress: Array<{
      date: string;
      words_learned: number;
      minutes_studied: number;
    }>;
  }>> =>
    apiClient.get(`/users/${userId}/progress/weekly`),

  /**
   * Get complete user profile data
   */
  getProfile: (userId: string): Promise<ApiResponse<{
    user: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
      createdAt: string;
    };
    languages: {
      native: any;
      study: any;
    };
    preferences: any;
    statistics: any;
  }>> =>
    apiClient.get(`/users/${userId}/profile`),

  /**
   * Update user profile information
   */
  updateProfile: (userId: string, data: {
    name?: string;
    preferences?: any;
  }): Promise<ApiResponse<any>> =>
    apiClient.patch(`/users/${userId}/profile`, data),

  /**
   * Update user preferences
   */
  updatePreferences: (userId: string, preferences: any): Promise<ApiResponse<any>> =>
    apiClient.patch(`/users/${userId}/preferences`, { preferences }),

  /**
   * Export user data
   */
  exportData: (userId: string, request: {
    includeProgress: boolean;
    includeVocabulary: boolean;
    includeSettings: boolean;
    format: 'json' | 'csv';
  }): Promise<ApiResponse<{
    downloadUrl: string;
    fileName: string;
    expiresAt: string;
    fileSize: number;
  }>> =>
    apiClient.post(`/users/${userId}/export`, request),

  /**
   * Delete user account
   */
  deleteAccount: (userId: string, data?: {
    password?: string;
    reason?: string;
    feedback?: string;
  }): Promise<ApiResponse<void>> =>
    apiClient.post(`/users/${userId}/delete`, data || {}),
};

/**
 * Language API endpoints
 */
export const languageApi = {
  /**
   * Get all available languages
   */
  getLanguages: (): Promise<ApiResponse<LanguagesResponse>> => 
    apiClient.get('/languages/'),

  /**
   * Get language by ID
   */
  getLanguage: (id: string): Promise<ApiResponse<any>> => 
    apiClient.get(`/languages/${id}`),
};

/**
 * Catalogue API endpoints
 */
export const catalogueApi = {
  /**
   * Get catalogues for language and CEFR level
   */
  getCatalogues: (languageId?: string, cefrLevel?: string, theme?: string): Promise<ApiResponse<CataloguesResponse>> => {
    const params: any = {};
    if (languageId) params.language_id = languageId;
    if (cefrLevel) params.cefr_level = cefrLevel;
    if (theme) params.theme = theme;
    return apiClient.get('/catalogues/', params);
  },

  /**
   * Get catalogue by ID with all translations
   */
  getCatalogue: (id: string): Promise<ApiResponse<any>> =>
    apiClient.get(`/catalogues/${id}`),

  /**
   * Get all translations in a catalogue
   */
  getCatalogueTranslations: (catalogueId: string): Promise<ApiResponse<{
    translations: Array<{
      id: string;
      catalogue_id: string;
      native_word: string;
      study_word: string;
      native_definition?: string;
      study_definition?: string;
      image_hash: string;
      audio_hash: string;
      difficulty: number;
      frequency: number;
      part_of_speech?: string;
      examples?: Array<{
        id: string;
        translation_id: string;
        native_example: string;
        study_example: string;
        context?: string;
      }>;
      tags?: string[];
      created_at: string;
      updated_at: string;
    }>;
    total_count: number;
  }>> =>
    apiClient.get(`/catalogues/${catalogueId}/translations`),

  /**
   * Search catalogues by name, description, or theme
   */
  searchCatalogues: (query: string, filters?: {
    language_id?: string;
    cefr_level?: string;
    theme?: string;
    min_words?: number;
    max_words?: number;
  }): Promise<ApiResponse<CataloguesResponse>> => {
    const params: any = { search: query };
    if (filters) {
      Object.assign(params, filters);
    }
    return apiClient.get('/catalogues/search', params);
  },

  /**
   * Get catalogue recommendations for user
   */
  getRecommendations: (userId: string, limit?: number): Promise<ApiResponse<{
    recommendations: Array<{
      catalogue: any;
      reason: string;
      priority: number;
      estimated_time: number;
      prerequisites?: string[];
    }>;
  }>> =>
    apiClient.get(`/users/${userId}/catalogue-recommendations`, { limit: limit || 5 }),
};

/**
 * Translation/Practice API endpoints
 */
export const practiceApi = {
  /**
   * Get random translation for practice
   */
  getRandomTranslation: (userId: string, catalogueId?: string): Promise<ApiResponse<RandomTranslationResponse>> => {
    const params: any = {};
    if (catalogueId) params.catalogue_id = catalogueId;
    return apiClient.get(`/users/${userId}/translations/random`, params);
  },

  /**
   * Add translation to user's study list
   */
  addTranslation: (userId: string, translationData: any): Promise<ApiResponse<any>> =>
    apiClient.post(`/users/${userId}/translations/`, translationData),

  /**
   * Add multiple translations to user's study list
   */
  addTranslations: (userId: string, translationIds: string[]): Promise<ApiResponse<{
    added_count: number;
    skipped_count: number;
    errors: Array<{ translation_id: string; error: string }>;
  }>> =>
    apiClient.post(`/users/${userId}/translations/bulk`, { translation_ids: translationIds }),

  /**
   * Remove translations from user's study list
   */
  removeTranslations: (userId: string, translationIds: string[]): Promise<ApiResponse<{
    removed_count: number;
    errors: Array<{ translation_id: string; error: string }>;
  }>> =>
    apiClient.post(`/users/${userId}/translations/bulk-remove`, { translation_ids: translationIds }),

  /**
   * Get user's selected word list
   */
  getUserSelectedWords: (userId: string): Promise<ApiResponse<{
    selected_words: Array<{
      translation_id: string;
      catalogue_id: string;
      native_word: string;
      study_word: string;
      selected_at: string;
    }>;
    total_count: number;
    by_catalogue: Record<string, number>;
  }>> =>
    apiClient.get(`/users/${userId}/selected-words`),

  /**
   * Update translation knowledge status
   */
  updateTranslation: (userId: string, translationId: string, isKnown: boolean): Promise<ApiResponse<any>> =>
    apiClient.patch(`/users/${userId}/translations/${translationId}`, { is_known: isKnown }),

  /**
   * Create study session record
   */
  createStudySession: (userId: string, data: CreateStudySessionRequest): Promise<ApiResponse<any>> =>
    apiClient.post(`/users/${userId}/study-sessions/`, data),
};

/**
 * Analytics API endpoints
 */
export const analyticsApi = {
  /**
   * Get user's progress entries for charts
   */
  getProgressEntries: (userId: string, timeRange?: ChartTimeRange, filters?: AnalyticsFilterOptions): Promise<ApiResponse<{
    entries: ProgressEntry[];
    total_count: number;
  }>> => {
    const params: any = {};
    if (timeRange) params.time_range = timeRange;
    if (filters) Object.assign(params, filters);
    return apiClient.get(`/users/${userId}/analytics/progress`, params);
  },

  /**
   * Get user's session entries for analytics
   */
  getSessionEntries: (userId: string, timeRange?: ChartTimeRange, limit?: number): Promise<ApiResponse<{
    sessions: SessionEntry[];
    total_count: number;
  }>> => {
    const params: any = {};
    if (timeRange) params.time_range = timeRange;
    if (limit) params.limit = limit;
    return apiClient.get(`/users/${userId}/analytics/sessions`, params);
  },

  /**
   * Record a new session entry
   */
  recordSession: (userId: string, session: Omit<SessionEntry, 'id' | 'created_at'>): Promise<ApiResponse<SessionEntry>> =>
    apiClient.post(`/users/${userId}/analytics/sessions`, session),

  /**
   * Record daily progress entry
   */
  recordProgressEntry: (userId: string, entry: Omit<ProgressEntry, 'id' | 'created_at'>): Promise<ApiResponse<ProgressEntry>> =>
    apiClient.post(`/users/${userId}/analytics/progress`, entry),

  /**
   * Get comprehensive analytics data
   */
  getAnalyticsData: (userId: string, period?: 'week' | 'month' | 'quarter' | 'year'): Promise<ApiResponse<AnalyticsResponse>> => {
    const params: any = {};
    if (period) params.period = period;
    return apiClient.get(`/users/${userId}/analytics/comprehensive`, params);
  },

  /**
   * Get learning insights and recommendations
   */
  getInsights: (userId: string): Promise<ApiResponse<InsightsResponse>> =>
    apiClient.get(`/users/${userId}/analytics/insights`),

  /**
   * Get chart data for visualization
   */
  getChartData: (userId: string, chartType: 'progress' | 'performance' | 'retention', timeRange?: ChartTimeRange): Promise<ApiResponse<{
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      type: 'line' | 'bar' | 'area';
      color: string;
    }>;
    trends: {
      primary_trend: 'up' | 'down' | 'stable';
      secondary_trend?: 'up' | 'down' | 'stable';
      correlation?: number;
    };
  }>> => {
    const params: any = { chart_type: chartType };
    if (timeRange) params.time_range = timeRange;
    return apiClient.get(`/users/${userId}/analytics/charts`, params);
  },

  /**
   * Get word strength data for spaced repetition
   */
  getWordStrengths: (userId: string): Promise<ApiResponse<{
    word_strengths: Record<string, WordStrength>;
    due_for_review: number;
    next_review_times: Array<{ word_id: string; next_review: string; priority: string }>;
  }>> =>
    apiClient.get(`/users/${userId}/analytics/word-strengths`),

  /**
   * Update word strength after practice
   */
  updateWordStrength: (userId: string, wordId: string, strength: Partial<WordStrength>): Promise<ApiResponse<WordStrength>> =>
    apiClient.patch(`/users/${userId}/analytics/word-strengths/${wordId}`, strength),

  /**
   * Get review schedule for spaced repetition
   */
  getReviewSchedule: (userId: string, limit?: number): Promise<ApiResponse<{
    schedule: ReviewSchedule[];
    stats: {
      due_today: number;
      due_this_week: number;
      overdue: number;
    };
  }>> => {
    const params: any = {};
    if (limit) params.limit = limit;
    return apiClient.get(`/users/${userId}/analytics/review-schedule`, params);
  },

  /**
   * Get user milestones and achievements
   */
  getMilestones: (userId: string): Promise<ApiResponse<{
    milestones: Milestone[];
    achievements: Achievement[];
    next_milestones: Array<{
      milestone: Milestone;
      progress_to_next: number;
      estimated_completion: string | null;
    }>;
  }>> =>
    apiClient.get(`/users/${userId}/analytics/milestones`),

  /**
   * Record milestone achievement
   */
  achieveMilestone: (userId: string, milestoneId: string, valueAchieved: number): Promise<ApiResponse<Achievement>> =>
    apiClient.post(`/users/${userId}/analytics/milestones/${milestoneId}/achieve`, {
      value_achieved: valueAchieved,
      achieved_at: new Date().toISOString()
    }),

  /**
   * Track analytics event
   */
  trackEvent: (userId: string, eventType: string, metadata?: Record<string, any>): Promise<ApiResponse<void>> =>
    apiClient.post(`/users/${userId}/analytics/events`, {
      event_type: eventType,
      metadata: metadata || {},
      timestamp: new Date().toISOString()
    }),

  /**
   * Get retention analytics
   */
  getRetentionMetrics: (userId: string, timeRange?: ChartTimeRange): Promise<ApiResponse<{
    retention_rates: {
      day_1: number;
      day_7: number;
      day_30: number;
      overall: number;
    };
    forgetting_curve: Array<{
      days: number;
      retention_percentage: number;
    }>;
    by_difficulty: Record<string, {
      retention_rate: number;
      word_count: number;
      average_strength: number;
    }>;
  }>> => {
    const params: any = {};
    if (timeRange) params.time_range = timeRange;
    return apiClient.get(`/users/${userId}/analytics/retention`, params);
  },

  /**
   * Get performance analytics
   */
  getPerformanceMetrics: (userId: string, timeRange?: ChartTimeRange): Promise<ApiResponse<{
    accuracy: {
      current: number;
      trend: 'improving' | 'declining' | 'stable';
      by_session_type: Record<string, number>;
      by_difficulty: Record<string, number>;
    };
    response_time: {
      average: number;
      median: number;
      trend: 'improving' | 'declining' | 'stable';
      by_difficulty: Record<string, number>;
    };
    consistency: {
      score: number;
      study_pattern: 'regular' | 'irregular' | 'weekend_heavy' | 'weekday_heavy';
      optimal_study_time: number;
    };
    learning_velocity: {
      words_per_week: number;
      minutes_per_day: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    };
  }>> => {
    const params: any = {};
    if (timeRange) params.time_range = timeRange;
    return apiClient.get(`/users/${userId}/analytics/performance`, params);
  },

  /**
   * Export analytics data
   */
  exportAnalytics: (userId: string, options: {
    format: 'json' | 'csv' | 'excel';
    include_sessions: boolean;
    include_progress: boolean;
    include_word_strengths: boolean;
    date_range?: { start: string; end: string };
  }): Promise<ApiResponse<{
    download_url: string;
    file_name: string;
    expires_at: string;
    file_size: number;
  }>> =>
    apiClient.post(`/users/${userId}/analytics/export`, options),

  /**
   * Get study patterns analysis
   */
  getStudyPatterns: (userId: string): Promise<ApiResponse<{
    time_preferences: {
      most_active_hour: number;
      preferred_session_length: number;
      weekly_distribution: Record<string, number>;
    };
    behavior_patterns: {
      consistency_score: number;
      procrastination_tendency: number;
      goal_achievement_rate: number;
    };
    content_preferences: {
      preferred_difficulty: string;
      session_type_preference: 'words' | 'sentences' | 'mixed';
      audio_usage_rate: number;
    };
    predictions: {
      next_likely_study_time: string | null;
      predicted_session_length: number;
      goal_achievement_probability: number;
    };
  }>> =>
    apiClient.get(`/users/${userId}/analytics/study-patterns`),

  /**
   * Get personalized recommendations
   */
  getRecommendations: (userId: string, limit?: number): Promise<ApiResponse<{
    recommendations: Array<{
      id: string;
      type: 'study_time' | 'frequency' | 'difficulty' | 'review' | 'goal';
      priority: 'high' | 'medium' | 'low';
      title: string;
      description: string;
      action_text: string;
      estimated_impact: string;
      based_on: string[];
      expires_at?: string;
    }>;
    priority_actions: Array<{
      action: string;
      reason: string;
      expected_benefit: string;
    }>;
  }>> => {
    const params: any = {};
    if (limit) params.limit = limit;
    return apiClient.get(`/users/${userId}/analytics/recommendations`, params);
  }
};

/**
 * Static content URLs (for audio and images)
 */
export const staticUrls = {
  /**
   * Get audio file URL from hash
   */
  getAudioUrl: (hash: string): string => 
    `${apiClient.instance.defaults.baseURL?.replace('/api', '') || ''}/static/audio/${hash}.mp3`,

  /**
   * Get image file URL from hash
   */
  getImageUrl: (hash: string): string => 
    `${apiClient.instance.defaults.baseURL?.replace('/api', '') || ''}/static/images/${hash}.jpg`,
};

// Export all APIs as a single object for convenience
export const api = {
  auth: authApi,
  user: userApi,
  language: languageApi,
  catalogue: catalogueApi,
  practice: practiceApi,
  analytics: analyticsApi,
  static: staticUrls,
};

export default api;