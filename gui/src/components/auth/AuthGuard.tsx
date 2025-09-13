import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/src/stores';
import { usePreferencesActions, useOnboardingPreferences } from '@/src/stores/preferencesStore';
import { COLORS } from '@/src/utils/constants';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * AuthGuard component that protects routes by checking authentication status
 * Redirects to login if user is not authenticated
 */
export default function AuthGuard({ 
  children, 
  fallback,
  redirectTo = '/auth/login' 
}: AuthGuardProps) {
  const { isAuthenticated, isInitializing, user } = useAuth();
  const { loadPreferences, checkOnboardingStatus } = usePreferencesActions();
  const { isOnboardingCompleted } = useOnboardingPreferences();
  
  const [isCheckingOnboarding, setIsCheckingOnboarding] = React.useState(true);

  // Load preferences on mount
  React.useEffect(() => {
    const initializePreferences = async () => {
      try {
        await loadPreferences();
      } catch (error) {
        console.error('Failed to load preferences:', error);
      } finally {
        setIsCheckingOnboarding(false);
      }
    };

    if (isAuthenticated) {
      initializePreferences();
    } else {
      setIsCheckingOnboarding(false);
    }
  }, [isAuthenticated, loadPreferences]);

  React.useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      // Redirect to login screen if not authenticated
      router.replace(redirectTo);
    }
  }, [isAuthenticated, isInitializing, redirectTo]);

  // Show loading spinner while initializing authentication or checking onboarding
  if (isInitializing || isCheckingOnboarding) {
    return fallback || (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  // Don't render children if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Check if user needs to complete language selection/onboarding
  React.useEffect(() => {
    const checkAndRedirect = async () => {
      if (user && isAuthenticated) {
        // Check backend user data for language setup
        const hasBackendLanguages = user.native_language_id && user.study_language_id;
        
        // Check local onboarding completion
        const isOnboardingComplete = await checkOnboardingStatus();
        
        // Redirect to language selection if either check fails
        if (!hasBackendLanguages || !isOnboardingComplete) {
          router.replace('/auth/language-selection');
        }
      }
    };

    if (!isInitializing && !isCheckingOnboarding) {
      checkAndRedirect();
    }
  }, [user, isAuthenticated, isInitializing, isCheckingOnboarding, checkOnboardingStatus]);

  // Don't render children if onboarding is not completed
  if (user && (!user.native_language_id || !user.study_language_id || !isOnboardingCompleted)) {
    return null;
  }

  // Render protected content
  return <>{children}</>;
}

/**
 * Higher-order component version of AuthGuard
 */
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: React.ReactNode;
    redirectTo?: string;
  }
) {
  return function AuthGuardedComponent(props: P) {
    return (
      <AuthGuard 
        fallback={options?.fallback}
        redirectTo={options?.redirectTo}
      >
        <Component {...props} />
      </AuthGuard>
    );
  };
}

/**
 * Hook for checking authentication status in components
 */
export function useAuthGuard() {
  const { isAuthenticated, isInitializing, user } = useAuth();
  const { checkOnboardingStatus } = usePreferencesActions();

  const requireAuth = React.useCallback((redirectTo = '/auth/login') => {
    if (!isInitializing && !isAuthenticated) {
      router.replace(redirectTo);
      return false;
    }
    return true;
  }, [isAuthenticated, isInitializing]);

  const requireLanguageSelection = React.useCallback(async () => {
    if (user && (!user.native_language_id || !user.study_language_id)) {
      router.replace('/auth/language-selection');
      return false;
    }
    
    // Also check local onboarding status
    try {
      const isOnboardingComplete = await checkOnboardingStatus();
      if (!isOnboardingComplete) {
        router.replace('/auth/language-selection');
        return false;
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      // If check fails, assume onboarding is needed
      router.replace('/auth/language-selection');
      return false;
    }
    
    return true;
  }, [user, checkOnboardingStatus]);

  return {
    isAuthenticated,
    isInitializing,
    user,
    requireAuth,
    requireLanguageSelection,
  };
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});