import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/src/utils/use-color-scheme';
import { useAuthStore } from '@/src/stores';
import { usePreferencesActions } from '@/src/stores/preferencesStore';
import { ToastContainer } from '@/src/components/ui/Toast';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const initializeAuth = useAuthStore((state) => state.initialize);
  const { loadPreferences } = usePreferencesActions();

  // Initialize authentication and preferences on app start
  React.useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize auth first
        await initializeAuth();
        
        // Then load preferences
        await loadPreferences();
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp();
  }, [initializeAuth, loadPreferences]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Authentication Routes */}
        <Stack.Screen
          name="auth/login"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal'
          }}
        />
        <Stack.Screen
          name="auth/language-selection"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal'
          }}
        />
        
        {/* Protected Routes */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      
      {/* Global Toast Container */}
      <ToastContainer />
      
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
