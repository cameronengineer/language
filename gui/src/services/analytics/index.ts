// Analytics Services Export
export { AnalyticsEngine, analyticsEngine } from './AnalyticsEngine';
export { ChartDataProcessor } from './ChartDataProcessor';

// Re-export analytics types for convenience
export type {
  ProgressEntry,
  SessionEntry,
  LearningAnalytics,
  RetentionMetrics,
  PerformanceMetrics,
  StudyPattern,
  WordStrength,
  AnalyticsRecommendation,
  ChartDataPoint,
  DualChartData,
  Milestone,
  Achievement,
  SRSConfig,
  ReviewSchedule,
  AnalyticsResponse,
  InsightsResponse,
  AnalyticsEventType,
  ChartTimeRange,
  AnalyticsFilterOptions,
  InteractiveChartConfig
} from '@/src/types/analytics';