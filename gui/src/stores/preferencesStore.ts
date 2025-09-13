import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SupportedLanguage } from '@/src/types/language';
import { 
  preferenceStorage, 
  UserPreferences,
  getPreferences,
  saveLanguagePreferences,
  markOnboardingCompleted,
  isOnboardingCompleted,
  getLanguagePreferences,
} from '@/src/services/storage/preferenceStorage';

interface PreferencesState {
  // Current preferences
  preferences: UserPreferences | null;
  
  // Loading states
  isLoadingPreferences: boolean;
  isSavingPreferences: boolean;
  
  // Error states
  preferencesError: string | null;
  
  // Actions
  loadPreferences: () => Promise<void>;
  updateLanguagePreferences: (native: SupportedLanguage, study: SupportedLanguage) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  skipOnboarding: () => Promise<void>;
  updateAppSettings: (settings: Partial<UserPreferences['app']>) => Promise<void>;
  updateLearningSettings: (settings: Partial<UserPreferences['learning']>) => Promise<void>;
  checkOnboardingStatus: () => Promise<boolean>;
  clearPreferences: () => Promise<void>;
  exportPreferences: () => Promise<string>;
  importPreferences: (data: string) => Promise<void>;
  clearError: () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      // Initial state
      preferences: null,
      isLoadingPreferences: false,
      isSavingPreferences: false,
      preferencesError: null,

      // Load all preferences
      loadPreferences: async () => {
        try {
          set({ 
            isLoadingPreferences: true, 
            preferencesError: null 
          });

          const preferences = await getPreferences();
          
          set({
            preferences,
            isLoadingPreferences: false,
          });
        } catch (error: any) {
          console.error('Failed to load preferences:', error);
          set({
            isLoadingPreferences: false,
            preferencesError: error.message || 'Failed to load preferences',
          });
          throw error;
        }
      },

      // Update language preferences
      updateLanguagePreferences: async (native: SupportedLanguage, study: SupportedLanguage) => {
        try {
          set({ 
            isSavingPreferences: true, 
            preferencesError: null 
          });

          await saveLanguagePreferences(native, study);
          
          // Reload preferences to get updated data
          const updatedPreferences = await getPreferences();
          
          set({
            preferences: updatedPreferences,
            isSavingPreferences: false,
          });
        } catch (error: any) {
          console.error('Failed to update language preferences:', error);
          set({
            isSavingPreferences: false,
            preferencesError: error.message || 'Failed to update language preferences',
          });
          throw error;
        }
      },

      // Complete onboarding
      completeOnboarding: async () => {
        try {
          set({ 
            isSavingPreferences: true, 
            preferencesError: null 
          });

          await markOnboardingCompleted();
          
          // Reload preferences
          const updatedPreferences = await getPreferences();
          
          set({
            preferences: updatedPreferences,
            isSavingPreferences: false,
          });
        } catch (error: any) {
          console.error('Failed to complete onboarding:', error);
          set({
            isSavingPreferences: false,
            preferencesError: error.message || 'Failed to complete onboarding',
          });
          throw error;
        }
      },

      // Skip onboarding
      skipOnboarding: async () => {
        try {
          set({ 
            isSavingPreferences: true, 
            preferencesError: null 
          });

          await preferenceStorage.markOnboardingSkipped();
          
          // Reload preferences
          const updatedPreferences = await getPreferences();
          
          set({
            preferences: updatedPreferences,
            isSavingPreferences: false,
          });
        } catch (error: any) {
          console.error('Failed to skip onboarding:', error);
          set({
            isSavingPreferences: false,
            preferencesError: error.message || 'Failed to skip onboarding',
          });
          throw error;
        }
      },

      // Update app settings
      updateAppSettings: async (settings: Partial<UserPreferences['app']>) => {
        try {
          set({ 
            isSavingPreferences: true, 
            preferencesError: null 
          });

          await preferenceStorage.updateAppSettings(settings);
          
          // Reload preferences
          const updatedPreferences = await getPreferences();
          
          set({
            preferences: updatedPreferences,
            isSavingPreferences: false,
          });
        } catch (error: any) {
          console.error('Failed to update app settings:', error);
          set({
            isSavingPreferences: false,
            preferencesError: error.message || 'Failed to update app settings',
          });
          throw error;
        }
      },

