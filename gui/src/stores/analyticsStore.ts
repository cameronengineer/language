import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  ProgressEntry,
  SessionEntry,
  LearningAnalytics,
  RetentionMetrics,
  PerformanceMetrics,
  StudyPattern,
  WordStrength,
  AnalyticsRecommendation,
  DualChartData,
  Milestone,
  Achievement,
  ReviewSchedule,
  ChartTimeRange,
  AnalyticsFilterOptions,
  AnalyticsEventType
} from '@/src/types/analytics';
import { ApiError } from '@/src/types/api';
import { analyticsEngine, ChartDataProcessor } from '@/src/services/analytics';
import { api } from '@/src/services/api';

export interface AnalyticsState {
  // === Core Data ===
  progressEntries: ProgressEntry[];
  sessionEntries: SessionEntry[];
  wordStrengths: Record<string, WordStrength>;
  milestones: Milestone[];
  achievements: Achievement[];
  
  // === Analytics Results ===
  learningAnalytics: LearningAnalytics | null;
  retentionMetrics: RetentionMetrics | null;
  performanceMetrics: PerformanceMetrics | null;
  studyPatterns: StudyPattern | null;
  recommendations: AnalyticsRecommendation[];
  
  // === Chart Data ===
  chartData: DualChartData | null;
  performanceChartData: DualChartData | null;
  currentTimeRange: ChartTimeRange;
  chartFilters: AnalyticsFilterOptions;
  
  // === UI State ===
  isLoadingAnalytics: boolean;
  isLoadingChart: boolean;
  isRefreshing: boolean;
  lastAnalyticsUpdate: string | null;
  lastChartUpdate: string | null;
  
  // === Error State ===
  analyticsError: ApiError | null;
  chartError: ApiError | null;
  
  // === Actions ===
  // Data Loading
  loadAnalyticsData: (userId: string, forceRefresh?: boolean) => Promise<void>;
  loadProgressEntries: (userId: string, timeRange?: ChartTimeRange) => Promise<void>;
  loadSessionEntries: (userId: string, timeRange?: ChartTimeRange) => Promise<void>;
  refreshAnalytics: (userId: string) => Promise<void>;
  
  // Analytics Generation
  generateLearningAnalytics: (period?: 'week' | 'month' | 'quarter' | 'year') => Promise<void>;
  generateChartData: (timeRange?: ChartTimeRange) => void;
  generatePerformanceChart: (timeRange?: ChartTimeRange) => void;
  
  // Session Tracking
  recordSession: (session: Omit<SessionEntry, 'id' | 'created_at'>) => Promise<void>;
  recordProgressEntry: (entry: Omit<ProgressEntry, 'id' | 'created_at'>) => Promise<void>;
  trackAnalyticsEvent: (eventType: AnalyticsEventType, metadata?: Record<string, any>) => void;
  
  // Word Strength & SRS
  updateWordStrength: (wordId: string, wasCorrect: boolean) => Promise<void>;
  getReviewSchedule: (userId: string) => Promise<ReviewSchedule[]>;
  
  // Milestone Tracking
  checkMilestones: () => Promise<void>;
  achieveMilestone: (milestoneId: string) => Promise<void>;
  
  // Chart Controls
  setTimeRange: (timeRange: ChartTimeRange) => void;
  updateChartFilters: (filters: Partial<AnalyticsFilterOptions>) => void;
  
  // Utility Actions
  clearAnalyticsError: () => void;
  clearChartError: () => void;
  resetAnalytics: () => void;
}

const defaultFilters: AnalyticsFilterOptions = {
  time_range: 'month',
  difficulty_levels: ['A1', 'A2', 'B1', 'B2', 'C1'],
  session_types: ['words', 'sentences'],
  include_goals: true,
  include_milestones: true
};

