// Analytics & Progress Tracking Types
import type { CEFRLevel } from './language';

// === Core Progress Tracking Types ===

export interface ProgressEntry {
  id: string;
  user_id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  words_studied: number;
  words_learned: number;
  words_reviewed: number;
  deep_memory_words: number;
  study_time_minutes: number;
  session_count: number;
  accuracy_percentage: number;
  streak_days: number;
  daily_goal_minutes: number;
  goal_achieved: boolean;
  created_at: string;
}

export interface SessionEntry {
  id: string;
  user_id: string;
  catalogue_id: string;
  session_type: 'words' | 'sentences';
  start_time: string;
  end_time: string;
  duration_minutes: number;
  cards_total: number;
  cards_correct: number;
  cards_incorrect: number;
  accuracy_percentage: number;
  words_learned: number[];
  words_reviewed: string[];
  new_words_encountered: number;
  review_words_practiced: number;
  average_response_time: number; // seconds
  difficulty_level: CEFRLevel;
  created_at: string;
}

// === Learning Analytics Types ===

export interface LearningAnalytics {
  user_id: string;
  analysis_period: 'week' | 'month' | 'quarter' | 'year';
  start_date: string;
  end_date: string;
  
  // Learning Velocity
  learning_velocity: {
    words_per_week: number;
    minutes_per_day: number;
    sessions_per_week: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  
  // Retention Metrics
  retention_rate: {
    day_1: number; // percentage retained after 1 day
    day_7: number; // percentage retained after 7 days
    day_30: number; // percentage retained after 30 days
    overall: number; // overall retention rate
  };
  
  // Performance Metrics
  performance: {
    average_accuracy: number;
    accuracy_trend: 'improving' | 'declining' | 'stable';
    average_response_time: number;
    response_time_trend: 'improving' | 'declining' | 'stable';
    consistency_score: number; // 0-100, based on regular study patterns
  };
  
  // Study Patterns
  study_patterns: {
    optimal_study_time: number; // minutes per session
    preferred_study_hour: number; // hour of day (0-23)
    most_productive_day: string; // day of week
    session_frequency: number; // sessions per week
    break_pattern: 'regular' | 'irregular' | 'weekend_heavy' | 'weekday_heavy';
  };
  
  // Difficulty Analysis
  difficulty_progress: Record<CEFRLevel, {
    words_learned: number;
    accuracy: number;
    time_spent_minutes: number;
    confidence_level: number; // 0-100
  }>;
  
  // Areas for Improvement
  weak_areas: string[];
  strong_areas: string[];
  
  // Personalized Recommendations
  recommendations: AnalyticsRecommendation[];
  
  generated_at: string;
}

export interface AnalyticsRecommendation {
  id: string;
  type: 'study_time' | 'frequency' | 'difficulty' | 'review' | 'goal';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action_text: string;
  estimated_impact: string;
  based_on: string[];
}

// === Retention & Spaced Repetition Types ===

export interface WordStrength {
  word_id: string;
  user_id: string;
  strength: number; // 0-1, where 1 is perfect retention
  confidence: number; // 0-1, user's self-reported confidence
  last_reviewed: string;
  next_review: string;
  review_count: number;
  consecutive_correct: number;
  consecutive_incorrect: number;
  difficulty_modifier: number; // word-specific difficulty (0.5-2.0)
  interval_days: number; // current spaced repetition interval
  ease_factor: number; // SuperMemo ease factor (1.3-2.5+)
  lapses: number; // times forgotten after being learned
  status: 'new' | 'learning' | 'review' | 'relearning' | 'buried';
  created_at: string;
  updated_at: string;
}

export interface RetentionMetrics {
  user_id: string;
  analysis_date: string;
  
  // Overall Retention
  total_words_tracked: number;
  words_in_deep_memory: number;
  deep_memory_percentage: number;
  
  // Memory Strength Distribution
  strength_distribution: {
    very_weak: number; // 0-0.2
    weak: number; // 0.2-0.4
    moderate: number; // 0.4-0.6
    strong: number; // 0.6-0.8
    very_strong: number; // 0.8-1.0
  };
  
  // Forgetting Curve Analysis
  forgetting_curve: {
    day_1_retention: number;
    day_7_retention: number;
    day_30_retention: number;
    day_90_retention: number;
    predicted_6_month: number;
  };
  
  // Review Scheduling
  due_for_review: {
    overdue: number;
    today: number;
    this_week: number;
    this_month: number;
  };
  
