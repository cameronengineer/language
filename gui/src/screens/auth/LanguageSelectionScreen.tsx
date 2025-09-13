import React from 'react';
import { Alert, BackHandler } from 'react-native';
import { router } from 'expo-router';
import { useAuth, useAuthActions } from '@/src/stores/authStore';
import { useUserActions, useLanguageSelection } from '@/src/stores/userStore';
import { usePreferencesActions, useOnboardingPreferences } from '@/src/stores/preferencesStore';
import { LanguageUtils, ERROR_MESSAGES } from '@/src/utils/constants';
import { SupportedLanguage, OnboardingState } from '@/src/types/language';
import { useToast } from '@/src/components/ui/Toast';
import { FadeInView, SlideInView } from '@/src/components/ui/AnimatedView';
import {
  OnboardingWelcome,
  NativeLanguageSelection,
  StudyLanguageSelection,
  OnboardingComplete,
} from '@/src/components/onboarding';

export default function LanguageSelectionScreen() {
  const { user } = useAuth();
  const { setUser } = useAuthActions();
  const { setNativeLanguage, setStudyLanguage, updateUserLanguages } = useUserActions();
  const { isUpdatingLanguages } = useLanguageSelection();
  const { updateLanguagePreferences, completeOnboarding } = usePreferencesActions();
  const { isOnboardingCompleted } = useOnboardingPreferences();
  const toast = useToast();

  const [onboardingState, setOnboardingState] = React.useState<OnboardingState>({
    current_step: 'welcome',
    selected_native: null,
    selected_study: null,
    is_loading: false,
    error: null,
    can_skip: false,
  });

  const [autoDetectedLanguage, setAutoDetectedLanguage] = React.useState<SupportedLanguage | null>(null);

  React.useEffect(() => {
    // Auto-detect device language
    const deviceLanguage = LanguageUtils.getDeviceLanguage();
    if (deviceLanguage) {
      setAutoDetectedLanguage(deviceLanguage);
      // Pre-select the detected language
      setOnboardingState(prev => ({
        ...prev,
        selected_native: deviceLanguage,
      }));
      
      // Show success toast for auto-detection
      toast.success(
        `Detected your language: ${deviceLanguage.name}`,
        { duration: 3000 }
      );
    }
  }, []);

  // Handle Android back button
  React.useEffect(() => {
    const handleBackPress = () => {
      handleBack();
      return true; // Prevent default back behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [onboardingState.current_step]);

  const handleWelcomeContinue = () => {
    setOnboardingState(prev => ({
      ...prev,
      current_step: 'native',
    }));
  };

  const handleWelcomeSkip = () => {
    // Skip to study language if we have a native language detected
    if (onboardingState.selected_native) {
      setOnboardingState(prev => ({
        ...prev,
        current_step: 'study',
      }));
    } else {
      setOnboardingState(prev => ({
        ...prev,
        current_step: 'native',
      }));
    }
  };

  const handleNativeLanguageSelect = (language: SupportedLanguage) => {
    setOnboardingState(prev => ({
      ...prev,
      selected_native: language,
    }));
    setNativeLanguage({
      ...language,
      is_active: true,
    });
  };

  const handleNativeContinue = () => {
    if (onboardingState.selected_native) {
      setOnboardingState(prev => ({
        ...prev,
        current_step: 'study',
      }));
    }
  };

  const handleStudyLanguageSelect = (language: SupportedLanguage) => {
    if (onboardingState.selected_native && language.id === onboardingState.selected_native.id) {
      toast.error(ERROR_MESSAGES.SAME_LANGUAGE_ERROR, {
        duration: 4000,
        actionText: 'Choose Different',
        onAction: () => {
          // Could scroll to popular languages or highlight alternatives
        }
      });
      return;
    }

    setOnboardingState(prev => ({
      ...prev,
      selected_study: language,
    }));
    setStudyLanguage({
      ...language,
      is_active: true,
    });

    // Show success feedback
    toast.success(
      `Great choice! You'll be learning ${language.name}`,
      { duration: 2000 }
    );
  };

  const handleStudyContinue = async () => {
    if (!user || !onboardingState.selected_native || !onboardingState.selected_study) {
      toast.error('Please select both languages to continue.', {
        duration: 4000,
        actionText: 'Got it',
      });
      return;
    }

    setOnboardingState(prev => ({
      ...prev,
      is_loading: true,
      error: null,
    }));

    // Show loading feedback
    const loadingToastId = toast.info('Saving your language preferences...', {
      duration: 0, // Don't auto-dismiss
    });

    try {
      // Update backend first
      const updatedUser = await updateUserLanguages(
        user.id,
        onboardingState.selected_native.id,
        onboardingState.selected_study.id
      );

      // Update user in auth store
      setUser(updatedUser);

      // Update local preferences
      await updateLanguagePreferences(
        onboardingState.selected_native,
        onboardingState.selected_study
      );

      // Dismiss loading toast and show success
      toast.dismiss(loadingToastId);
      toast.success('Languages saved successfully!', { duration: 2000 });

      // Show completion screen
      setOnboardingState(prev => ({
        ...prev,
        current_step: 'complete',
        is_loading: false,
      }));
    } catch (error: any) {
      console.error('Language update error:', error);
      
      // Dismiss loading toast and show error
      toast.dismiss(loadingToastId);
      
      const errorMessage = error.message || 'Failed to save language preferences';
      setOnboardingState(prev => ({
        ...prev,
        is_loading: false,
        error: errorMessage,
      }));
      
      toast.error(errorMessage, {
        duration: 6000,
        actionText: 'Retry',
        onAction: () => handleStudyContinue(),
      });
    }
  };

  const handleCompleteContinue = async () => {
    try {
      // Mark onboarding as completed in preferences
      await completeOnboarding();
      
      // Show final success message
      toast.success('Welcome to your language learning journey!', {
        duration: 2000,
      });
      
      // Navigate to dashboard after a short delay for the toast
      setTimeout(() => {
        router.replace('/dashboard');
      }, 1000);
    } catch (error: any) {
      console.error('Failed to complete onboarding:', error);
      
      // Show warning but still proceed
      toast.warning('Setup completed with some issues', {
        duration: 3000,
      });
      
      // Still navigate even if preference update fails
      setTimeout(() => {
        router.replace('/dashboard');
      }, 1000);
    }
  };

  const handleBack = () => {
    switch (onboardingState.current_step) {
      case 'native':
        setOnboardingState(prev => ({
          ...prev,
          current_step: 'welcome',
        }));
        break;
      case 'study':
        setOnboardingState(prev => ({
          ...prev,
          current_step: 'native',
          selected_study: null,
        }));
        break;
      case 'complete':
        setOnboardingState(prev => ({
          ...prev,
          current_step: 'study',
        }));
        break;
      default:
        router.back();
        break;
    }
  };

  // Render the appropriate onboarding step with animations
  const renderStep = () => {
    switch (onboardingState.current_step) {
      case 'welcome':
        return (
          <SlideInView direction="up" duration={400}>
            <OnboardingWelcome
              onContinue={handleWelcomeContinue}
              onSkip={handleWelcomeSkip}
              canSkip={onboardingState.can_skip}
            />
          </SlideInView>
        );

      case 'native':
        return (
          <SlideInView direction="right" duration={400}>
            <NativeLanguageSelection
              selectedLanguage={onboardingState.selected_native}
              onLanguageSelect={handleNativeLanguageSelect}
              onBack={handleBack}
              onContinue={handleNativeContinue}
              canContinue={!!onboardingState.selected_native}
              autoDetectedLanguage={autoDetectedLanguage}
            />
          </SlideInView>
        );

      case 'study':
        return onboardingState.selected_native ? (
          <SlideInView direction="right" duration={400}>
            <StudyLanguageSelection
              nativeLanguage={onboardingState.selected_native}
              selectedLanguage={onboardingState.selected_study}
              onLanguageSelect={handleStudyLanguageSelect}
              onBack={handleBack}
              onContinue={handleStudyContinue}
              canContinue={!!onboardingState.selected_study}
              isLoading={onboardingState.is_loading || isUpdatingLanguages}
            />
          </SlideInView>
        ) : null;

      case 'complete':
        return onboardingState.selected_native && onboardingState.selected_study ? (
          <FadeInView duration={600}>
            <OnboardingComplete
              nativeLanguage={onboardingState.selected_native}
              studyLanguage={onboardingState.selected_study}
              onContinue={handleCompleteContinue}
              isLoading={false}
            />
          </FadeInView>
        ) : null;

      default:
        return null;
    }
  };

  return renderStep();
}