import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiError } from '@/src/types/api';
import { UserProgress, DailyProgress } from '@/src/types/user';
import { api } from '@/src/services/api';

export interface DashboardStatistics {
  total_words: number;
  words_in_deep_memory: number;
  current_streak: number;
  today_minutes: number;
  weekly_progress: DailyProgress[];
}

export interface DashboardState {
  // Data
  statistics: DashboardStatistics | null;
  hasWords: boolean | null;
  lastRefreshTime: string | null;
  
  // Loading states
  isLoadingStatistics: boolean;
  isLoadingHasWords: boolean;
  isRefreshing: boolean;
  
  // Error states
  statisticsError: ApiError | null;
  hasWordsError: ApiError | null;
  
  // Actions
  loadDashboardData: (userId: string) => Promise<void>;
  loadStatistics: (userId: string) => Promise<void>;
  checkHasWords: (userId: string) => Promise<void>;
  refreshDashboard: (userId: string) => Promise<void>;
  clearErrors: () => void;
  resetDashboard: () => void;
}

const generateMockStatistics = (): DashboardStatistics => {
  const today = new Date();
  const weeklyProgress = [];
  
  // Generate last 7 days of mock data
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    weeklyProgress.push({
      date: date.toISOString().split('T')[0],
      words_learned: Math.floor(Math.random() * 20) + 5,
      minutes_studied: Math.floor(Math.random() * 45) + 15,
    });
  }
  
  return {
    total_words: Math.floor(Math.random() * 1000) + 500,
    words_in_deep_memory: Math.floor(Math.random() * 200) + 100,
    current_streak: Math.floor(Math.random() * 30) + 1,
    today_minutes: Math.floor(Math.random() * 60) + 10,
    weekly_progress: weeklyProgress,
  };
};

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      // Initial state
      statistics: null,
      hasWords: null,
      lastRefreshTime: null,
      isLoadingStatistics: false,
      isLoadingHasWords: false,
      isRefreshing: false,
      statisticsError: null,
      hasWordsError: null,

      // Load all dashboard data
      loadDashboardData: async (userId: string) => {
        await Promise.all([
          get().loadStatistics(userId),
          get().checkHasWords(userId),
        ]);
      },

      // Load user statistics
      loadStatistics: async (userId: string) => {
        try {
          set({ 
            isLoadingStatistics: true, 
            statisticsError: null 
          });

          // For now, use mock data since backend endpoints might not be fully implemented
          // TODO: Replace with real API call when backend is ready
          // const response = await api.user.getProgress(userId);
          // const statistics = response.data.progress;
          
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          const statistics = generateMockStatistics();

          set({
            isLoadingStatistics: false,
            statistics,
            lastRefreshTime: new Date().toISOString(),
          });
        } catch (error: any) {
          const apiError: ApiError = {
            code: error.code || 'LOAD_STATISTICS_ERROR',
            message: error.message || 'Failed to load dashboard statistics',
            details: error,
          };

          set({
            isLoadingStatistics: false,
            statisticsError: apiError,
          });

          throw apiError;
        }
      },

      // Check if user has any words
      checkHasWords: async (userId: string) => {
        try {
          set({ 
            isLoadingHasWords: true, 
            hasWordsError: null 
          });

          // For now, use mock data
          // TODO: Replace with real API call
          // const response = await api.user.getTranslationCount(userId);
          // const hasWords = response.data.count > 0;
          
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 500));
          const hasWords = Math.random() > 0.3; // 70% chance user has words

          set({
            isLoadingHasWords: false,
            hasWords,
          });
        } catch (error: any) {
          const apiError: ApiError = {
            code: error.code || 'CHECK_WORDS_ERROR',
            message: error.message || 'Failed to check user vocabulary',
            details: error,
          };

          set({
            isLoadingHasWords: false,
            hasWordsError: apiError,
          });

          throw apiError;
        }
      },

      // Refresh dashboard data
      refreshDashboard: async (userId: string) => {
        try {
          set({ 
            isRefreshing: true,
            statisticsError: null,
            hasWordsError: null,
          });

          await get().loadDashboardData(userId);

          set({
            isRefreshing: false,
            lastRefreshTime: new Date().toISOString(),
          });
        } catch (error) {
          set({ isRefreshing: false });
          throw error;
        }
      },

      // Clear all errors
      clearErrors: () => {
        set({
          statisticsError: null,
          hasWordsError: null,
        });
      },

      // Reset dashboard state
      resetDashboard: () => {
        set({
          statistics: null,
          hasWords: null,
          lastRefreshTime: null,
          isLoadingStatistics: false,
          isLoadingHasWords: false,
          isRefreshing: false,
          statisticsError: null,
          hasWordsError: null,
        });
      },
    }),
    {
      name: 'dashboard-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Persist only data, not loading states
        statistics: state.statistics,
        hasWords: state.hasWords,
        lastRefreshTime: state.lastRefreshTime,
      }),
    }
  )
);

// Convenience hooks for specific dashboard state
export const useDashboardStatistics = () => {
  const dashboard = useDashboardStore();
  return {
    statistics: dashboard.statistics,
    isLoadingStatistics: dashboard.isLoadingStatistics,
    statisticsError: dashboard.statisticsError,
    lastRefreshTime: dashboard.lastRefreshTime,
  };
};

export const useDashboardHasWords = () => {
  const dashboard = useDashboardStore();
  return {
    hasWords: dashboard.hasWords,
    isLoadingHasWords: dashboard.isLoadingHasWords,
    hasWordsError: dashboard.hasWordsError,
  };
};

export const useDashboardActions = () => {
  const dashboard = useDashboardStore();
  return {
    loadDashboardData: dashboard.loadDashboardData,
    loadStatistics: dashboard.loadStatistics,
    checkHasWords: dashboard.checkHasWords,
    refreshDashboard: dashboard.refreshDashboard,
    clearErrors: dashboard.clearErrors,
    resetDashboard: dashboard.resetDashboard,
  };
};