  // Performance by Difficulty
  by_difficulty: Record<CEFRLevel, {
    total_words: number;
    average_strength: number;
    retention_rate: number;
  }>;
}

// === Chart & Visualization Types ===

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

export interface DualChartData {
  labels: string[]; // dates or categories
  primary_data: ChartDataPoint[]; // line chart data (deep memory words)
  secondary_data: ChartDataPoint[]; // bar chart data (study time)
  trends: {
    primary_trend: 'up' | 'down' | 'stable';
    secondary_trend: 'up' | 'down' | 'stable';
    correlation: number; // -1 to 1
  };
}

export interface InteractiveChartConfig {
  chart_type: 'line' | 'bar' | 'combined' | 'area';
  time_period: 'week' | 'month' | 'quarter' | 'year';
  show_trends: boolean;
  show_goals: boolean;
  show_milestones: boolean;
  interactive_tooltips: boolean;
  zoom_enabled: boolean;
}

// === Milestone & Achievement Types ===

export interface Milestone {
  id: string;
  type: 'streak' | 'words_learned' | 'time_studied' | 'accuracy' | 'consistency';
  title: string;
  description: string;
  target_value: number;
  current_value: number;
  progress_percentage: number;
  completed: boolean;
  completed_at?: string;
  reward_points: number;
  icon: string;
  color: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  milestone_id: string;
  achieved_at: string;
  value_achieved: number;
  celebration_shown: boolean;
  shared: boolean;
}

// === Performance Analytics Types ===

export interface PerformanceMetrics {
  user_id: string;
  period_start: string;
  period_end: string;
  
  // Speed Metrics
  response_time: {
    average_seconds: number;
    median_seconds: number;
    improvement_rate: number; // percentage change from previous period
    by_difficulty: Record<CEFRLevel, number>;
  };
  
  // Accuracy Metrics
  accuracy: {
    overall_percentage: number;
    by_session_type: Record<'words' | 'sentences', number>;
    by_difficulty: Record<CEFRLevel, number>;
    improvement_rate: number;
    consistency_score: number; // how consistent accuracy is across sessions
  };
  
  // Learning Efficiency
  efficiency: {
    words_per_minute: number;
    retention_per_session: number;
    optimal_session_length: number;
    fatigue_point: number; // minutes when performance drops
  };
  
  // Comparative Analytics
  comparative: {
    peer_percentile: number; // where user ranks among similar learners
    personal_best: {
      accuracy: number;
      response_time: number;
      words_learned_per_session: number;
      longest_streak: number;
    };
  };
}

// === Study Pattern Analysis Types ===

export interface StudyPattern {
  user_id: string;
  analysis_period: string;
  
  // Temporal Patterns
  time_preferences: {
    most_active_hour: number;
    most_productive_hour: number;
    preferred_session_length: number;
    sessions_per_day: number;
    weekly_distribution: Record<string, number>; // day -> percentage
  };
  
  // Behavioral Patterns
  behavior: {
    consistency_score: number; // 0-100
    procrastination_tendency: number; // 0-100
    goal_achievement_rate: number; // percentage
    break_frequency: number; // days between study sessions
    comeback_strength: number; // performance after breaks
  };
  
  // Content Preferences
  content_preferences: {
    preferred_difficulty: CEFRLevel;
    session_type_preference: 'words' | 'sentences' | 'mixed';
    audio_usage_rate: number; // percentage of time audio is used
    catalogue_diversity: number; // how many different catalogues used
  };
  
  // Predictive Insights
  predictions: {
    next_likely_study_time: string;
    predicted_session_length: number;
    retention_forecast: number;
    goal_achievement_probability: number;
  };
}

// === API Response Types ===

export interface AnalyticsResponse {
  progress_entries: ProgressEntry[];
  learning_analytics: LearningAnalytics;
  retention_metrics: RetentionMetrics;
  performance_metrics: PerformanceMetrics;
  study_patterns: StudyPattern;
  milestones: Milestone[];
  chart_data: DualChartData;
}

export interface InsightsResponse {
  insights: AnalyticsRecommendation[];
  trends: {
    learning_velocity: 'increasing' | 'decreasing' | 'stable';
    retention_rate: 'improving' | 'declining' | 'stable';
    study_consistency: 'improving' | 'declining' | 'stable';
  };
  predictions: {
    next_milestone_date: string | null;
    goal_achievement_likelihood: number;
    optimal_next_session: {
      recommended_time: string;
      recommended_duration: number;
      recommended_content: string[];
    };
  };
}

// === Spaced Repetition Algorithm Types ===

export interface SRSConfig {
  algorithm: 'sm2' | 'sm15' | 'fsrs' | 'anki';
  initial_interval: number; // days
  graduation_interval: number; // days
  easy_interval: number; // days
  max_interval: number; // days
  ease_factor_modifier: number;
  difficulty_modifier: number;
  lapse_modifier: number;
}

export interface ReviewSchedule {
  word_id: string;
  current_interval: number;
  next_review: string;
  priority: 'high' | 'medium' | 'low';
  estimated_difficulty: number;
  predicted_success_rate: number;
}

// === Export Union Types ===

export type AnalyticsEventType = 
  | 'session_started'
  | 'session_completed'
  | 'word_learned'
  | 'word_reviewed'
  | 'milestone_achieved'
  | 'goal_completed'
  | 'streak_extended'
  | 'streak_broken';

export type ChartTimeRange = 'week' | 'month' | 'quarter' | 'year' | 'all';

export type AnalyticsFilterOptions = {
  time_range: ChartTimeRange;
  difficulty_levels: CEFRLevel[];
  session_types: ('words' | 'sentences')[];
  include_goals: boolean;
  include_milestones: boolean;
};