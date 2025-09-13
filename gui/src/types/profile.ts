import { Language, SupportedLanguage } from './language';
import { User, UserSettings } from './user';
import { ApiError } from './api';

/**
 * Profile-specific data structures and interfaces
 */

export interface ProfileData {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    createdAt: string;
  };
  languages: {
    native: SupportedLanguage | null;
    study: SupportedLanguage | null;
  };
  preferences: ProfilePreferences;
  statistics: ProfileStatistics;
}

export interface ProfilePreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  studyReminders: boolean;
  dailyGoal: number;
  audioEnabled: boolean;
  privacy: PrivacySettings;
}

export interface PrivacySettings {
  shareProgress: boolean;
  shareProfile: boolean;
  analyticsEnabled: boolean;
  marketingEmails: boolean;
}

export interface ProfileStatistics {
  totalWordsLearned: number;
  streakDays: number;
  studyTimeMinutes: number;
  lastActiveDate: string;
  joinDate: string;
  longestStreak: number;
  averageAccuracy: number;
  weeklyGoalProgress: number;
}

export interface LanguageChangeRequest {
  type: 'native' | 'study';
  currentLanguage: SupportedLanguage | null;
  newLanguage: SupportedLanguage;
  requiresConfirmation: boolean;
}

export interface LanguageChangeConfirmation {
  request: LanguageChangeRequest;
  impactWarnings: string[];
  willResetProgress: boolean;
}

export interface ProfileUpdateRequest {
  name?: string;
  preferences?: Partial<ProfilePreferences>;
  settings?: Partial<UserSettings>;
}

export interface AccountDeletionRequest {
  password?: string;
  reason?: string;
  feedback?: string;
}

// Profile state interfaces
export interface ProfileState {
  // Profile data
  profileData: ProfileData | null;
  
  // Loading states
  isLoadingProfile: boolean;
  isUpdatingProfile: boolean;
  isChangingLanguage: boolean;
  isDeletingAccount: boolean;
  
  // Modal states
  showLanguageChangeModal: boolean;
  showConfirmationModal: boolean;
  showSettingsModal: boolean;
  showLogoutConfirmationModal: boolean;
  
  // Current operations
  pendingLanguageChange: LanguageChangeRequest | null;
  pendingProfileUpdate: ProfileUpdateRequest | null;
  
  // Error states
  profileError: ApiError | null;
  languageChangeError: ApiError | null;
  updateError: ApiError | null;
}

// Component prop interfaces
export interface ProfileHeaderProps {
  user: User;
  onEditProfile?: () => void;
  onChangeAvatar?: () => void;
}

export interface LanguageSectionProps {
  nativeLanguage: SupportedLanguage | null;
  studyLanguage: SupportedLanguage | null;
  onChangeNative: () => void;
  onChangeStudy: () => void;
  isLoading?: boolean;
}

export interface LanguageChangeModalProps {
  visible: boolean;
  type: 'native' | 'study';
  currentLanguage: SupportedLanguage | null;
  excludeLanguageId?: string;
  onClose: () => void;
  onSelectLanguage: (language: SupportedLanguage) => void;
  onConfirm: (request: LanguageChangeRequest) => void;
}

export interface AccountSectionProps {
  onLogout: () => void;
  onDeleteAccount?: () => void;
  onExportData?: () => void;
  isLoading?: boolean;
}

export interface SettingsSectionProps {
  preferences: ProfilePreferences;
  onUpdatePreferences: (preferences: Partial<ProfilePreferences>) => void;
  isLoading?: boolean;
}

export interface StatisticsSectionProps {
  statistics: ProfileStatistics;
  isLoading?: boolean;
}

// Validation interfaces
export interface LanguageValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ProfileValidationResult {
  isValid: boolean;
  fieldErrors: Record<string, string>;
  generalErrors: string[];
}

// Export data structures
export interface ExportDataRequest {
  includeProgress: boolean;
  includeVocabulary: boolean;
  includeSettings: boolean;
  format: 'json' | 'csv';
}

export interface ExportDataResponse {
  downloadUrl: string;
  fileName: string;
  expiresAt: string;
  fileSize: number;
}

// Notification preferences
export interface NotificationPreferences {
  pushNotifications: boolean;
  emailNotifications: boolean;
  studyReminders: boolean;
  achievementNotifications: boolean;
  weeklyProgress: boolean;
  marketingEmails: boolean;
  reminderTime: string; // HH:MM format
  reminderDays: number[]; // 0-6, Sunday to Saturday
}

// Achievement and progress tracking
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress?: number;
  target?: number;
}

export interface LearningGoals {
  dailyWords: number;
  weeklyMinutes: number;
  monthlyStreakTarget: number;
  accuracyTarget: number;
  customGoals: Array<{
    id: string;
    name: string;
    target: number;
    current: number;
    deadline?: string;
  }>;
}

// Social features (for future expansion)
export interface SocialProfile {
  displayName: string;
  bio?: string;
  isPublic: boolean;
  allowFriendRequests: boolean;
  shareProgress: boolean;
  preferredLanguages: string[];
}