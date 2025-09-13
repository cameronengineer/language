import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  ProfileState, 
  ProfileData, 
  ProfilePreferences,
  ProfileStatistics,
  LanguageChangeRequest,
  LanguageChangeConfirmation,
  ProfileUpdateRequest,
  LanguageValidationResult,
  ProfileValidationResult,
  ExportDataRequest,
  ExportDataResponse
} from '@/src/types/profile';
import { SupportedLanguage } from '@/src/types/language';
import { User } from '@/src/types/user';
import { ApiError } from '@/src/types/api';
import { api } from '@/src/services/api';
import { LanguageUtils } from '@/src/utils/constants';

interface ProfileStore extends ProfileState {
  // Actions
  loadProfile: (userId: string) => Promise<void>;
  updateProfile: (userId: string, update: ProfileUpdateRequest) => Promise<void>;
  updatePreferences: (userId: string, preferences: Partial<ProfilePreferences>) => Promise<void>;
  
  // Language management
  initiateLanguageChange: (type: 'native' | 'study', newLanguage: SupportedLanguage) => void;
  confirmLanguageChange: (userId: string) => Promise<void>;
  cancelLanguageChange: () => void;
  validateLanguageChange: (request: LanguageChangeRequest) => LanguageValidationResult;
  
  // Modal management
  showLanguageModal: (type: 'native' | 'study') => void;
  hideLanguageModal: () => void;
  showConfirmation: () => void;
  hideConfirmation: () => void;
  showSettings: () => void;
  hideSettings: () => void;
  openLogoutConfirmation: () => void;
  closeLogoutConfirmation: () => void;
  
  // Account management
  exportData: (userId: string, request: ExportDataRequest) => Promise<ExportDataResponse>;
  deleteAccount: (userId: string, password?: string) => Promise<void>;
  
  // Error handling
  clearErrors: () => void;
  clearProfileError: () => void;
  clearLanguageError: () => void;
  clearUpdateError: () => void;
  
  // Statistics
  refreshStatistics: (userId: string) => Promise<void>;
  
  // Utility actions
  reset: () => void;
}

// Default preferences
const DEFAULT_PREFERENCES: ProfilePreferences = {
  theme: 'auto',
  notifications: true,
  studyReminders: true,
  dailyGoal: 20,
  audioEnabled: true,
  privacy: {
    shareProgress: false,
    shareProfile: false,
    analyticsEnabled: true,
    marketingEmails: false,
  },
};

