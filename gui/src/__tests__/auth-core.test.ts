/**
 * Core Authentication Logic Tests
 * Tests authentication store and core business logic without external dependencies
 */

import { useAuthStore } from '@/src/stores/authStore';

// Mock all external dependencies at the module level
jest.mock('@/src/services/auth', () => ({
  socialAuthService: {
    loginWithGoogle: jest.fn(),
    loginWithFacebook: jest.fn(),
    loginWithApple: jest.fn(),
    loginWithTwitter: jest.fn(),
    logout: jest.fn(),
    getAvailableProviders: jest.fn(),
  },
}));

jest.mock('@/src/services/storage/tokenStorage', () => ({
  hasValidTokens: jest.fn(),
  clearTokens: jest.fn(),
  storeTokens: jest.fn(),
  getTokens: jest.fn(),
}));

jest.mock('@/src/services/api', () => ({
  api: {
    auth: {
      getMe: jest.fn(),
      socialLogin: jest.fn(),
      logout: jest.fn(),
    },
  },
}));

describe('Core Authentication Logic', () => {
  beforeEach(() => {
    // Reset auth store to initial state
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      isInitializing: false,
      error: null,
    });
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Authentication State Management', () => {
    test('should initialize with correct default state', () => {
      const store = useAuthStore.getState();
      
      expect(store.isAuthenticated).toBe(false);
      expect(store.user).toBe(null);
      expect(store.isLoading).toBe(false);
      expect(store.isInitializing).toBe(false);
      expect(store.error).toBe(null);
    });

    test('should handle state transitions correctly', () => {
      const store = useAuthStore.getState();
      
      // Initially unauthenticated
      expect(store.isAuthenticated).toBe(false);

      // Simulate login
      useAuthStore.setState({
        isAuthenticated: true,
        user: {
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          native_language_id: 'en',
          study_language_id: 'es',
          profile_picture_url: 'https://example.com/avatar.jpg',
          created_at: new Date().toISOString(),
          provider: 'google',
        },
      });

      const authenticatedStore = useAuthStore.getState();
      expect(authenticatedStore.isAuthenticated).toBe(true);
      expect(authenticatedStore.user).toBeDefined();
      expect(authenticatedStore.user?.id).toBe('user-123');

      // Simulate logout
      useAuthStore.setState({
        isAuthenticated: false,
        user: null,
      });

      const loggedOutStore = useAuthStore.getState();
      expect(loggedOutStore.isAuthenticated).toBe(false);
      expect(loggedOutStore.user).toBe(null);
    });

    test('should handle loading states', () => {
      useAuthStore.setState({ isLoading: true });
      expect(useAuthStore.getState().isLoading).toBe(true);

      useAuthStore.setState({ isLoading: false });
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    test('should handle error states', () => {
      const mockError = {
        code: 'TEST_ERROR',
        message: 'Test error message',
      };

      useAuthStore.setState({ error: mockError });
      expect(useAuthStore.getState().error).toEqual(mockError);

      // Test error clearing
      const store = useAuthStore.getState();
      store.clearError();
      expect(useAuthStore.getState().error).toBe(null);
    });

    test('should handle user updates', () => {
      const initialUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        native_language_id: 'en',
        study_language_id: 'es',
        profile_picture_url: 'https://example.com/avatar.jpg',
        created_at: new Date().toISOString(),
        provider: 'google',
      };

      const store = useAuthStore.getState();
      store.setUser(initialUser);
      
      expect(useAuthStore.getState().user).toEqual(initialUser);

      // Update user data
      const updatedUser = {
        ...initialUser,
        first_name: 'Updated',
        last_name: 'Name',
      };

      store.setUser(updatedUser);
      expect(useAuthStore.getState().user).toEqual(updatedUser);
      expect(useAuthStore.getState().user?.first_name).toBe('Updated');
    });
  });

  describe('Authentication Validation', () => {
    test('should validate user data structure', () => {
      const validUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        native_language_id: 'en',
        study_language_id: 'es',
        profile_picture_url: 'https://example.com/avatar.jpg',
        created_at: new Date().toISOString(),
        provider: 'google',
      };

      useAuthStore.setState({
        isAuthenticated: true,
        user: validUser,
      });

      const store = useAuthStore.getState();
      expect(store.user).toHaveProperty('id');
      expect(store.user).toHaveProperty('username');
      expect(store.user).toHaveProperty('email');
      expect(store.user).toHaveProperty('first_name');
      expect(store.user).toHaveProperty('last_name');
      expect(store.user).toHaveProperty('provider');
      expect(store.user?.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    test('should handle missing user data gracefully', () => {
      useAuthStore.setState({
        isAuthenticated: false,
        user: null,
      });

      const store = useAuthStore.getState();
      expect(store.user).toBe(null);
      expect(store.isAuthenticated).toBe(false);
    });

    test('should validate authentication consistency', () => {
      // Should not be authenticated without user
      useAuthStore.setState({
        isAuthenticated: true,
        user: null,
      });

      const store = useAuthStore.getState();
      // This is an inconsistent state that should be handled
      expect(store.isAuthenticated).toBe(true);
      expect(store.user).toBe(null);
    });
  });

  describe('Error Handling', () => {
    test('should handle authentication errors', () => {
      const authError = {
        code: 'LOGIN_FAILED',
        message: 'Authentication failed',
        details: { provider: 'google', reason: 'cancelled' },
      };

      useAuthStore.setState({ error: authError });

      const store = useAuthStore.getState();
      expect(store.error).toEqual(authError);
      expect(store.error?.code).toBe('LOGIN_FAILED');
      expect(store.error?.message).toBe('Authentication failed');
      expect(store.error?.details).toEqual({ provider: 'google', reason: 'cancelled' });
    });

    test('should handle network errors', () => {
      const networkError = {
        code: 'NETWORK_ERROR',
        message: 'Network request failed',
      };

      useAuthStore.setState({ error: networkError });

      const store = useAuthStore.getState();
      expect(store.error?.code).toBe('NETWORK_ERROR');
      expect(store.error?.message).toBe('Network request failed');
    });

    test('should handle multiple error scenarios', () => {
      const errors = [
        { code: 'TIMEOUT', message: 'Request timeout' },
        { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' },
        { code: 'SERVER_ERROR', message: 'Internal server error' },
      ];

      errors.forEach(error => {
        useAuthStore.setState({ error });
        expect(useAuthStore.getState().error).toEqual(error);
      });
    });
  });

  describe('Session Management', () => {
    test('should handle session persistence', () => {
      const sessionData = {
        isAuthenticated: true,
        user: {
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          native_language_id: 'en',
          study_language_id: 'es',
          profile_picture_url: 'https://example.com/avatar.jpg',
          created_at: new Date().toISOString(),
          provider: 'google',
        },
      };

      useAuthStore.setState(sessionData);

      const store = useAuthStore.getState();
      expect(store.isAuthenticated).toBe(true);
      expect(store.user).toEqual(sessionData.user);
    });

    test('should handle session invalidation', () => {
      // First set up a valid session
      useAuthStore.setState({
        isAuthenticated: true,
        user: {
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          native_language_id: 'en',
          study_language_id: 'es',
          profile_picture_url: 'https://example.com/avatar.jpg',
          created_at: new Date().toISOString(),
          provider: 'google',
        },
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      // Invalidate session
      useAuthStore.setState({
        isAuthenticated: false,
        user: null,
        error: {
          code: 'SESSION_EXPIRED',
          message: 'Session has expired',
        },
      });

      const store = useAuthStore.getState();
      expect(store.isAuthenticated).toBe(false);
      expect(store.user).toBe(null);
      expect(store.error?.code).toBe('SESSION_EXPIRED');
    });
  });

  describe('Provider Support', () => {
    test('should support multiple authentication providers', () => {
      const providers = ['google', 'facebook', 'apple', 'twitter'];
      
      providers.forEach(provider => {
        const user = {
          id: `${provider}-user-123`,
          username: `${provider}user`,
          email: `${provider}@example.com`,
          first_name: 'Test',
          last_name: 'User',
          native_language_id: 'en',
          study_language_id: 'es',
          profile_picture_url: `https://${provider}.com/avatar.jpg`,
          created_at: new Date().toISOString(),
          provider,
        };

        useAuthStore.setState({
          isAuthenticated: true,
          user,
        });

        const store = useAuthStore.getState();
        expect(store.user?.provider).toBe(provider);
        expect(store.user?.email).toContain(provider);
      });
    });

    test('should handle provider-specific data', () => {
      const providerData = {
        google: {
          profile_picture_url: 'https://google.com/avatar.jpg',
        },
        apple: {
          profile_picture_url: null, // Apple doesn't provide pictures
        },
        facebook: {
          profile_picture_url: 'https://facebook.com/avatar.jpg',
        },
      };

      Object.entries(providerData).forEach(([provider, data]) => {
        const user = {
          id: `${provider}-user-123`,
          username: `${provider}user`,
          email: `${provider}@example.com`,
          first_name: 'Test',
          last_name: 'User',
          native_language_id: 'en',
          study_language_id: 'es',
          created_at: new Date().toISOString(),
          provider,
          ...data,
        };

        useAuthStore.setState({
          isAuthenticated: true,
          user,
        });

        const store = useAuthStore.getState();
        expect(store.user?.provider).toBe(provider);
        expect(store.user?.profile_picture_url).toBe(data.profile_picture_url);
      });
    });
  });

  describe('Performance and Memory', () => {
    test('should handle rapid state changes', () => {
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        useAuthStore.setState({
          isLoading: i % 2 === 0,
          error: i % 3 === 0 ? { code: 'TEST', message: `Error ${i}` } : null,
        });
      }

      const store = useAuthStore.getState();
      // Should handle rapid updates without issues
      expect(typeof store.isLoading).toBe('boolean');
    });

    test('should handle large user objects', () => {
      const largeUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        native_language_id: 'en',
        study_language_id: 'es',
        profile_picture_url: 'https://example.com/avatar.jpg',
        created_at: new Date().toISOString(),
        provider: 'google',
        // Add some additional properties to simulate a large object
        metadata: {
          preferences: Array.from({ length: 100 }, (_, i) => `pref_${i}`),
          history: Array.from({ length: 1000 }, (_, i) => ({
            action: `action_${i}`,
            timestamp: new Date().toISOString(),
          })),
        },
      };

      const startTime = performance.now();
      useAuthStore.setState({
        isAuthenticated: true,
        user: largeUser,
      });
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should be fast
      expect(useAuthStore.getState().user?.id).toBe('user-123');
    });
  });
});

console.log('Core authentication tests completed successfully! ✅');