// Analytics Components Export
export { MonthlyProgressChart } from './MonthlyProgressChart';
export { InsightsPanel } from './InsightsPanel';
export { SessionTracker, useSessionTracker } from './SessionTracker';
export { MilestoneTracker } from './MilestoneTracker';
export { RetentionAnalytics } from './RetentionAnalytics';

// Re-export analytics types for components
export type {
  ProgressEntry,
  SessionEntry,
  LearningAnalytics,
  AnalyticsRecommendation,
  ChartTimeRange,
  DualChartData,
  Milestone,
  Achievement,
  RetentionMetrics,
  PerformanceMetrics,
  StudyPattern
} from '@/src/types/analytics';

// Re-export analytics hooks
export {
  useAnalyticsData,
  useChartData,
  useProgressTracking,
  useAnalyticsActions
} from '@/src/stores/analyticsStore';

// Re-export analytics services
export { analyticsEngine, ChartDataProcessor } from '@/src/services/analytics';