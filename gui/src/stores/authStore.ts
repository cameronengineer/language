import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthError, SocialProvider, SocialLoginResponse } from '@/src/types/auth';
import { User } from '@/src/types/user';
import { socialAuthService } from '@/src/services/auth';
import { hasValidTokens, clearTokens } from '@/src/services/storage/tokenStorage';
import { api } from '@/src/services/api';

interface AuthState {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  user: User | null;
  error: AuthError | null;
  
  // Actions
  initialize: () => Promise<void>;
  loginWithProvider: (providerId: 'google' | 'facebook' | 'apple' | 'twitter') => Promise<SocialLoginResponse>;
  logout: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      isLoading: false,
      isInitializing: true,
      user: null,
      error: null,

      // Initialize authentication state on app start
      initialize: async () => {
        try {
          set({ isInitializing: true, error: null });
          
          // Check if user has valid tokens
          const hasTokens = await hasValidTokens();
          
          if (hasTokens) {
            // Try to get user profile from backend
            try {
              const response = await api.auth.getMe();
              const user = response.data;
              
              set({
                isAuthenticated: true,
                user,
                isInitializing: false,
              });
            } catch (error) {
              // Tokens might be invalid, clear them
              await clearTokens();
              set({
                isAuthenticated: false,
                user: null,
                isInitializing: false,
              });
            }
          } else {
            set({
              isAuthenticated: false,
              user: null,
              isInitializing: false,
            });
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({
            isAuthenticated: false,
            user: null,
            isInitializing: false,
            error: {
              code: 'INIT_ERROR',
              message: 'Failed to initialize authentication',
            },
          });
        }
      },

      // Login with social provider
      loginWithProvider: async (providerId) => {
        try {
          set({ isLoading: true, error: null });

          let loginResponse: SocialLoginResponse;

          switch (providerId) {
            case 'google':
              loginResponse = await socialAuthService.loginWithGoogle();
              break;
            case 'facebook':
              loginResponse = await socialAuthService.loginWithFacebook();
              break;
            case 'apple':
              loginResponse = await socialAuthService.loginWithApple();
              break;
            case 'twitter':
              loginResponse = await socialAuthService.loginWithTwitter();
              break;
            default:
              throw new Error(`Unsupported provider: ${providerId}`);
          }

          set({
            isAuthenticated: true,
            user: loginResponse.user,
            isLoading: false,
            error: null,
          });

          return loginResponse;
        } catch (error: any) {
          const authError: AuthError = {
            code: error.code || 'LOGIN_ERROR',
            message: error.message || 'Failed to login',
            details: error,
          };

          set({
            isLoading: false,
            error: authError,
          });

          throw authError;
        }
      },

      // Logout user
      logout: async () => {
        try {
          set({ isLoading: true, error: null });
          
          // Call logout service
          await socialAuthService.logout();
          
          set({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          console.error('Logout error:', error);
          
          // Even if logout fails, clear local state
          set({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: {
              code: 'LOGOUT_ERROR',
              message: 'Logout completed with errors',
            },
          });
        }
      },

      // Clear error state
      clearError: () => {
        set({ error: null });
      },

      // Set user data (for updates)
      setUser: (user: User) => {
        set({ user });
      },

      // Refresh user data from backend
      refreshUser: async () => {
        try {
          if (!get().isAuthenticated) {
            return;
          }

          const response = await api.auth.getMe();
          const user = response.data;
          
          set({ user });
        } catch (error: any) {
          console.error('Failed to refresh user:', error);
          
          // If refresh fails with 401, user might be logged out
          if (error.status === 401) {
            await get().logout();
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist user data, not loading states
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Convenience hooks for specific auth state
export const useAuth = () => {
  const auth = useAuthStore();
  return {
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    isInitializing: auth.isInitializing,
    user: auth.user,
    error: auth.error,
  };
};

export const useAuthActions = () => {
  const auth = useAuthStore();
  return {
    initialize: auth.initialize,
    loginWithProvider: auth.loginWithProvider,
    logout: auth.logout,
    clearError: auth.clearError,
    setUser: auth.setUser,
    refreshUser: auth.refreshUser,
  };
};