// Mock data generators for development
const generateMockProgressEntries = (userId: string, days: number = 30): ProgressEntry[] => {
  const entries: ProgressEntry[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const baseWords = 50 + Math.floor(Math.random() * 20);
    const studiedToday = Math.floor(Math.random() * 25) + 5;
    
    entries.push({
      id: `progress-${userId}-${date.toISOString().split('T')[0]}`,
      user_id: userId,
      date: date.toISOString().split('T')[0],
      words_studied: studiedToday,
      words_learned: Math.floor(studiedToday * 0.7),
      words_reviewed: Math.floor(studiedToday * 0.3),
      deep_memory_words: baseWords + i,
      study_time_minutes: Math.floor(Math.random() * 45) + 15,
      session_count: Math.floor(Math.random() * 3) + 1,
      accuracy_percentage: 70 + Math.floor(Math.random() * 25),
      streak_days: Math.max(0, i < 5 ? days - i : Math.floor(Math.random() * days)),
      daily_goal_minutes: 30,
      goal_achieved: Math.random() > 0.3,
      created_at: new Date().toISOString()
    });
  }
  
  return entries;
};

const generateMockSessionEntries = (userId: string, count: number = 50): SessionEntry[] => {
  const sessions: SessionEntry[] = [];
  const today = new Date();
  
  for (let i = 0; i < count; i++) {
    const sessionDate = new Date(today.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const duration = Math.floor(Math.random() * 30) + 10;
    const cardsTotal = Math.floor(Math.random() * 20) + 10;
    const cardsCorrect = Math.floor(cardsTotal * (0.6 + Math.random() * 0.3));
    
    sessions.push({
      id: `session-${userId}-${i}`,
      user_id: userId,
      catalogue_id: `catalogue-${Math.floor(Math.random() * 5) + 1}`,
      session_type: Math.random() > 0.5 ? 'words' : 'sentences',
      start_time: sessionDate.toISOString(),
      end_time: new Date(sessionDate.getTime() + duration * 60 * 1000).toISOString(),
      duration_minutes: duration,
      cards_total: cardsTotal,
      cards_correct: cardsCorrect,
      cards_incorrect: cardsTotal - cardsCorrect,
      accuracy_percentage: Math.round((cardsCorrect / cardsTotal) * 100),
      words_learned: [i * 2 + 1, i * 2 + 2],
      words_reviewed: [`word-${i}-3`, `word-${i}-4`, `word-${i}-5`],
      new_words_encountered: Math.floor(Math.random() * 5) + 1,
      review_words_practiced: Math.floor(Math.random() * 8) + 2,
      average_response_time: 2 + Math.random() * 3,
      difficulty_level: ['A1', 'A2', 'B1', 'B2', 'C1'][Math.floor(Math.random() * 5)] as any,
      created_at: sessionDate.toISOString()
    });
  }
  
  return sessions.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
};

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      // === Initial State ===
      progressEntries: [],
      sessionEntries: [],
      wordStrengths: {},
      milestones: [],
      achievements: [],
      learningAnalytics: null,
      retentionMetrics: null,
      performanceMetrics: null,
      studyPatterns: null,
      recommendations: [],
      chartData: null,
      performanceChartData: null,
      currentTimeRange: 'month',
      chartFilters: defaultFilters,
      isLoadingAnalytics: false,
      isLoadingChart: false,
      isRefreshing: false,
      lastAnalyticsUpdate: null,
      lastChartUpdate: null,
      analyticsError: null,
      chartError: null,

      // === Data Loading Actions ===
      loadAnalyticsData: async (userId: string, forceRefresh: boolean = false) => {
        const state = get();
        
        // Skip if recently loaded and not forcing refresh
        if (!forceRefresh && state.lastAnalyticsUpdate) {
          const lastUpdate = new Date(state.lastAnalyticsUpdate);
          const now = new Date();
          const timeDiff = now.getTime() - lastUpdate.getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60);
          
          if (hoursDiff < 1) return; // Don't reload if updated in last hour
        }
        
        try {
          set({ isLoadingAnalytics: true, analyticsError: null });
          
          await Promise.all([
            get().loadProgressEntries(userId),
            get().loadSessionEntries(userId)
          ]);
          
          await get().generateLearningAnalytics();
          get().generateChartData();
          
          set({ 
            isLoadingAnalytics: false,
            lastAnalyticsUpdate: new Date().toISOString()
          });
        } catch (error: any) {
          const apiError: ApiError = {
            code: error.code || 'ANALYTICS_LOAD_ERROR',
            message: error.message || 'Failed to load analytics data',
            details: error
          };
          
          set({
            isLoadingAnalytics: false,
            analyticsError: apiError
          });
          
          throw apiError;
        }
      },

      loadProgressEntries: async (userId: string, timeRange: ChartTimeRange = 'month') => {
        try {
          const response = await api.analytics.getProgressEntries(userId, timeRange);
          const entries = response.data.entries;
          
          set({ progressEntries: entries });
        } catch (error) {
          console.error('Failed to load progress entries:', error);
          // Fallback to mock data if API fails
          const entries = generateMockProgressEntries(userId, timeRange === 'week' ? 7 : 30);
          set({ progressEntries: entries });
          throw error;
        }
      },

      loadSessionEntries: async (userId: string, timeRange: ChartTimeRange = 'month') => {
        try {
          const response = await api.analytics.getSessionEntries(userId, timeRange);
          const entries = response.data.sessions;
          
          set({ sessionEntries: entries });
        } catch (error) {
          console.error('Failed to load session entries:', error);
          // Fallback to mock data if API fails
          const entries = generateMockSessionEntries(userId, 50);
          set({ sessionEntries: entries });
          throw error;
        }
      },

      refreshAnalytics: async (userId: string) => {
        try {
          set({ isRefreshing: true });
          await get().loadAnalyticsData(userId, true);
          set({ isRefreshing: false });
        } catch (error) {
          set({ isRefreshing: false });
          throw error;
        }
      },

      // === Analytics Generation ===
      generateLearningAnalytics: async (period: 'week' | 'month' | 'quarter' | 'year' = 'month') => {
        const { progressEntries, sessionEntries } = get();
        
        if (progressEntries.length === 0 || sessionEntries.length === 0) return;
        
        try {
          const analytics = analyticsEngine.generateLearningAnalytics(
            progressEntries,
            sessionEntries,
            period
          );
          
          set({
            learningAnalytics: analytics,
            recommendations: analytics.recommendations
          });
        } catch (error) {
          console.error('Failed to generate learning analytics:', error);
        }
      },

      generateChartData: (timeRange: ChartTimeRange = 'month') => {
        const { progressEntries, chartFilters } = get();
        
        if (progressEntries.length === 0) return;
        
        try {
          set({ isLoadingChart: true, chartError: null });
          
          const chartData = ChartDataProcessor.processDualChartData(
            progressEntries,
            timeRange
          );
          
          const filteredData = ChartDataProcessor.applyFilters(chartData, chartFilters);
          
          set({
            chartData: filteredData,
            currentTimeRange: timeRange,
            isLoadingChart: false,
            lastChartUpdate: new Date().toISOString()
          });
        } catch (error: any) {
          const apiError: ApiError = {
            code: 'CHART_GENERATION_ERROR',
            message: 'Failed to generate chart data',
            details: error
          };
          
          set({
            isLoadingChart: false,
            chartError: apiError
          });
        }
      },

      generatePerformanceChart: (timeRange: ChartTimeRange = 'month') => {
        const { sessionEntries } = get();
        
        if (sessionEntries.length === 0) return;
        
        try {
          const performanceData = ChartDataProcessor.processPerformanceChart(
            sessionEntries,
            timeRange
          );
          
          set({ performanceChartData: performanceData });
        } catch (error) {
          console.error('Failed to generate performance chart:', error);
        }
      },

      // === Session Tracking ===
      recordSession: async (session: Omit<SessionEntry, 'id' | 'created_at'>) => {
        try {
          const response = await api.analytics.recordSession(session.user_id, session);
          const newSession = response.data;
          
          set(state => ({
            sessionEntries: [newSession, ...state.sessionEntries]
          }));
          
          // Trigger analytics regeneration
          await get().generateLearningAnalytics();
          get().generatePerformanceChart();
        } catch (error) {
          console.error('Failed to record session:', error);
          
          // Fallback: store locally if API fails
          const newSession: SessionEntry = {
            ...session,
            id: `session-${Date.now()}`,
            created_at: new Date().toISOString()
          };
          
          set(state => ({
            sessionEntries: [newSession, ...state.sessionEntries]
          }));
          
          throw error;
        }
      },

      recordProgressEntry: async (entry: Omit<ProgressEntry, 'id' | 'created_at'>) => {
        try {
          const response = await api.analytics.recordProgressEntry(entry.user_id, entry);
          const newEntry = response.data;
          
          set(state => ({
            progressEntries: [newEntry, ...state.progressEntries.filter(e => e.date !== entry.date)]
          }));
          
          // Regenerate chart data
          get().generateChartData(get().currentTimeRange);
        } catch (error) {
          console.error('Failed to record progress entry:', error);
          
          // Fallback: store locally if API fails
          const newEntry: ProgressEntry = {
            ...entry,
            id: `progress-${Date.now()}`,
            created_at: new Date().toISOString()
          };
          
          set(state => ({
            progressEntries: [newEntry, ...state.progressEntries.filter(e => e.date !== entry.date)]
          }));
          
          throw error;
        }
      },

      trackAnalyticsEvent: async (eventType: AnalyticsEventType, metadata?: Record<string, any>) => {
        try {
          const { progressEntries } = get();
          if (progressEntries.length > 0) {
            await api.analytics.trackEvent(progressEntries[0].user_id, eventType, metadata);
          }
        } catch (error) {
          console.error('Failed to track analytics event:', error);
          // Don't throw - event tracking failures shouldn't break the app
        }
      },

      // === Word Strength & SRS ===
      updateWordStrength: async (wordId: string, wasCorrect: boolean) => {
        const { wordStrengths } = get();
        const currentStrength = wordStrengths[wordId];
        
        if (!currentStrength) {
          console.warn('Word strength not found for word:', wordId);
          return;
        }
        
        try {
          const reviewSchedule = analyticsEngine.calculateNextReview(currentStrength, wasCorrect);
          
          const updatedStrength: WordStrength = {
            ...currentStrength,
            strength: wasCorrect ? 
              Math.min(1, currentStrength.strength + 0.1) : 
              Math.max(0, currentStrength.strength - 0.2),
            consecutive_correct: wasCorrect ? currentStrength.consecutive_correct + 1 : 0,
            consecutive_incorrect: wasCorrect ? 0 : currentStrength.consecutive_incorrect + 1,
            last_reviewed: new Date().toISOString(),
            next_review: reviewSchedule.next_review,
            review_count: currentStrength.review_count + 1,
            interval_days: reviewSchedule.current_interval,
            updated_at: new Date().toISOString()
          };
          
          set(state => ({
            wordStrengths: {
              ...state.wordStrengths,
              [wordId]: updatedStrength
            }
          }));
          
          // Sync with API
          try {
            await api.analytics.updateWordStrength(currentStrength.user_id, wordId, updatedStrength);
          } catch (error) {
            console.error('Failed to sync word strength with API:', error);
            // Continue with local update even if API sync fails
          }
        } catch (error) {
          console.error('Failed to update word strength:', error);
          throw error;
        }
      },

      getReviewSchedule: async (userId: string): Promise<ReviewSchedule[]> => {
        try {
          const response = await api.analytics.getReviewSchedule(userId, 50);
          return response.data.schedule;
        } catch (error) {
          console.error('Failed to load review schedule:', error);
          
          // Fallback to local calculation
          const { wordStrengths } = get();
          const schedules: ReviewSchedule[] = Object.values(wordStrengths)
            .filter(word => new Date(word.next_review) <= new Date())
            .map(word => analyticsEngine.calculateNextReview(word, true))
            .sort((a, b) => a.priority === b.priority ? 0 : a.priority === 'high' ? -1 : 1);
          
          return schedules;
        }
      },

      // === Milestone Tracking ===
      checkMilestones: async () => {
        const { progressEntries, milestones } = get();
        
        if (progressEntries.length === 0) return;
        
        const latestProgress = progressEntries[0];
        const updatedMilestones = milestones.map(milestone => {
          let currentValue = 0;
          
          switch (milestone.type) {
            case 'streak':
              currentValue = latestProgress.streak_days;
              break;
            case 'words_learned':
              currentValue = latestProgress.deep_memory_words;
              break;
            case 'time_studied':
              currentValue = progressEntries.reduce((sum, entry) => sum + entry.study_time_minutes, 0);
              break;
            case 'accuracy':
              currentValue = latestProgress.accuracy_percentage;
              break;
          }
          
          const progress = Math.min(100, (currentValue / milestone.target_value) * 100);
          const completed = progress >= 100 && !milestone.completed;
          
          if (completed) {
            get().achieveMilestone(milestone.id);
          }
          
          return {
            ...milestone,
            current_value: currentValue,
            progress_percentage: progress,
            completed
          };
        });
        
        set({ milestones: updatedMilestones });
      },

      achieveMilestone: async (milestoneId: string) => {
        try {
          const achievement: Achievement = {
            id: `achievement-${Date.now()}`,
            user_id: '', // Will be set when we have user context
            milestone_id: milestoneId,
            achieved_at: new Date().toISOString(),
            value_achieved: 0, // Will be set based on milestone
            celebration_shown: false,
            shared: false
          };
          
          set(state => ({
            achievements: [achievement, ...state.achievements]
          }));
          
          await get().trackAnalyticsEvent('milestone_achieved', { milestoneId });
        } catch (error) {
          console.error('Failed to record milestone achievement:', error);
        }
      },

      // === Chart Controls ===
      setTimeRange: (timeRange: ChartTimeRange) => {
        set({ currentTimeRange: timeRange });
        get().generateChartData(timeRange);
        get().generatePerformanceChart(timeRange);
      },

      updateChartFilters: (filters: Partial<AnalyticsFilterOptions>) => {
        const newFilters = { ...get().chartFilters, ...filters };
        set({ chartFilters: newFilters });
        
        if (get().chartData) {
          const filteredData = ChartDataProcessor.applyFilters(get().chartData!, newFilters);
          set({ chartData: filteredData });
        }
      },

      // === Utility Actions ===
      clearAnalyticsError: () => set({ analyticsError: null }),
      clearChartError: () => set({ chartError: null }),
      
      resetAnalytics: () => set({
        progressEntries: [],
        sessionEntries: [],
        wordStrengths: {},
        milestones: [],
        achievements: [],
        learningAnalytics: null,
        retentionMetrics: null,
        performanceMetrics: null,
        studyPatterns: null,
        recommendations: [],
        chartData: null,
        performanceChartData: null,
        currentTimeRange: 'month',
        chartFilters: defaultFilters,
        isLoadingAnalytics: false,
        isLoadingChart: false,
        isRefreshing: false,
        lastAnalyticsUpdate: null,
        lastChartUpdate: null,
        analyticsError: null,
        chartError: null
      })
    }),
    {
      name: 'analytics-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Persist only essential data, not loading states
        progressEntries: state.progressEntries.slice(0, 100), // Limit stored entries
        sessionEntries: state.sessionEntries.slice(0, 200),
        wordStrengths: state.wordStrengths,
        achievements: state.achievements,
        currentTimeRange: state.currentTimeRange,
        chartFilters: state.chartFilters,
        lastAnalyticsUpdate: state.lastAnalyticsUpdate
      })
    }
  )
);

