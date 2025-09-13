import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, LanguageSelectionState } from '@/src/types/language';
import { User, UserProgress } from '@/src/types/user';
import { ApiError } from '@/src/types/api';
import { api } from '@/src/services/api';

interface UserState {
  // Language selection state
  languageSelection: LanguageSelectionState;
  
  // User progress
  progress: UserProgress | null;
  
  // Loading states
  isLoadingLanguages: boolean;
  isLoadingProgress: boolean;
  isUpdatingLanguages: boolean;
  
  // Error states
  languageError: ApiError | null;
  progressError: ApiError | null;
  
  // Actions
  loadLanguages: () => Promise<void>;
  setNativeLanguage: (language: Language) => void;
  setStudyLanguage: (language: Language) => void;
  updateUserLanguages: (userId: string, nativeLanguageId: string, studyLanguageId: string) => Promise<User>;
  loadUserProgress: (userId: string) => Promise<void>;
  clearLanguageSelection: () => void;
  clearErrors: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial state
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

      // Load available languages
      loadLanguages: async () => {
        try {
          set({ 
            isLoadingLanguages: true, 
            languageError: null,
            languageSelection: {
              ...get().languageSelection,
              is_loading: true,
              error: null,
            }
          });

          const response = await api.language.getLanguages();
          const languages = response.data.languages;

          set({
            isLoadingLanguages: false,
            languageSelection: {
              ...get().languageSelection,
              available_languages: languages,
              is_loading: false,
              error: null,
            },
          });
        } catch (error: any) {
          const apiError: ApiError = {
            code: error.code || 'LOAD_LANGUAGES_ERROR',
            message: error.message || 'Failed to load languages',
            details: error,
          };

          set({
            isLoadingLanguages: false,
            languageError: apiError,
            languageSelection: {
              ...get().languageSelection,
              is_loading: false,
              error: error.message || 'Failed to load languages',
            },
          });

          throw apiError;
        }
      },

      // Set native language selection
      setNativeLanguage: (language: Language) => {
        set({
          languageSelection: {
            ...get().languageSelection,
            native_language: language,
          },
        });
      },

      // Set study language selection
      setStudyLanguage: (language: Language) => {
        const currentSelection = get().languageSelection;
        
        // Ensure study language is different from native language
        if (currentSelection.native_language?.id === language.id) {
          throw new Error('Study language must be different from native language');
        }

        set({
          languageSelection: {
            ...currentSelection,
            study_language: language,
          },
        });
      },

      // Update user language preferences on backend
      updateUserLanguages: async (userId: string, nativeLanguageId: string, studyLanguageId: string) => {
        try {
          set({ 
            isUpdatingLanguages: true, 
            languageError: null 
          });

          const response = await api.user.updateLanguages(userId, {
            native_language_id: nativeLanguageId,
            study_language_id: studyLanguageId,
          });

          const updatedUser = response.data;

          set({
            isUpdatingLanguages: false,
          });

          return updatedUser;
        } catch (error: any) {
          const apiError: ApiError = {
            code: error.code || 'UPDATE_LANGUAGES_ERROR',
            message: error.message || 'Failed to update language preferences',
            details: error,
          };

          set({
            isUpdatingLanguages: false,
            languageError: apiError,
          });

          throw apiError;
        }
      },

      // Load user progress statistics
      loadUserProgress: async (userId: string) => {
        try {
          set({ 
            isLoadingProgress: true, 
            progressError: null 
          });

          const response = await api.user.getProgress(userId);
          const progressData = response.data.progress;

          set({
            isLoadingProgress: false,
            progress: progressData,
          });
        } catch (error: any) {
          const apiError: ApiError = {
            code: error.code || 'LOAD_PROGRESS_ERROR',
            message: error.message || 'Failed to load user progress',
            details: error,
          };

          set({
            isLoadingProgress: false,
            progressError: apiError,
          });

          throw apiError;
        }
      },

      // Clear language selection
      clearLanguageSelection: () => {
        set({
          languageSelection: {
            native_language: null,
            study_language: null,
            available_languages: get().languageSelection.available_languages,
            is_loading: false,
            error: null,
          },
        });
      },

      // Clear all errors
      clearErrors: () => {
        set({
          languageError: null,
          progressError: null,
          languageSelection: {
            ...get().languageSelection,
            error: null,
          },
        });
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Persist language selection and progress
        languageSelection: {
          native_language: state.languageSelection.native_language,
          study_language: state.languageSelection.study_language,
          available_languages: state.languageSelection.available_languages,
          is_loading: false,
          error: null,
        },
        progress: state.progress,
      }),
    }
  )
);

// Convenience hooks for specific user state
export const useLanguageSelection = () => {
  const userStore = useUserStore();
  return {
    languageSelection: userStore.languageSelection,
    isLoadingLanguages: userStore.isLoadingLanguages,
    isUpdatingLanguages: userStore.isUpdatingLanguages,
    languageError: userStore.languageError,
  };
};

export const useUserProgress = () => {
  const userStore = useUserStore();
  return {
    progress: userStore.progress,
    isLoadingProgress: userStore.isLoadingProgress,
    progressError: userStore.progressError,
  };
};

export const useUserActions = () => {
  const userStore = useUserStore();
  return {
    loadLanguages: userStore.loadLanguages,
    setNativeLanguage: userStore.setNativeLanguage,
    setStudyLanguage: userStore.setStudyLanguage,
    updateUserLanguages: userStore.updateUserLanguages,
    loadUserProgress: userStore.loadUserProgress,
    clearLanguageSelection: userStore.clearLanguageSelection,
    clearErrors: userStore.clearErrors,
  };
};