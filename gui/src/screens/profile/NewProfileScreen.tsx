import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ThemedView,
  LoadingSpinner,
  ErrorMessage
} from '@/src/components/ui';
import { 
  ProfileHeader,
  LanguageSection,
  AccountSection,
  SettingsSection,
  LanguageChangeModal,
  LanguageChangeConfirmationModal 
} from '@/src/components/profile';
import { useTheme } from '@/src/utils/use-theme-color';
import { Spacing } from '@/src/utils/theme';
import { 
  useProfileStore,
  useProfile,
  useProfileActions,
  useLanguageManagement,
  useProfileModals,
  useAccountManagement 
} from '@/src/stores/profileStore';
import { useAuth, useAuthActions } from '@/src/stores/authStore';
import { LanguageUtils } from '@/src/utils/constants';
import { SupportedLanguage } from '@/src/types/language';
import { LanguageChangeRequest } from '@/src/types/profile';

/**
 * Comprehensive Profile Screen with full functionality
 */
export default function NewProfileScreen() {
  const { colors } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { logout: authLogout } = useAuthActions();

  // Profile store hooks
  const { profileData, isLoadingProfile, profileError } = useProfile();
  const { loadProfile, updatePreferences } = useProfileActions();
  const { 
    pendingLanguageChange,
    isChangingLanguage,
    languageChangeError,
    showLanguageChangeModal,
    showConfirmationModal,
    initiateLanguageChange,
    confirmLanguageChange,
    cancelLanguageChange,
    showLanguageModal,
    hideLanguageModal,
    hideConfirmation,
    clearLanguageError 
  } = useLanguageManagement();
  const { showLogoutConfirmationModal, openLogoutConfirmation, closeLogoutConfirmation } = useProfileModals();
  const { exportData } = useAccountManagement();

  // Current language change type
  const [currentLanguageChangeType, setCurrentLanguageChangeType] = React.useState<'native' | 'study'>('native');

  // Load profile data on mount
  useEffect(() => {
    if (user?.id && isAuthenticated) {
      loadProfile(user.id).catch((error) => {
        console.error('Failed to load profile:', error);
        Alert.alert('Error', 'Failed to load profile data');
      });
    }
  }, [user?.id, isAuthenticated, loadProfile]);

  // Handle language change initiation
  const handleLanguageChange = (type: 'native' | 'study') => {
    setCurrentLanguageChangeType(type);
    showLanguageModal(type);
  };

  // Handle language selection from modal
  const handleLanguageSelect = (language: SupportedLanguage) => {
    if (!profileData) return;

    const currentLanguage = currentLanguageChangeType === 'native' 
      ? profileData.languages.native 
      : profileData.languages.study;

    const request: LanguageChangeRequest = {
      type: currentLanguageChangeType,
      currentLanguage,
      newLanguage: language,
      requiresConfirmation: true,
    };

    initiateLanguageChange(currentLanguageChangeType, language);
    hideLanguageModal();
  };

  // Handle language change confirmation
  const handleLanguageChangeConfirm = async () => {
    if (!user?.id) return;

    try {
      await confirmLanguageChange(user.id);
      Alert.alert('Success', 'Language updated successfully');
    } catch (error: any) {
      console.error('Language change failed:', error);
      Alert.alert('Error', error.message || 'Failed to update language');
    }
  };

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: confirmLogout
        }
      ]
    );
  };

  const confirmLogout = async () => {
    try {
      await authLogout();
      // Navigation will be handled by auth state change
    } catch (error: any) {
      console.error('Logout failed:', error);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  // Handle data export
  const handleExportData = async () => {
    if (!user?.id) return;

    try {
      const exportResult = await exportData(user.id, {
        includeProgress: true,
        includeVocabulary: true,
        includeSettings: true,
        format: 'json',
      });
      
      Alert.alert(
        'Data Export Ready',
        `Your data export is ready for download. The file will be available for 24 hours.`,
        [
          { text: 'OK' }
        ]
      );
    } catch (error: any) {
      console.error('Data export failed:', error);
      Alert.alert('Error', 'Failed to export data');
    }
  };

  // Handle preferences update
  const handlePreferencesUpdate = async (preferences: any) => {
    if (!user?.id) return;

    try {
      await updatePreferences(user.id, preferences);
      // Settings updated silently for better UX
    } catch (error: any) {
      console.error('Failed to update preferences:', error);
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  // Get exclude language ID for language modals
  const getExcludeLanguageId = () => {
    if (!profileData) return undefined;
    
    const otherLanguage = currentLanguageChangeType === 'native' 
      ? profileData.languages.study 
      : profileData.languages.native;
    
    return otherLanguage?.id;
  };

  // Loading state
  if (isLoadingProfile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingSpinner message="Loading profile..." overlay />
      </SafeAreaView>
    );
  }

  // Error state
  if (profileError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <ErrorMessage message={profileError.message} />
        </View>
      </SafeAreaView>
    );
  }

  // No data state
  if (!profileData || !user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <ErrorMessage message="Profile data not available" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <ProfileHeader 
          user={user}
          onEditProfile={() => {
            // TODO: Implement profile editing
            Alert.alert('Coming Soon', 'Profile editing will be available soon');
          }}
        />

        {/* Language Settings */}
        <LanguageSection
          nativeLanguage={profileData.languages.native}
          studyLanguage={profileData.languages.study}
          onChangeNative={() => handleLanguageChange('native')}
          onChangeStudy={() => handleLanguageChange('study')}
          isLoading={isChangingLanguage}
        />

        {/* User Settings */}
        <SettingsSection
          preferences={profileData.preferences}
          onUpdatePreferences={handlePreferencesUpdate}
          isLoading={false}
        />

        {/* Account Management */}
        <AccountSection
          onLogout={handleLogout}
          onExportData={handleExportData}
          isLoading={false}
        />
      </ScrollView>

      {/* Language Change Modal */}
      <LanguageChangeModal
        visible={showLanguageChangeModal}
        type={currentLanguageChangeType}
        currentLanguage={
          currentLanguageChangeType === 'native' 
            ? profileData.languages.native 
            : profileData.languages.study
        }
        excludeLanguageId={getExcludeLanguageId()}
        onClose={hideLanguageModal}
        onSelectLanguage={handleLanguageSelect}
        onConfirm={() => {}} // Handled in handleLanguageSelect
      />

      {/* Language Change Confirmation Modal */}
      <LanguageChangeConfirmationModal
        visible={showConfirmationModal}
        request={pendingLanguageChange}
        isLoading={isChangingLanguage}
        onConfirm={handleLanguageChangeConfirm}
        onCancel={cancelLanguageChange}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
});