      // Update learning settings
      updateLearningSettings: async (settings: Partial<UserPreferences['learning']>) => {
        try {
          set({ 
            isSavingPreferences: true, 
            preferencesError: null 
          });

          await preferenceStorage.updateLearningSettings(settings);
          
          // Reload preferences
          const updatedPreferences = await getPreferences();
          
          set({
            preferences: updatedPreferences,
            isSavingPreferences: false,
          });
        } catch (error: any) {
          console.error('Failed to update learning settings:', error);
          set({
            isSavingPreferences: false,
            preferencesError: error.message || 'Failed to update learning settings',
          });
          throw error;
        }
      },

      // Check onboarding status
      checkOnboardingStatus: async () => {
        try {
          const completed = await isOnboardingCompleted();
          return completed;
        } catch (error: any) {
          console.error('Failed to check onboarding status:', error);
          return false;
        }
      },

      // Clear all preferences
      clearPreferences: async () => {
        try {
          set({ 
            isSavingPreferences: true, 
            preferencesError: null 
          });

          await preferenceStorage.clearPreferences();
          
          set({
            preferences: null,
            isSavingPreferences: false,
          });
        } catch (error: any) {
          console.error('Failed to clear preferences:', error);
          set({
            isSavingPreferences: false,
            preferencesError: error.message || 'Failed to clear preferences',
          });
          throw error;
        }
      },

      // Export preferences
      exportPreferences: async () => {
        try {
          return await preferenceStorage.exportPreferences();
        } catch (error: any) {
          console.error('Failed to export preferences:', error);
          set({
            preferencesError: error.message || 'Failed to export preferences',
          });
          throw error;
        }
      },

      // Import preferences
      importPreferences: async (data: string) => {
        try {
          set({ 
            isSavingPreferences: true, 
            preferencesError: null 
          });

          await preferenceStorage.importPreferences(data);
          
          // Reload preferences
          const updatedPreferences = await getPreferences();
          
          set({
            preferences: updatedPreferences,
            isSavingPreferences: false,
          });
        } catch (error: any) {
          console.error('Failed to import preferences:', error);
          set({
            isSavingPreferences: false,
            preferencesError: error.message || 'Failed to import preferences',
          });
          throw error;
        }
      },

      // Clear error state
      clearError: () => {
        set({ preferencesError: null });
      },
    }),
    {
      name: 'preferences-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist basic preference data, not loading states
        preferences: state.preferences,
      }),
    }
  )
);

// Convenience hooks for specific preference areas
export const useLanguagePreferences = () => {
  const preferencesStore = usePreferencesStore();
  return {
    languagePreferences: preferencesStore.preferences?.language || null,
    isLoadingPreferences: preferencesStore.isLoadingPreferences,
    isSavingPreferences: preferencesStore.isSavingPreferences,
    preferencesError: preferencesStore.preferencesError,
  };
};

export const useOnboardingPreferences = () => {
  const preferencesStore = usePreferencesStore();
  return {
    onboardingPreferences: preferencesStore.preferences?.onboarding || null,
    isOnboardingCompleted: preferencesStore.preferences?.onboarding?.completed || false,
    isLoadingPreferences: preferencesStore.isLoadingPreferences,
    isSavingPreferences: preferencesStore.isSavingPreferences,
  };
};

export const useAppSettings = () => {
  const preferencesStore = usePreferencesStore();
  return {
    appSettings: preferencesStore.preferences?.app || null,
    isLoadingPreferences: preferencesStore.isLoadingPreferences,
    isSavingPreferences: preferencesStore.isSavingPreferences,
  };
};

export const useLearningSettings = () => {
  const preferencesStore = usePreferencesStore();
  return {
    learningSettings: preferencesStore.preferences?.learning || null,
    isLoadingPreferences: preferencesStore.isLoadingPreferences,
    isSavingPreferences: preferencesStore.isSavingPreferences,
  };
};

export const usePreferencesActions = () => {
  const preferencesStore = usePreferencesStore();
  return {
    loadPreferences: preferencesStore.loadPreferences,
    updateLanguagePreferences: preferencesStore.updateLanguagePreferences,
    completeOnboarding: preferencesStore.completeOnboarding,
    skipOnboarding: preferencesStore.skipOnboarding,
    updateAppSettings: preferencesStore.updateAppSettings,
    updateLearningSettings: preferencesStore.updateLearningSettings,
    checkOnboardingStatus: preferencesStore.checkOnboardingStatus,
    clearPreferences: preferencesStore.clearPreferences,
    exportPreferences: preferencesStore.exportPreferences,
    importPreferences: preferencesStore.importPreferences,
    clearError: preferencesStore.clearError,
  };
};