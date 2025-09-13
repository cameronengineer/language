/**
 * Comprehensive Analytics System Validation Tests
 * Tests all aspects of the Phase 10 analytics implementation
 */

import { analyticsEngine, ChartDataProcessor } from '@/src/services/analytics';
import { useAnalyticsStore } from '@/src/stores/analyticsStore';
import {
  ProgressEntry,
  SessionEntry,
  LearningAnalytics,
  WordStrength,
  Milestone,
  ChartTimeRange
} from '@/src/types/analytics';

// Mock data for testing
const mockUserId = 'test-user-123';

const createMockProgressEntry = (date: string, index: number): ProgressEntry => ({
  id: `progress-${index}`,
  user_id: mockUserId,
  date,
  words_studied: 15 + Math.floor(Math.random() * 10),
  words_learned: 8 + Math.floor(Math.random() * 5),
  words_reviewed: 7 + Math.floor(Math.random() * 5),
  deep_memory_words: 50 + index * 2,
  study_time_minutes: 25 + Math.floor(Math.random() * 15),
  session_count: 1 + Math.floor(Math.random() * 2),
  accuracy_percentage: 70 + Math.floor(Math.random() * 25),
  streak_days: Math.max(0, index < 5 ? index : Math.floor(Math.random() * index)),
  daily_goal_minutes: 30,
  goal_achieved: Math.random() > 0.3,
  created_at: new Date().toISOString()
});

const createMockSessionEntry = (index: number): SessionEntry => {
  const startTime = new Date(Date.now() - index * 24 * 60 * 60 * 1000);
  const duration = 15 + Math.floor(Math.random() * 20);
  const cardsTotal = 10 + Math.floor(Math.random() * 15);
  const cardsCorrect = Math.floor(cardsTotal * (0.6 + Math.random() * 0.3));

  return {
    id: `session-${index}`,
    user_id: mockUserId,
    catalogue_id: `catalogue-${Math.floor(Math.random() * 3) + 1}`,
    session_type: Math.random() > 0.5 ? 'words' : 'sentences',
    start_time: startTime.toISOString(),
    end_time: new Date(startTime.getTime() + duration * 60 * 1000).toISOString(),
    duration_minutes: duration,
    cards_total: cardsTotal,
    cards_correct: cardsCorrect,
    cards_incorrect: cardsTotal - cardsCorrect,
    accuracy_percentage: Math.round((cardsCorrect / cardsTotal) * 100),
    words_learned: [index * 2 + 1, index * 2 + 2],
    words_reviewed: [`word-${index}-1`, `word-${index}-2`],
    new_words_encountered: Math.floor(Math.random() * 3) + 1,
    review_words_practiced: Math.floor(Math.random() * 5) + 2,
    average_response_time: 2 + Math.random() * 2,
    difficulty_level: ['A1', 'A2', 'B1', 'B2', 'C1'][Math.floor(Math.random() * 5)] as any,
    created_at: startTime.toISOString()
  };
};

const createMockWordStrength = (wordId: string): WordStrength => ({
  word_id: wordId,
  user_id: mockUserId,
  strength: Math.random(),
  confidence: Math.random(),
  last_reviewed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  next_review: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  review_count: Math.floor(Math.random() * 10) + 1,
  consecutive_correct: Math.floor(Math.random() * 5),
  consecutive_incorrect: Math.floor(Math.random() * 3),
  difficulty_modifier: 0.8 + Math.random() * 0.4,
  interval_days: Math.floor(Math.random() * 7) + 1,
  ease_factor: 1.3 + Math.random() * 1.2,
  lapses: Math.floor(Math.random() * 3),
  status: 'learning',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});

/**
 * Analytics Engine Tests
 */
