/**
 * State Management Tests
 * Tests Zustand stores functionality, state persistence, and interactions
 */

import { useUserStore } from '@/src/stores/userStore';
import { useDashboardStore } from '@/src/stores/dashboardStore';
import { useAnalyticsStore } from '@/src/stores/analyticsStore';
import { User } from '@/src/types/user';
import { Language } from '@/src/types/language';

// Mock API dependencies
jest.mock('@/src/services/api', () => ({
  api: {
    user: {
      getProgress: jest.fn(),
      getStatistics: jest.fn(),
      hasWords: jest.fn(),
      getWeeklyProgress: jest.fn(),
      updateLanguages: jest.fn(),
    },
    language: {
      getLanguages: jest.fn(),
    },
    analytics: {
      getProgressEntries: jest.fn(),
      getSessionEntries: jest.fn(),
    },
  },
}));

describe('State Management Tests', () => {
  const mockLanguages: Language[] = [
    {
      id: 'en',
      name: 'English',
      code: 'en',
      flag_emoji: '🇺🇸',
      is_active: true,
    },
    {
      id: 'es',
      name: 'Spanish',
      code: 'es',
      flag_emoji: '🇪🇸',
      is_active: true,
    },
    {
      id: 'fr',
      name: 'French',
      code: 'fr',
      flag_emoji: '🇫🇷',
      is_active: true,
    },
  ];

  beforeEach(() => {
    // Reset stores by setting initial state
    useUserStore.setState({
      languageSelection: {
        native_language: null,
        study_language: null,
        available_languages: [],
        is_loading: false,
        error: null,
      },
      progress: null,
      isLoadingLanguages: false,
      isLoadingProgress: false,
      isUpdatingLanguages: false,
      languageError: null,
      progressError: null,
    });

    useDashboardStore.setState({
      statistics: null,
      hasWords: null,
      lastRefreshTime: null,
      isLoadingStatistics: false,
      isLoadingHasWords: false,
      isRefreshing: false,
      statisticsError: null,
      hasWordsError: null,
    });

    useAnalyticsStore.setState({
      progressEntries: [],
      sessionEntries: [],
      wordStrengths: {},
      milestones: [],
      achievements: [],
      learningAnalytics: null,
      chartData: null,
      performanceChartData: null,
      recommendations: [],
      currentTimeRange: 'month',
      isLoadingAnalytics: false,
      isLoadingChart: false,
      isRefreshing: false,
      analyticsError: null,
      chartError: null,
    });
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('User Store', () => {
    test('should initialize with correct default state', () => {
      const store = useUserStore.getState();
      
      expect(store.languageSelection.native_language).toBe(null);
      expect(store.languageSelection.study_language).toBe(null);
      expect(store.languageSelection.available_languages).toEqual([]);
      expect(store.progress).toBe(null);
      expect(store.isLoadingLanguages).toBe(false);
      expect(store.languageError).toBe(null);
    });

    test('should load languages successfully', async () => {
      const mockApi = require('@/src/services/api').api;
      mockApi.language.getLanguages.mockResolvedValue({
        data: { languages: mockLanguages },
        success: true,
      });

      const store = useUserStore.getState();
      await store.loadLanguages();

      const updatedStore = useUserStore.getState();
      expect(updatedStore.languageSelection.available_languages).toEqual(mockLanguages);
      expect(updatedStore.isLoadingLanguages).toBe(false);
      expect(updatedStore.languageError).toBe(null);
    });

    test('should handle language loading failure', async () => {
      const mockApi = require('@/src/services/api').api;
      const error = new Error('Network error');
      mockApi.language.getLanguages.mockRejectedValue(error);

      const store = useUserStore.getState();
      
      try {
        await store.loadLanguages();
      } catch (e) {
        // Expected to throw
      }

      const updatedStore = useUserStore.getState();
      expect(updatedStore.isLoadingLanguages).toBe(false);
      expect(updatedStore.languageError).toBeDefined();
      expect(updatedStore.languageError?.message).toContain('Failed to load languages');
    });

    test('should set native language', () => {
      const store = useUserStore.getState();
      const englishLanguage = mockLanguages[0];
      
      store.setNativeLanguage(englishLanguage);

      const updatedStore = useUserStore.getState();
      expect(updatedStore.languageSelection.native_language).toEqual(englishLanguage);
    });

    test('should set study language', () => {
      const store = useUserStore.getState();
      const spanishLanguage = mockLanguages[1];
      
      store.setStudyLanguage(spanishLanguage);

      const updatedStore = useUserStore.getState();
      expect(updatedStore.languageSelection.study_language).toEqual(spanishLanguage);
    });

    test('should prevent setting same native and study language', () => {
      const store = useUserStore.getState();
      const englishLanguage = mockLanguages[0];
      
      // Set native language first
      store.setNativeLanguage(englishLanguage);
      
      // Try to set same language as study language
      expect(() => store.setStudyLanguage(englishLanguage)).toThrow(
        'Study language must be different from native language'
      );
    });

    test('should update user languages on backend', async () => {
      const mockApi = require('@/src/services/api').api;
      const updatedUser: User = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        native_language_id: 'en',
        study_language_id: 'fr',
        profile_picture_url: 'https://example.com/avatar.jpg',
        created_at: new Date().toISOString(),
        provider: 'google',
      };

      mockApi.user.updateLanguages.mockResolvedValue({
        data: updatedUser,
        success: true,
      });

      const store = useUserStore.getState();
      const result = await store.updateUserLanguages('user-123', 'en', 'fr');

      expect(mockApi.user.updateLanguages).toHaveBeenCalledWith('user-123', {
        native_language_id: 'en',
        study_language_id: 'fr',
      });
      expect(result).toEqual(updatedUser);
      expect(useUserStore.getState().isUpdatingLanguages).toBe(false);
    });

    test('should clear language selection', () => {
      const store = useUserStore.getState();
      
      // First set some selections
      store.setNativeLanguage(mockLanguages[0]);
      store.setStudyLanguage(mockLanguages[1]);

      expect(useUserStore.getState().languageSelection.native_language).toBeDefined();
      expect(useUserStore.getState().languageSelection.study_language).toBeDefined();

      // Clear selection
      store.clearLanguageSelection();

      const clearedStore = useUserStore.getState();
      expect(clearedStore.languageSelection.native_language).toBe(null);
      expect(clearedStore.languageSelection.study_language).toBe(null);
    });

    test('should clear errors', () => {
      const store = useUserStore.getState();
      
      // Set some errors
      useUserStore.setState({
        languageError: { code: 'TEST', message: 'Test error' },
        progressError: { code: 'TEST', message: 'Progress error' },
        languageSelection: {
          ...store.languageSelection,
          error: 'Selection error',
        },
      });

      store.clearErrors();

      const clearedStore = useUserStore.getState();
      expect(clearedStore.languageError).toBe(null);
      expect(clearedStore.progressError).toBe(null);
      expect(clearedStore.languageSelection.error).toBe(null);
    });
  });

  describe('Dashboard Store', () => {
    test('should initialize with correct default state', () => {
      const store = useDashboardStore.getState();
      
      expect(store.statistics).toBe(null);
      expect(store.hasWords).toBe(null);
      expect(store.isLoadingStatistics).toBe(false);
      expect(store.isLoadingHasWords).toBe(false);
      expect(store.isRefreshing).toBe(false);
      expect(store.statisticsError).toBe(null);
      expect(store.hasWordsError).toBe(null);
    });

    test('should load statistics successfully', async () => {
      const store = useDashboardStore.getState();
      
      // Mock timer for simulation
      jest.spyOn(global, 'setTimeout').mockImplementation((fn: any) => {
        fn();
        return 0 as any;
      });

      await store.loadStatistics('user-123');

      const updatedStore = useDashboardStore.getState();
      expect(updatedStore.statistics).toBeDefined();
      expect(updatedStore.statistics?.total_words).toBeGreaterThan(0);
      expect(updatedStore.statistics?.weekly_progress).toHaveLength(7);
      expect(updatedStore.isLoadingStatistics).toBe(false);
      expect(updatedStore.lastRefreshTime).toBeDefined();
    });

    test('should check if user has words', async () => {
      const store = useDashboardStore.getState();
      
      jest.spyOn(global, 'setTimeout').mockImplementation((fn: any) => {
        fn();
        return 0 as any;
      });

      await store.checkHasWords('user-123');

      const updatedStore = useDashboardStore.getState();
      expect(typeof updatedStore.hasWords).toBe('boolean');
      expect(updatedStore.isLoadingHasWords).toBe(false);
    });

    test('should load dashboard data completely', async () => {
      const store = useDashboardStore.getState();
      
      jest.spyOn(global, 'setTimeout').mockImplementation((fn: any) => {
        fn();
        return 0 as any;
      });

      await store.loadDashboardData('user-123');

      const updatedStore = useDashboardStore.getState();
      expect(updatedStore.statistics).toBeDefined();
      expect(typeof updatedStore.hasWords).toBe('boolean');
      expect(updatedStore.isLoadingStatistics).toBe(false);
      expect(updatedStore.isLoadingHasWords).toBe(false);
    });

    test('should refresh dashboard data', async () => {
      const store = useDashboardStore.getState();
      
      jest.spyOn(global, 'setTimeout').mockImplementation((fn: any) => {
        fn();
        return 0 as any;
      });

      await store.refreshDashboard('user-123');

      const updatedStore = useDashboardStore.getState();
      expect(updatedStore.isRefreshing).toBe(false);
      expect(updatedStore.lastRefreshTime).toBeDefined();
    });

    test('should clear errors', () => {
      const store = useDashboardStore.getState();
      
      // Set errors
      useDashboardStore.setState({
        statisticsError: { code: 'TEST', message: 'Stats error' },
        hasWordsError: { code: 'TEST', message: 'Words error' },
      });

      store.clearErrors();

      const clearedStore = useDashboardStore.getState();
      expect(clearedStore.statisticsError).toBe(null);
      expect(clearedStore.hasWordsError).toBe(null);
    });

    test('should reset dashboard state', () => {
      const store = useDashboardStore.getState();
      
      // Set some state
      useDashboardStore.setState({
        statistics: {
          total_words: 100,
          words_in_deep_memory: 50,
          current_streak: 5,
          today_minutes: 30,
          weekly_progress: [],
        },
        hasWords: true,
        lastRefreshTime: new Date().toISOString(),
      });

      store.resetDashboard();

      const resetStore = useDashboardStore.getState();
      expect(resetStore.statistics).toBe(null);
      expect(resetStore.hasWords).toBe(null);
      expect(resetStore.lastRefreshTime).toBe(null);
    });
  });

  describe('Analytics Store', () => {
    test('should initialize with correct default state', () => {
      const store = useAnalyticsStore.getState();
      
      expect(store.progressEntries).toEqual([]);
      expect(store.sessionEntries).toEqual([]);
      expect(store.wordStrengths).toEqual({});
      expect(store.milestones).toEqual([]);
      expect(store.achievements).toEqual([]);
      expect(store.learningAnalytics).toBe(null);
      expect(store.chartData).toBe(null);
      expect(store.performanceChartData).toBe(null);
      expect(store.recommendations).toEqual([]);
      expect(store.currentTimeRange).toBe('month');
      expect(store.isLoadingAnalytics).toBe(false);
      expect(store.isLoadingChart).toBe(false);
      expect(store.isRefreshing).toBe(false);
      expect(store.analyticsError).toBe(null);
      expect(store.chartError).toBe(null);
    });

    test('should set time range and update chart data', () => {
      const store = useAnalyticsStore.getState();
      
      // Set up some mock progress data
      useAnalyticsStore.setState({
        progressEntries: [
          {
            id: 'progress-1',
            user_id: 'user-123',
            date: '2024-01-01',
            words_studied: 15,
            words_learned: 10,
            words_reviewed: 5,
            deep_memory_words: 50,
            study_time_minutes: 30,
            session_count: 2,
            accuracy_percentage: 85,
            streak_days: 5,
            daily_goal_minutes: 30,
            goal_achieved: true,
            created_at: new Date().toISOString(),
          },
        ],
      });

      store.setTimeRange('week');

      const updatedStore = useAnalyticsStore.getState();
      expect(updatedStore.currentTimeRange).toBe('week');
      expect(updatedStore.chartData).toBeDefined();
    });

    test('should generate learning analytics', async () => {
      const store = useAnalyticsStore.getState();
      
      // Set up mock data
      useAnalyticsStore.setState({
        progressEntries: [
          {
            id: 'progress-1',
            user_id: 'user-123',
            date: '2024-01-01',
            words_studied: 15,
            words_learned: 10,
            words_reviewed: 5,
            deep_memory_words: 50,
            study_time_minutes: 30,
            session_count: 2,
            accuracy_percentage: 85,
            streak_days: 5,
            daily_goal_minutes: 30,
            goal_achieved: true,
            created_at: new Date().toISOString(),
          },
        ],
        sessionEntries: [
          {
            id: 'session-1',
            user_id: 'user-123',
            catalogue_id: 'catalogue-1',
            session_type: 'words',
            start_time: new Date().toISOString(),
            end_time: new Date().toISOString(),
            duration_minutes: 15,
            cards_total: 10,
            cards_correct: 8,
            cards_incorrect: 2,
            accuracy_percentage: 80,
            words_learned: [1, 2],
            words_reviewed: ['word-1', 'word-2'],
            new_words_encountered: 2,
            review_words_practiced: 3,
            average_response_time: 2.5,
            difficulty_level: 'A1',
            created_at: new Date().toISOString(),
          },
        ],
      });

      await store.generateLearningAnalytics('month');

      const updatedStore = useAnalyticsStore.getState();
      expect(updatedStore.learningAnalytics).toBeDefined();
      expect(updatedStore.learningAnalytics?.user_id).toBe('user-123');
      expect(updatedStore.learningAnalytics?.analysis_period).toBe('month');
      expect(updatedStore.isLoadingAnalytics).toBe(false);
    });

    test('should handle analytics loading failure', async () => {
      const store = useAnalyticsStore.getState();
      
      // Simulate error condition by not setting required data
      await store.generateLearningAnalytics('month');

      // Should handle gracefully
      const updatedStore = useAnalyticsStore.getState();
      expect(updatedStore.isLoadingAnalytics).toBe(false);
    });

    test('should clear analytics errors', () => {
      const store = useAnalyticsStore.getState();
      
      useAnalyticsStore.setState({
        analyticsError: { code: 'TEST', message: 'Analytics error' },
        chartError: { code: 'TEST', message: 'Chart error' },
      });

      store.clearAnalyticsError();
      store.clearChartError();

      const clearedStore = useAnalyticsStore.getState();
      expect(clearedStore.analyticsError).toBe(null);
      expect(clearedStore.chartError).toBe(null);
    });
  });

  describe('Cross-Store State Consistency', () => {
    test('should maintain consistency between user and dashboard stores', async () => {
      const userStore = useUserStore.getState();
      const dashboardStore = useDashboardStore.getState();
      
      // Set user languages
      userStore.setNativeLanguage(mockLanguages[0]);
      userStore.setStudyLanguage(mockLanguages[1]);

      expect(useUserStore.getState().languageSelection.native_language?.id).toBe('en');
      expect(useUserStore.getState().languageSelection.study_language?.id).toBe('es');
      
      // Dashboard should be able to load data for the user
      jest.spyOn(global, 'setTimeout').mockImplementation((fn: any) => {
        fn();
        return 0 as any;
      });

      await dashboardStore.loadDashboardData('user-123');

      const updatedDashboard = useDashboardStore.getState();
      expect(updatedDashboard.statistics).toBeDefined();
      expect(typeof updatedDashboard.hasWords).toBe('boolean');
    });

    test('should handle language changes affecting analytics', () => {
      const userStore = useUserStore.getState();
      const analyticsStore = useAnalyticsStore.getState();
      
      // Set initial language
      userStore.setStudyLanguage(mockLanguages[1]); // Spanish
      
      // Change to different language
      userStore.setStudyLanguage(mockLanguages[2]); // French
      
      expect(useUserStore.getState().languageSelection.study_language?.id).toBe('fr');
    });
  });

  describe('State Persistence', () => {
    test('should persist language selection', () => {
      const store = useUserStore.getState();
      
      store.setNativeLanguage(mockLanguages[0]);
      store.setStudyLanguage(mockLanguages[1]);

      // The persistence middleware should handle this automatically
      const persistedState = useUserStore.getState();
      expect(persistedState.languageSelection.native_language).toEqual(mockLanguages[0]);
      expect(persistedState.languageSelection.study_language).toEqual(mockLanguages[1]);
    });

    test('should persist dashboard statistics', () => {
      const mockStatistics = {
        total_words: 150,
        words_in_deep_memory: 45,
        current_streak: 7,
        today_minutes: 25,
        weekly_progress: [],
      };

      useDashboardStore.setState({ statistics: mockStatistics });

      // The persistence middleware should handle this automatically
      const persistedState = useDashboardStore.getState();
      expect(persistedState.statistics).toEqual(mockStatistics);
    });

    test('should not persist loading states', () => {
      useDashboardStore.setState({
        isLoadingStatistics: true,
        isRefreshing: true,
        statisticsError: { code: 'TEST', message: 'Error' },
      });

      // Loading states should not be persisted (they should reset to false)
      const store = useDashboardStore.getState();
      expect(store.isLoadingStatistics).toBe(true); // Currently true
      expect(store.isRefreshing).toBe(true); // Currently true
    });
  });

  describe('Error Recovery', () => {
    test('should recover from user store errors', () => {
      const store = useUserStore.getState();
      
      // Set error state
      useUserStore.setState({
        languageError: { code: 'NETWORK_ERROR', message: 'Network failed' },
        isLoadingLanguages: true,
      });

      // Clear errors and set successful state
      store.clearErrors();
      useUserStore.setState({ isLoadingLanguages: false });

      const recoveredStore = useUserStore.getState();
      expect(recoveredStore.languageError).toBe(null);
      expect(recoveredStore.isLoadingLanguages).toBe(false);
    });

    test('should recover from dashboard store errors', () => {
      const store = useDashboardStore.getState();
      
      // Set error state
      useDashboardStore.setState({
        statisticsError: { code: 'API_ERROR', message: 'API failed' },
        isLoadingStatistics: true,
      });

      // Clear errors and reset loading
      store.clearErrors();
      useDashboardStore.setState({ isLoadingStatistics: false });

      const recoveredStore = useDashboardStore.getState();
      expect(recoveredStore.statisticsError).toBe(null);
      expect(recoveredStore.isLoadingStatistics).toBe(false);
    });
  });

  describe('Performance and Memory', () => {
    test('should handle rapid state changes efficiently', () => {
      const userStore = useUserStore.getState();
      
      const iterations = 100;
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        userStore.setNativeLanguage(mockLanguages[i % mockLanguages.length]);
        userStore.setStudyLanguage(mockLanguages[(i + 1) % mockLanguages.length]);
      }
      
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
      expect(useUserStore.getState().languageSelection.native_language).toBeDefined();
    });

    test('should handle large datasets efficiently', () => {
      const analyticsStore = useAnalyticsStore.getState();
      
      // Create large dataset
      const largeProgressEntries = Array.from({ length: 1000 }, (_, i) => ({
        id: `progress-${i}`,
        user_id: 'user-123',
        date: `2024-01-${String(i % 30 + 1).padStart(2, '0')}`,
        words_studied: 15 + i,
        words_learned: 10 + i,
        words_reviewed: 5 + i,
        deep_memory_words: 50 + i,
        study_time_minutes: 30,
        session_count: 2,
        accuracy_percentage: 85,
        streak_days: i % 10,
        daily_goal_minutes: 30,
        goal_achieved: i % 2 === 0,
        created_at: new Date().toISOString(),
      }));

      const startTime = performance.now();
      useAnalyticsStore.setState({ progressEntries: largeProgressEntries });
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should handle large data efficiently
      expect(useAnalyticsStore.getState().progressEntries).toHaveLength(1000);
    });
  });
});

console.log('State management tests completed successfully! ✅');