// Default statistics
const DEFAULT_STATISTICS: ProfileStatistics = {
  totalWordsLearned: 0,
  streakDays: 0,
  studyTimeMinutes: 0,
  lastActiveDate: new Date().toISOString(),
  joinDate: new Date().toISOString(),
  longestStreak: 0,
  averageAccuracy: 0,
  weeklyGoalProgress: 0,
};

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      // Initial state
      profileData: null,
      isLoadingProfile: false,
      isUpdatingProfile: false,
      isChangingLanguage: false,
      isDeletingAccount: false,
      showLanguageChangeModal: false,
      showConfirmationModal: false,
      showSettingsModal: false,
      showLogoutConfirmationModal: false,
      pendingLanguageChange: null,
      pendingProfileUpdate: null,
      profileError: null,
      languageChangeError: null,
      updateError: null,

      // Load complete profile data
      loadProfile: async (userId: string) => {
        try {
          set({ 
            isLoadingProfile: true, 
            profileError: null 
          });

          // Load user profile and statistics in parallel
          const [profileResponse, statisticsResponse] = await Promise.all([
            api.auth.getMe(),
            api.user.getStatistics(userId).catch(() => null), // Statistics optional
          ]);

          const user = profileResponse.data;
          const stats = statisticsResponse?.data;

          // Get language information
          const nativeLanguage = user.native_language_id 
            ? LanguageUtils.getLanguageById(user.native_language_id) || null
            : null;
          const studyLanguage = user.study_language_id 
            ? LanguageUtils.getLanguageById(user.study_language_id) || null
            : null;

          const profileData: ProfileData = {
            user: {
              id: user.id,
              name: user.first_name && user.last_name 
                ? `${user.first_name} ${user.last_name}`.trim()
                : user.username || user.email.split('@')[0],
              email: user.email,
              avatar: user.profile_picture_url || undefined,
              createdAt: user.created_at,
            },
            languages: {
              native: nativeLanguage,
              study: studyLanguage,
            },
            preferences: DEFAULT_PREFERENCES, // TODO: Load from user settings API
            statistics: stats ? {
              totalWordsLearned: stats.total_words,
              streakDays: stats.current_streak,
              studyTimeMinutes: stats.today_minutes,
              lastActiveDate: new Date().toISOString(),
              joinDate: user.created_at,
              longestStreak: stats.current_streak, // TODO: Get actual longest streak
              averageAccuracy: 0, // TODO: Calculate from practice sessions
              weeklyGoalProgress: 0, // TODO: Calculate weekly progress
            } : DEFAULT_STATISTICS,
          };

          set({
            isLoadingProfile: false,
            profileData,
          });
        } catch (error: any) {
          const apiError: ApiError = {
            code: error.code || 'LOAD_PROFILE_ERROR',
            message: error.message || 'Failed to load profile',
            details: error,
          };

          set({
            isLoadingProfile: false,
            profileError: apiError,
          });

          throw apiError;
        }
      },

      // Update profile information
      updateProfile: async (userId: string, update: ProfileUpdateRequest) => {
        try {
          set({ 
            isUpdatingProfile: true, 
            updateError: null,
            pendingProfileUpdate: update,
          });

          // Update profile via API (extend user API to support profile updates)
          const response = await api.auth.getMe(); // For now, just refresh
          const user = response.data;

          // Update local profile data
          const currentProfile = get().profileData;
          if (currentProfile) {
            const updatedProfile: ProfileData = {
              ...currentProfile,
              user: {
                ...currentProfile.user,
                ...(update.name && { name: update.name }),
              },
              preferences: {
                ...currentProfile.preferences,
                ...(update.preferences || {}),
              },
            };

            set({
              isUpdatingProfile: false,
              profileData: updatedProfile,
              pendingProfileUpdate: null,
            });
          } else {
            set({
              isUpdatingProfile: false,
              pendingProfileUpdate: null,
            });
          }
        } catch (error: any) {
          const apiError: ApiError = {
            code: error.code || 'UPDATE_PROFILE_ERROR',
            message: error.message || 'Failed to update profile',
            details: error,
          };

          set({
            isUpdatingProfile: false,
            updateError: apiError,
            pendingProfileUpdate: null,
          });

          throw apiError;
        }
      },

      // Update user preferences
      updatePreferences: async (userId: string, preferences: Partial<ProfilePreferences>) => {
        try {
          set({ 
            isUpdatingProfile: true, 
            updateError: null 
          });

          // TODO: Implement preferences API endpoint
          // For now, update locally
          const currentProfile = get().profileData;
          if (currentProfile) {
            const updatedProfile: ProfileData = {
              ...currentProfile,
              preferences: {
                ...currentProfile.preferences,
                ...preferences,
              },
            };

            set({
              isUpdatingProfile: false,
              profileData: updatedProfile,
            });
          }
        } catch (error: any) {
          const apiError: ApiError = {
            code: error.code || 'UPDATE_PREFERENCES_ERROR',
            message: error.message || 'Failed to update preferences',
            details: error,
          };

          set({
            isUpdatingProfile: false,
            updateError: apiError,
          });

          throw apiError;
        }
      },

      // Initiate language change process
      initiateLanguageChange: (type: 'native' | 'study', newLanguage: SupportedLanguage) => {
        const currentProfile = get().profileData;
        if (!currentProfile) return;

        const currentLanguage = type === 'native' 
          ? currentProfile.languages.native 
          : currentProfile.languages.study;

        const request: LanguageChangeRequest = {
          type,
          currentLanguage,
          newLanguage,
          requiresConfirmation: true,
        };

        // Validate the change
        const validation = get().validateLanguageChange(request);
        if (!validation.isValid) {
          set({
            languageChangeError: {
              code: 'VALIDATION_ERROR',
              message: validation.errors[0] || 'Invalid language selection',
              details: validation.errors,
            },
          });
          return;
        }

        set({
          pendingLanguageChange: request,
          showConfirmationModal: true,
          languageChangeError: null,
        });
      },

      // Confirm and execute language change
      confirmLanguageChange: async (userId: string) => {
        const { pendingLanguageChange } = get();
        if (!pendingLanguageChange) return;

        try {
          set({ 
            isChangingLanguage: true, 
            languageChangeError: null 
          });

          const { type, newLanguage } = pendingLanguageChange;
          const currentProfile = get().profileData;
          if (!currentProfile) throw new Error('No profile loaded');

          // Determine new language IDs
          const nativeLanguageId = type === 'native' 
            ? newLanguage.id 
            : currentProfile.languages.native?.id || '';
          const studyLanguageId = type === 'study' 
            ? newLanguage.id 
            : currentProfile.languages.study?.id || '';

          // Update via API
          const response = await api.user.updateLanguages(userId, {
            native_language_id: nativeLanguageId,
            study_language_id: studyLanguageId,
          });

          // Update local state
          const updatedProfile: ProfileData = {
            ...currentProfile,
            languages: {
              native: type === 'native' ? newLanguage : currentProfile.languages.native,
              study: type === 'study' ? newLanguage : currentProfile.languages.study,
            },
          };

          set({
            isChangingLanguage: false,
            profileData: updatedProfile,
            pendingLanguageChange: null,
            showConfirmationModal: false,
            showLanguageChangeModal: false,
          });
        } catch (error: any) {
          const apiError: ApiError = {
            code: error.code || 'LANGUAGE_CHANGE_ERROR',
            message: error.message || 'Failed to change language',
            details: error,
          };

          set({
            isChangingLanguage: false,
            languageChangeError: apiError,
          });

          throw apiError;
        }
      },

      // Cancel language change
      cancelLanguageChange: () => {
        set({
          pendingLanguageChange: null,
          showConfirmationModal: false,
          showLanguageChangeModal: false,
          languageChangeError: null,
        });
      },

      // Validate language change request
      validateLanguageChange: (request: LanguageChangeRequest): LanguageValidationResult => {
        const currentProfile = get().profileData;
        if (!currentProfile) {
          return {
            isValid: false,
            errors: ['No profile loaded'],
            warnings: [],
          };
        }

        const errors: string[] = [];
        const warnings: string[] = [];

        // Check if same language
        if (request.currentLanguage?.id === request.newLanguage.id) {
          errors.push('Please select a different language');
        }

        // Check if conflicts with other language
        const otherLanguage = request.type === 'native' 
          ? currentProfile.languages.study 
          : currentProfile.languages.native;

        if (otherLanguage && otherLanguage.id === request.newLanguage.id) {
          errors.push(`${request.newLanguage.name} is already selected as your ${request.type === 'native' ? 'study' : 'native'} language`);
        }

        // Add warnings for language changes
        if (request.currentLanguage && request.type === 'study') {
          warnings.push('Changing your study language may affect your learning progress');
        }

        return {
          isValid: errors.length === 0,
          errors,
          warnings,
        };
      },

      // Modal management
      showLanguageModal: (type: 'native' | 'study') => {
        set({ 
          showLanguageChangeModal: true,
          languageChangeError: null,
        });
      },

      hideLanguageModal: () => {
        set({ 
          showLanguageChangeModal: false,
          languageChangeError: null,
        });
      },

      showConfirmation: () => {
        set({ showConfirmationModal: true });
      },

      hideConfirmation: () => {
        set({ 
          showConfirmationModal: false,
          pendingLanguageChange: null,
        });
      },

      showSettings: () => {
        set({ showSettingsModal: true });
      },

      hideSettings: () => {
        set({ showSettingsModal: false });
      },

      openLogoutConfirmation: () => {
        set({ showLogoutConfirmationModal: true });
      },

      closeLogoutConfirmation: () => {
        set({ showLogoutConfirmationModal: false });
      },

      // Export user data
      exportData: async (userId: string, request: ExportDataRequest): Promise<ExportDataResponse> => {
        try {
          // TODO: Implement data export API
          // For now, return mock response
          return {
            downloadUrl: 'https://example.com/export.json',
            fileName: `user_data_${userId}_${Date.now()}.json`,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            fileSize: 1024 * 1024, // 1MB
          };
        } catch (error: any) {
          throw error;
        }
      },

      // Delete user account
      deleteAccount: async (userId: string, password?: string) => {
        try {
          set({ 
            isDeletingAccount: true,
            updateError: null,
          });

          // TODO: Implement account deletion API
          // For now, just simulate
          await new Promise(resolve => setTimeout(resolve, 2000));

          set({
            isDeletingAccount: false,
          });
        } catch (error: any) {
          const apiError: ApiError = {
            code: error.code || 'DELETE_ACCOUNT_ERROR',
            message: error.message || 'Failed to delete account',
            details: error,
          };

          set({
            isDeletingAccount: false,
            updateError: apiError,
          });

          throw apiError;
        }
      },

      // Refresh statistics
      refreshStatistics: async (userId: string) => {
        try {
          const response = await api.user.getStatistics(userId);
          const stats = response.data;

          const currentProfile = get().profileData;
          if (currentProfile) {
            const updatedProfile: ProfileData = {
              ...currentProfile,
              statistics: {
                ...currentProfile.statistics,
                totalWordsLearned: stats.total_words,
                streakDays: stats.current_streak,
                studyTimeMinutes: stats.today_minutes,
                lastActiveDate: new Date().toISOString(),
              },
            };

            set({ profileData: updatedProfile });
          }
        } catch (error: any) {
          console.error('Failed to refresh statistics:', error);
        }
      },

      // Error clearing
      clearErrors: () => {
        set({
          profileError: null,
          languageChangeError: null,
          updateError: null,
        });
      },

      clearProfileError: () => {
        set({ profileError: null });
      },

      clearLanguageError: () => {
        set({ languageChangeError: null });
      },

      clearUpdateError: () => {
        set({ updateError: null });
      },

      // Reset store
      reset: () => {
        set({
          profileData: null,
          isLoadingProfile: false,
          isUpdatingProfile: false,
          isChangingLanguage: false,
          isDeletingAccount: false,
          showLanguageChangeModal: false,
          showConfirmationModal: false,
          showSettingsModal: false,
          showLogoutConfirmationModal: false,
          pendingLanguageChange: null,
          pendingProfileUpdate: null,
          profileError: null,
          languageChangeError: null,
          updateError: null,
        });
      },
    }),
    {
      name: 'profile-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Persist profile data and preferences
        profileData: state.profileData,
      }),
    }
  )
);