// === Convenience Hooks ===

export const useAnalyticsData = () => {
  const store = useAnalyticsStore();
  return {
    progressEntries: store.progressEntries,
    sessionEntries: store.sessionEntries,
    learningAnalytics: store.learningAnalytics,
    recommendations: store.recommendations,
    isLoading: store.isLoadingAnalytics,
    error: store.analyticsError,
    lastUpdate: store.lastAnalyticsUpdate
  };
};

export const useChartData = () => {
  const store = useAnalyticsStore();
  return {
    chartData: store.chartData,
    performanceChartData: store.performanceChartData,
    currentTimeRange: store.currentTimeRange,
    filters: store.chartFilters,
    isLoading: store.isLoadingChart,
    error: store.chartError,
    setTimeRange: store.setTimeRange,
    updateFilters: store.updateChartFilters
  };
};

export const useProgressTracking = () => {
  const store = useAnalyticsStore();
  return {
    recordSession: store.recordSession,
    recordProgressEntry: store.recordProgressEntry,
    trackEvent: store.trackAnalyticsEvent,
    updateWordStrength: store.updateWordStrength,
    checkMilestones: store.checkMilestones
  };
};

export const useAnalyticsActions = () => {
  const store = useAnalyticsStore();
  return {
    loadAnalyticsData: store.loadAnalyticsData,
    refreshAnalytics: store.refreshAnalytics,
    generateChartData: store.generateChartData,
    clearErrors: () => {
      store.clearAnalyticsError();
      store.clearChartError();
    },
    resetAnalytics: store.resetAnalytics
  };
};