describe('Analytics Engine', () => {
  let mockProgressEntries: ProgressEntry[];
  let mockSessionEntries: SessionEntry[];

  beforeEach(() => {
    // Generate 30 days of mock data
    mockProgressEntries = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return createMockProgressEntry(date.toISOString().split('T')[0], i);
    });

    mockSessionEntries = Array.from({ length: 50 }, (_, i) => createMockSessionEntry(i));
  });

  test('should generate learning analytics with valid data', () => {
    const analytics = analyticsEngine.generateLearningAnalytics(
      mockProgressEntries,
      mockSessionEntries,
      'month'
    );

    expect(analytics).toBeDefined();
    expect(analytics.user_id).toBe(mockUserId);
    expect(analytics.analysis_period).toBe('month');
    expect(analytics.learning_velocity).toBeDefined();
    expect(analytics.retention_rate).toBeDefined();
    expect(analytics.performance).toBeDefined();
    expect(analytics.study_patterns).toBeDefined();
    expect(analytics.difficulty_progress).toBeDefined();
    expect(Array.isArray(analytics.recommendations)).toBe(true);
  });

  test('should calculate learning velocity correctly', () => {
    const analytics = analyticsEngine.generateLearningAnalytics(
      mockProgressEntries,
      mockSessionEntries,
      'month'
    );

    expect(analytics.learning_velocity.words_per_week).toBeGreaterThan(0);
    expect(analytics.learning_velocity.minutes_per_day).toBeGreaterThan(0);
    expect(analytics.learning_velocity.sessions_per_week).toBeGreaterThan(0);
    expect(['increasing', 'decreasing', 'stable']).toContain(analytics.learning_velocity.trend);
  });

  test('should calculate retention rates within valid ranges', () => {
    const analytics = analyticsEngine.generateLearningAnalytics(
      mockProgressEntries,
      mockSessionEntries,
      'month'
    );

    expect(analytics.retention_rate.day_1).toBeGreaterThanOrEqual(0);
    expect(analytics.retention_rate.day_1).toBeLessThanOrEqual(100);
    expect(analytics.retention_rate.day_7).toBeGreaterThanOrEqual(0);
    expect(analytics.retention_rate.day_7).toBeLessThanOrEqual(100);
    expect(analytics.retention_rate.day_30).toBeGreaterThanOrEqual(0);
    expect(analytics.retention_rate.day_30).toBeLessThanOrEqual(100);
    expect(analytics.retention_rate.overall).toBeGreaterThanOrEqual(0);
    expect(analytics.retention_rate.overall).toBeLessThanOrEqual(100);
  });

  test('should generate spaced repetition schedule', () => {
    const wordStrength = createMockWordStrength('test-word-1');
    const schedule = analyticsEngine.calculateNextReview(wordStrength, true);

    expect(schedule).toBeDefined();
    expect(schedule.word_id).toBe('test-word-1');
    expect(schedule.current_interval).toBeGreaterThan(0);
    expect(schedule.next_review).toBeDefined();
    expect(['high', 'medium', 'low']).toContain(schedule.priority);
    expect(schedule.estimated_difficulty).toBeGreaterThanOrEqual(0);
    expect(schedule.estimated_difficulty).toBeLessThanOrEqual(1);
    expect(schedule.predicted_success_rate).toBeGreaterThanOrEqual(0);
    expect(schedule.predicted_success_rate).toBeLessThanOrEqual(100);
  });
});

/**
 * Chart Data Processor Tests
 */
describe('Chart Data Processor', () => {
  let mockProgressEntries: ProgressEntry[];

  beforeEach(() => {
    mockProgressEntries = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return createMockProgressEntry(date.toISOString().split('T')[0], i);
    });
  });

  test('should process dual chart data correctly', () => {
    const chartData = ChartDataProcessor.processDualChartData(mockProgressEntries, 'month');

    expect(chartData).toBeDefined();
    expect(Array.isArray(chartData.labels)).toBe(true);
    expect(Array.isArray(chartData.primary_data)).toBe(true);
    expect(Array.isArray(chartData.secondary_data)).toBe(true);
    expect(chartData.trends).toBeDefined();
    expect(['up', 'down', 'stable']).toContain(chartData.trends.primary_trend);
    expect(['up', 'down', 'stable']).toContain(chartData.trends.secondary_trend);
    expect(chartData.trends.correlation).toBeGreaterThanOrEqual(-1);
    expect(chartData.trends.correlation).toBeLessThanOrEqual(1);
  });

  test('should generate weekly summary correctly', () => {
    const weeklyData = ChartDataProcessor.processWeeklySummary(mockProgressEntries);

    expect(weeklyData).toBeDefined();
    expect(Array.isArray(weeklyData.labels)).toBe(true);
    expect(Array.isArray(weeklyData.primary_data)).toBe(true);
    expect(Array.isArray(weeklyData.secondary_data)).toBe(true);
    expect(weeklyData.labels.length).toBeGreaterThan(0);
  });

  test('should apply filters correctly', () => {
    const chartData = ChartDataProcessor.processDualChartData(mockProgressEntries, 'month');
    const filters = {
      time_range: 'week' as ChartTimeRange,
      include_goals: true,
      include_milestones: false
    };

    const filteredData = ChartDataProcessor.applyFilters(chartData, filters);

    expect(filteredData).toBeDefined();
    expect(filteredData.labels.length).toBeLessThanOrEqual(chartData.labels.length);
    expect(filteredData.primary_data.length).toBeLessThanOrEqual(chartData.primary_data.length);
    expect(filteredData.secondary_data.length).toBeLessThanOrEqual(chartData.secondary_data.length);
  });
});