// Convenience hooks
export const useProfile = () => {
  const store = useProfileStore();
  return {
    profileData: store.profileData,
    isLoadingProfile: store.isLoadingProfile,
    profileError: store.profileError,
  };
};

export const useProfileActions = () => {
  const store = useProfileStore();
  return {
    loadProfile: store.loadProfile,
    updateProfile: store.updateProfile,
    updatePreferences: store.updatePreferences,
    refreshStatistics: store.refreshStatistics,
    clearErrors: store.clearErrors,
    reset: store.reset,
  };
};

export const useLanguageManagement = () => {
  const store = useProfileStore();
  return {
    pendingLanguageChange: store.pendingLanguageChange,
    isChangingLanguage: store.isChangingLanguage,
    languageChangeError: store.languageChangeError,
    showLanguageChangeModal: store.showLanguageChangeModal,
    showConfirmationModal: store.showConfirmationModal,
    initiateLanguageChange: store.initiateLanguageChange,
    confirmLanguageChange: store.confirmLanguageChange,
    cancelLanguageChange: store.cancelLanguageChange,
    validateLanguageChange: store.validateLanguageChange,
    showLanguageModal: store.showLanguageModal,
    hideLanguageModal: store.hideLanguageModal,
    showConfirmation: store.showConfirmation,
    hideConfirmation: store.hideConfirmation,
    clearLanguageError: store.clearLanguageError,
  };
};

export const useProfileModals = () => {
  const store = useProfileStore();
  return {
    showLanguageChangeModal: store.showLanguageChangeModal,
    showConfirmationModal: store.showConfirmationModal,
    showSettingsModal: store.showSettingsModal,
    showLogoutConfirmationModal: store.showLogoutConfirmationModal,
    hideLanguageModal: store.hideLanguageModal,
    hideConfirmation: store.hideConfirmation,
    showSettings: store.showSettings,
    hideSettings: store.hideSettings,
    openLogoutConfirmation: store.openLogoutConfirmation,
    closeLogoutConfirmation: store.closeLogoutConfirmation,
  };
};

export const useAccountManagement = () => {
  const store = useProfileStore();
  return {
    isDeletingAccount: store.isDeletingAccount,
    exportData: store.exportData,
    deleteAccount: store.deleteAccount,
    updateError: store.updateError,
    clearUpdateError: store.clearUpdateError,
  };
};