import AsyncStorage from '@react-native-async-storage/async-storage';
import { SupportedLanguage, LanguagePreferences } from '@/src/types/language';
import { STORAGE_KEYS } from '@/src/utils/constants';

export interface UserPreferences {
  // Language Settings
  language: LanguagePreferences;
  
  // Onboarding State
  onboarding: {
    completed: boolean;
    completedAt: string | null;
    version: string; // For handling onboarding updates
    skipped: boolean;
  };
  
  // App Settings
  app: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    audio: boolean;
    hapticFeedback: boolean;
    dailyGoal: number;
  };
  
  // Learning Preferences
  learning: {
    practiceReminders: boolean;
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
    sessionLength: number; // minutes
    autoPlayAudio: boolean;
  };
  
  // Metadata
  lastUpdated: string;
  version: string;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  language: {
    native_language: null,
    study_language: null,
    onboarding_completed: false,
    last_updated: new Date().toISOString(),
  },
  onboarding: {
    completed: false,
    completedAt: null,
    version: '1.0.0',
    skipped: false,
  },
  app: {
    theme: 'system',
    notifications: true,
    audio: true,
    hapticFeedback: true,
    dailyGoal: 20, // words per day
  },
  learning: {
    practiceReminders: true,
    difficultyLevel: 'beginner',
    sessionLength: 15,
    autoPlayAudio: true,
  },
  lastUpdated: new Date().toISOString(),
  version: '1.0.0',
};

class PreferenceStorage {
  private static instance: PreferenceStorage;
  private cachedPreferences: UserPreferences | null = null;

  private constructor() {}

  static getInstance(): PreferenceStorage {
    if (!PreferenceStorage.instance) {
      PreferenceStorage.instance = new PreferenceStorage();
    }
    return PreferenceStorage.instance;
  }

  /**
   * Get all user preferences
   */
  async getPreferences(): Promise<UserPreferences> {
    try {
      if (this.cachedPreferences) {
        return this.cachedPreferences;
      }

      const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      if (stored) {
        const preferences = JSON.parse(stored) as UserPreferences;
        // Merge with defaults to handle missing fields in older versions
        this.cachedPreferences = this.mergeWithDefaults(preferences);
        return this.cachedPreferences;
      }

      this.cachedPreferences = { ...DEFAULT_PREFERENCES };
      await this.savePreferences(this.cachedPreferences);
      return this.cachedPreferences;
    } catch (error) {
      console.error('Failed to get preferences:', error);
      return { ...DEFAULT_PREFERENCES };
    }
  }

  /**
   * Save all user preferences
   */
  async savePreferences(preferences: UserPreferences): Promise<void> {
    try {
      const updatedPreferences = {
        ...preferences,
        lastUpdated: new Date().toISOString(),
      };

      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PREFERENCES,
        JSON.stringify(updatedPreferences)
      );

      this.cachedPreferences = updatedPreferences;
    } catch (error) {
      console.error('Failed to save preferences:', error);
      throw new Error('Failed to save preferences');
    }
  }

  /**
   * Update language preferences
   */
  async updateLanguagePreferences(
    nativeLanguage: SupportedLanguage,
    studyLanguage: SupportedLanguage
  ): Promise<void> {
    const preferences = await this.getPreferences();
    preferences.language = {
      native_language: nativeLanguage,
      study_language: studyLanguage,
      onboarding_completed: true,
      last_updated: new Date().toISOString(),
    };
    await this.savePreferences(preferences);
  }

  /**
   * Mark onboarding as completed
   */
  async markOnboardingCompleted(): Promise<void> {
    const preferences = await this.getPreferences();
    preferences.onboarding = {
      completed: true,
      completedAt: new Date().toISOString(),
      version: '1.0.0',
      skipped: false,
    };
    preferences.language.onboarding_completed = true;
    await this.savePreferences(preferences);
  }

  /**
   * Mark onboarding as skipped
   */
  async markOnboardingSkipped(): Promise<void> {
    const preferences = await this.getPreferences();
    preferences.onboarding = {
      completed: true,
      completedAt: new Date().toISOString(),
      version: '1.0.0',
      skipped: true,
    };
    await this.savePreferences(preferences);
  }

  /**
   * Update app settings
   */
  async updateAppSettings(settings: Partial<UserPreferences['app']>): Promise<void> {
    const preferences = await this.getPreferences();
    preferences.app = { ...preferences.app, ...settings };
    await this.savePreferences(preferences);
  }

  /**
   * Update learning preferences
   */
  async updateLearningSettings(settings: Partial<UserPreferences['learning']>): Promise<void> {
    const preferences = await this.getPreferences();
    preferences.learning = { ...preferences.learning, ...settings };
    await this.savePreferences(preferences);
  }

  /**
   * Check if onboarding is completed
   */
  async isOnboardingCompleted(): Promise<boolean> {
    const preferences = await this.getPreferences();
    return preferences.onboarding.completed && preferences.language.onboarding_completed;
  }

  /**
   * Get language preferences
   */
  async getLanguagePreferences(): Promise<LanguagePreferences> {
    const preferences = await this.getPreferences();
    return preferences.language;
  }

  /**
   * Clear all preferences (reset to defaults)
   */
  async clearPreferences(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_PREFERENCES);
      this.cachedPreferences = null;
    } catch (error) {
      console.error('Failed to clear preferences:', error);
      throw new Error('Failed to clear preferences');
    }
  }

  /**
   * Export preferences for backup
   */
  async exportPreferences(): Promise<string> {
    const preferences = await this.getPreferences();
    return JSON.stringify(preferences, null, 2);
  }

  /**
   * Import preferences from backup
   */
  async importPreferences(data: string): Promise<void> {
    try {
      const preferences = JSON.parse(data) as UserPreferences;
      const mergedPreferences = this.mergeWithDefaults(preferences);
      await this.savePreferences(mergedPreferences);
    } catch (error) {
      console.error('Failed to import preferences:', error);
      throw new Error('Invalid preferences data');
    }
  }

  /**
   * Merge preferences with defaults (for version compatibility)
   */
  private mergeWithDefaults(preferences: Partial<UserPreferences>): UserPreferences {
    return {
      language: {
        ...DEFAULT_PREFERENCES.language,
        ...preferences.language,
      },
      onboarding: {
        ...DEFAULT_PREFERENCES.onboarding,
        ...preferences.onboarding,
      },
      app: {
        ...DEFAULT_PREFERENCES.app,
        ...preferences.app,
      },
      learning: {
        ...DEFAULT_PREFERENCES.learning,
        ...preferences.learning,
      },
      lastUpdated: preferences.lastUpdated || new Date().toISOString(),
      version: preferences.version || DEFAULT_PREFERENCES.version,
    };
  }

  /**
   * Invalidate cache (force reload from storage)
   */
  invalidateCache(): void {
    this.cachedPreferences = null;
  }
}

// Export singleton instance
export const preferenceStorage = PreferenceStorage.getInstance();

// Export helper functions
export const getPreferences = () => preferenceStorage.getPreferences();
export const saveLanguagePreferences = (native: SupportedLanguage, study: SupportedLanguage) =>
  preferenceStorage.updateLanguagePreferences(native, study);
export const markOnboardingCompleted = () => preferenceStorage.markOnboardingCompleted();
export const isOnboardingCompleted = () => preferenceStorage.isOnboardingCompleted();
export const getLanguagePreferences = () => preferenceStorage.getLanguagePreferences();