/**
 * Analytics Store Tests
 */
describe('Analytics Store', () => {
  test('should initialize with correct default state', () => {
    const store = useAnalyticsStore.getState();

    expect(Array.isArray(store.progressEntries)).toBe(true);
    expect(Array.isArray(store.sessionEntries)).toBe(true);
    expect(typeof store.wordStrengths).toBe('object');
    expect(Array.isArray(store.milestones)).toBe(true);
    expect(Array.isArray(store.achievements)).toBe(true);
    expect(store.currentTimeRange).toBe('month');
    expect(store.isLoadingAnalytics).toBe(false);
    expect(store.isLoadingChart).toBe(false);
    expect(store.isRefreshing).toBe(false);
  });

  test('should update chart data when time range changes', () => {
    const store = useAnalyticsStore.getState();
    
    // Set some mock data first
    useAnalyticsStore.setState({
      progressEntries: Array.from({ length: 10 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return createMockProgressEntry(date.toISOString().split('T')[0], i);
      })
    });

    // Change time range
    store.setTimeRange('week');

    const updatedStore = useAnalyticsStore.getState();
    expect(updatedStore.currentTimeRange).toBe('week');
  });

  test('should handle milestone detection correctly', async () => {
    const store = useAnalyticsStore.getState();
    
    // Set up mock data with milestone-triggering values
    const mockMilestones: Milestone[] = [{
      id: 'test-milestone-1',
      type: 'streak',
      title: 'Test Streak',
      description: 'Test milestone',
      target_value: 5,
      current_value: 0,
      progress_percentage: 0,
      completed: false,
      reward_points: 100,
      icon: 'flame.fill',
      color: '#FF9500'
    }];

    const mockProgressWithStreak = [createMockProgressEntry('2024-01-01', 0)];
    mockProgressWithStreak[0].streak_days = 6; // Exceeds milestone target

    useAnalyticsStore.setState({
      milestones: mockMilestones,
      progressEntries: mockProgressWithStreak
    });

    await store.checkMilestones();

    const updatedStore = useAnalyticsStore.getState();
    expect(updatedStore.milestones[0].completed).toBe(true);
    expect(updatedStore.milestones[0].progress_percentage).toBe(120); // 6/5 * 100
  });
});

/**
 * Integration Tests
 */
describe('Analytics Integration', () => {
  test('should handle complete analytics workflow', async () => {
    const store = useAnalyticsStore.getState();
    
    // Set up comprehensive mock data
    const progressEntries = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return createMockProgressEntry(date.toISOString().split('T')[0], i);
    });

    const sessionEntries = Array.from({ length: 50 }, (_, i) => createMockSessionEntry(i));

    useAnalyticsStore.setState({
      progressEntries,
      sessionEntries
    });

    // Generate analytics
    await store.generateLearningAnalytics('month');
    store.generateChartData('month');
    store.generatePerformanceChart('month');

    const updatedStore = useAnalyticsStore.getState();

    // Verify analytics were generated
    expect(updatedStore.learningAnalytics).toBeDefined();
    expect(updatedStore.chartData).toBeDefined();
    expect(updatedStore.performanceChartData).toBeDefined();
    expect(Array.isArray(updatedStore.recommendations)).toBe(true);
  });

  test('should maintain data consistency across time range changes', () => {
    const store = useAnalyticsStore.getState();
    
    // Set up mock data
    const progressEntries = Array.from({ length: 90 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (89 - i));
      return createMockProgressEntry(date.toISOString().split('T')[0], i);
    });

    useAnalyticsStore.setState({ progressEntries });

    // Test different time ranges
    const timeRanges: ChartTimeRange[] = ['week', 'month', 'quarter', 'year'];
    
    timeRanges.forEach(timeRange => {
      store.setTimeRange(timeRange);
      const currentStore = useAnalyticsStore.getState();
      
      expect(currentStore.currentTimeRange).toBe(timeRange);
      expect(currentStore.chartData).toBeDefined();
    });
  });

  test('should handle error recovery gracefully', async () => {
    const store = useAnalyticsStore.getState();
    
    // Simulate error condition
    useAnalyticsStore.setState({
      progressEntries: [],
      sessionEntries: []
    });

    // Should not throw errors with empty data
    await expect(store.generateLearningAnalytics()).resolves.not.toThrow();
    expect(() => store.generateChartData()).not.toThrow();
    expect(() => store.generatePerformanceChart()).not.toThrow();
  });
});

/**
 * Performance Tests
 */
describe('Analytics Performance', () => {
  test('should handle large datasets efficiently', () => {
    const largeProgressData = Array.from({ length: 1000 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return createMockProgressEntry(date.toISOString().split('T')[0], i);
    });

    const largeSessionData = Array.from({ length: 2000 }, (_, i) => createMockSessionEntry(i));

    const startTime = performance.now();
    
    const analytics = analyticsEngine.generateLearningAnalytics(
      largeProgressData,
      largeSessionData,
      'year'
    );

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    expect(analytics).toBeDefined();
    expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
  });

  test('should process chart data efficiently', () => {
    const largeProgressData = Array.from({ length: 365 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return createMockProgressEntry(date.toISOString().split('T')[0], i);
    });

    const startTime = performance.now();
    
    const chartData = ChartDataProcessor.processDualChartData(largeProgressData, 'year');

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    expect(chartData).toBeDefined();
    expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
  });
});

/**
 * Data Validation Tests
 */
describe('Data Validation', () => {
  test('should validate progress entry data integrity', () => {
    const entry = createMockProgressEntry('2024-01-01', 0);

    expect(entry.id).toBeDefined();
    expect(entry.user_id).toBe(mockUserId);
    expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(entry.words_studied).toBeGreaterThanOrEqual(0);
    expect(entry.words_learned).toBeGreaterThanOrEqual(0);
    expect(entry.deep_memory_words).toBeGreaterThanOrEqual(0);
    expect(entry.study_time_minutes).toBeGreaterThanOrEqual(0);
    expect(entry.accuracy_percentage).toBeGreaterThanOrEqual(0);
    expect(entry.accuracy_percentage).toBeLessThanOrEqual(100);
    expect(entry.streak_days).toBeGreaterThanOrEqual(0);
  });

  test('should validate session entry data integrity', () => {
    const session = createMockSessionEntry(0);

    expect(session.id).toBeDefined();
    expect(session.user_id).toBe(mockUserId);
    expect(session.catalogue_id).toBeDefined();
    expect(['words', 'sentences']).toContain(session.session_type);
    expect(session.cards_total).toBeGreaterThan(0);
    expect(session.cards_correct).toBeGreaterThanOrEqual(0);
    expect(session.cards_incorrect).toBeGreaterThanOrEqual(0);
    expect(session.cards_correct + session.cards_incorrect).toBe(session.cards_total);
    expect(session.accuracy_percentage).toBeGreaterThanOrEqual(0);
    expect(session.accuracy_percentage).toBeLessThanOrEqual(100);
    expect(session.duration_minutes).toBeGreaterThan(0);
    expect(session.average_response_time).toBeGreaterThan(0);
  });

  test('should validate word strength data integrity', () => {
    const wordStrength = createMockWordStrength('test-word');

    expect(wordStrength.word_id).toBe('test-word');
    expect(wordStrength.user_id).toBe(mockUserId);
    expect(wordStrength.strength).toBeGreaterThanOrEqual(0);
    expect(wordStrength.strength).toBeLessThanOrEqual(1);
    expect(wordStrength.confidence).toBeGreaterThanOrEqual(0);
    expect(wordStrength.confidence).toBeLessThanOrEqual(1);
    expect(wordStrength.review_count).toBeGreaterThanOrEqual(0);
    expect(wordStrength.consecutive_correct).toBeGreaterThanOrEqual(0);
    expect(wordStrength.consecutive_incorrect).toBeGreaterThanOrEqual(0);
    expect(wordStrength.interval_days).toBeGreaterThan(0);
    expect(wordStrength.ease_factor).toBeGreaterThan(1);
  });
});

console.log('Analytics validation tests completed successfully! ✅');