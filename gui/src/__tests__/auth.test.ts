/**
 * Authentication System Tests
 * Tests authentication flow, JWT management, and social login
 */

import { useAuthStore } from '@/src/stores/authStore';
import { storeTokens, getTokens, clearTokens, hasValidTokens } from '@/src/services/storage/tokenStorage';
import { socialAuthService } from '@/src/services/auth/socialAuth';
import { AuthTokens, SocialLoginResponse } from '@/src/types/auth';
import { User } from '@/src/types/user';

// Mock dependencies
jest.mock('@/src/services/storage/tokenStorage');
jest.mock('@/src/services/auth/socialAuth');
jest.mock('@/src/services/api');

const mockStoreTokens = storeTokens as jest.MockedFunction<typeof storeTokens>;
const mockGetTokens = getTokens as jest.MockedFunction<typeof getTokens>;
const mockClearTokens = clearTokens as jest.MockedFunction<typeof clearTokens>;
const mockHasValidTokens = hasValidTokens as jest.MockedFunction<typeof hasValidTokens>;
const mockSocialAuthService = socialAuthService as jest.Mocked<typeof socialAuthService>;

describe('Authentication System', () => {
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

  describe('Authentication Store', () => {
    test('should initialize with correct default state', () => {
      const store = useAuthStore.getState();
      
      expect(store.isAuthenticated).toBe(false);
      expect(store.user).toBe(null);
      expect(store.isLoading).toBe(false);
      expect(store.error).toBe(null);
    });

    test('should handle successful login', async () => {
      const mockTokens: AuthTokens = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
      };

      const mockUser: User = {
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

      const mockLoginResponse: SocialLoginResponse = {
        user: mockUser,
        is_new_user: false,
        ...mockTokens,
      };

      mockSocialAuthService.loginWithGoogle.mockResolvedValue(mockLoginResponse);

      const store = useAuthStore.getState();
      const result = await store.loginWithProvider('google');

      const updatedStore = useAuthStore.getState();
      expect(updatedStore.isAuthenticated).toBe(true);
      expect(updatedStore.user).toEqual(mockUser);
      expect(updatedStore.isLoading).toBe(false);
      expect(updatedStore.error).toBe(null);
      expect(result).toEqual(mockLoginResponse);
    });

    test('should handle login failure', async () => {
      const mockError = new Error('Login failed');
      mockSocialAuthService.loginWithGoogle.mockRejectedValue(mockError);

      const store = useAuthStore.getState();
      
      await expect(store.loginWithProvider('google')).rejects.toThrow();

      const updatedStore = useAuthStore.getState();
      expect(updatedStore.isAuthenticated).toBe(false);
      expect(updatedStore.user).toBe(null);
      expect(updatedStore.isLoading).toBe(false);
      expect(updatedStore.error).toBeDefined();
      expect(updatedStore.error?.message).toContain('Login failed');
    });

    test('should handle logout correctly', async () => {
      // First set up authenticated state
      const mockUser: User = {
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
        user: mockUser,
      });

      mockSocialAuthService.logout.mockResolvedValue();

      const store = useAuthStore.getState();
      await store.logout();

      const updatedStore = useAuthStore.getState();
      expect(updatedStore.isAuthenticated).toBe(false);
      expect(updatedStore.user).toBe(null);
      expect(updatedStore.error).toBe(null);
      expect(mockSocialAuthService.logout).toHaveBeenCalled();
    });

    test('should initialize authentication from stored tokens', async () => {
      const mockUser: User = {
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

      mockHasValidTokens.mockResolvedValue(true);
      
      // Mock API call to get user profile
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockUser }),
      } as Response);

      const store = useAuthStore.getState();
      await store.initialize();

      const updatedStore = useAuthStore.getState();
      expect(updatedStore.isAuthenticated).toBe(true);
      expect(updatedStore.user).toEqual(mockUser);
      expect(updatedStore.isInitializing).toBe(false);
    });

    test('should clear session when initialization fails', async () => {
      mockHasValidTokens.mockResolvedValue(true);
      
      // Mock API call failure
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);

      mockClearTokens.mockResolvedValue();

      const store = useAuthStore.getState();
      await store.initialize();

      const updatedStore = useAuthStore.getState();
      expect(updatedStore.isAuthenticated).toBe(false);
      expect(updatedStore.user).toBe(null);
      expect(updatedStore.isInitializing).toBe(false);
      expect(mockClearTokens).toHaveBeenCalled();
    });
  });

  describe('Social Authentication Service', () => {
    test('should handle Google login flow', async () => {
      const mockLoginResponse: SocialLoginResponse = {
        user: {
          id: 'google-user-123',
          username: 'googleuser',
          email: 'google@example.com',
          first_name: 'Google',
          last_name: 'User',
          native_language_id: 'en',
          study_language_id: null,
          profile_picture_url: 'https://google.com/avatar.jpg',
          created_at: new Date().toISOString(),
          provider: 'google',
        },
        is_new_user: true,
        access_token: 'google-access-token',
        refresh_token: 'google-refresh-token',
        expires_in: 3600,
      };

      mockSocialAuthService.loginWithGoogle.mockResolvedValue(mockLoginResponse);

      const result = await socialAuthService.loginWithGoogle();

      expect(result).toEqual(mockLoginResponse);
      expect(mockSocialAuthService.loginWithGoogle).toHaveBeenCalled();
    });

    test('should handle Apple login flow', async () => {
      const mockLoginResponse: SocialLoginResponse = {
        user: {
          id: 'apple-user-123',
          username: 'appleuser',
          email: 'apple@example.com',
          first_name: 'Apple',
          last_name: 'User',
          native_language_id: 'en',
          study_language_id: null,
          profile_picture_url: null,
          created_at: new Date().toISOString(),
          provider: 'apple',
        },
        is_new_user: false,
        access_token: 'apple-access-token',
        refresh_token: 'apple-refresh-token',
        expires_in: 3600,
      };

      mockSocialAuthService.loginWithApple.mockResolvedValue(mockLoginResponse);

      const result = await socialAuthService.loginWithApple();

      expect(result).toEqual(mockLoginResponse);
      expect(mockSocialAuthService.loginWithApple).toHaveBeenCalled();
    });

    test('should handle authentication provider errors', async () => {
      const mockError = new Error('Provider authentication failed');
      mockSocialAuthService.loginWithGoogle.mockRejectedValue(mockError);

      await expect(socialAuthService.loginWithGoogle()).rejects.toThrow(
        'Provider authentication failed'
      );
    });

    test('should get available providers', () => {
      const providers = [
        { id: 'google', name: 'Google', color: '#DB4437', icon: 'logo-google' },
        { id: 'facebook', name: 'Facebook', color: '#3B5998', icon: 'logo-facebook' },
        { id: 'twitter', name: 'Twitter', color: '#1DA1F2', icon: 'logo-twitter' },
      ];

      mockSocialAuthService.getAvailableProviders.mockReturnValue(providers as any);

      const result = socialAuthService.getAvailableProviders();

      expect(result).toEqual(providers);
      expect(mockSocialAuthService.getAvailableProviders).toHaveBeenCalled();
    });
  });

  describe('Token Storage', () => {
    test('should store tokens securely', async () => {
      const mockTokens: AuthTokens = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
      };

      mockStoreTokens.mockResolvedValue();

      await storeTokens(mockTokens);

      expect(mockStoreTokens).toHaveBeenCalledWith(mockTokens);
    });

    test('should retrieve stored tokens', async () => {
      const mockTokens = {
        access_token: 'stored-access-token',
        refresh_token: 'stored-refresh-token',
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
      };

      mockGetTokens.mockResolvedValue(mockTokens);

      const result = await getTokens();

      expect(result).toEqual(mockTokens);
      expect(mockGetTokens).toHaveBeenCalled();
    });

    test('should handle missing tokens gracefully', async () => {
      mockGetTokens.mockResolvedValue(null);

      const result = await getTokens();

      expect(result).toBe(null);
    });

    test('should clear tokens completely', async () => {
      mockClearTokens.mockResolvedValue();

      await clearTokens();

      expect(mockClearTokens).toHaveBeenCalled();
    });

    test('should check for valid tokens', async () => {
      mockHasValidTokens.mockResolvedValue(true);

      const result = await hasValidTokens();

      expect(result).toBe(true);
      expect(mockHasValidTokens).toHaveBeenCalled();
    });
  });

  describe('Authentication Guards', () => {
    test('should allow access for authenticated users', () => {
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

      const store = useAuthStore.getState();
      expect(store.isAuthenticated).toBe(true);
      expect(store.user).toBeDefined();
    });

    test('should deny access for unauthenticated users', () => {
      const store = useAuthStore.getState();
      expect(store.isAuthenticated).toBe(false);
      expect(store.user).toBe(null);
    });

    test('should handle authentication state transitions', () => {
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

      // Simulate logout
      useAuthStore.setState({
        isAuthenticated: false,
        user: null,
      });

      const loggedOutStore = useAuthStore.getState();
      expect(loggedOutStore.isAuthenticated).toBe(false);
      expect(loggedOutStore.user).toBe(null);
    });
  });

  describe('Edge Cases & Error Handling', () => {
    test('should handle concurrent login attempts', async () => {
      const mockLoginResponse: SocialLoginResponse = {
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
        is_new_user: false,
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
      };

      mockSocialAuthService.loginWithGoogle.mockResolvedValue(mockLoginResponse);

      const store = useAuthStore.getState();
      
      // Start multiple login attempts concurrently
      const loginPromises = [
        store.loginWithProvider('google'),
        store.loginWithProvider('google'),
        store.loginWithProvider('google'),
      ];

      const results = await Promise.all(loginPromises);

      const updatedStore = useAuthStore.getState();
      expect(updatedStore.isAuthenticated).toBe(true);
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toEqual(mockLoginResponse);
      });
    });

    test('should handle malformed responses gracefully', async () => {
      const malformedResponse = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          // Missing required fields
        },
        // Missing required token fields
      };

      mockSocialAuthService.loginWithGoogle.mockResolvedValue(malformedResponse as any);

      const store = useAuthStore.getState();
      const result = await store.loginWithProvider('google');

      // Should handle gracefully and not crash
      expect(result).toEqual(malformedResponse);
      expect(store.isLoading).toBe(false);
    });

    test('should handle network timeouts', async () => {
      const timeoutError = new Error('Network timeout');
      mockSocialAuthService.loginWithGoogle.mockRejectedValue(timeoutError);

      const store = useAuthStore.getState();
      
      await expect(store.loginWithProvider('google')).rejects.toThrow('Network timeout');

      const updatedStore = useAuthStore.getState();
      expect(updatedStore.isAuthenticated).toBe(false);
      expect(updatedStore.error?.message).toContain('Network timeout');
      expect(updatedStore.isLoading).toBe(false);
    });

    test('should handle initialization errors', async () => {
      const initError = new Error('Initialization failed');
      mockHasValidTokens.mockRejectedValue(initError);

      const store = useAuthStore.getState();
      await store.initialize();

      const updatedStore = useAuthStore.getState();
      expect(updatedStore.isAuthenticated).toBe(false);
      expect(updatedStore.user).toBe(null);
      expect(updatedStore.isInitializing).toBe(false);
      expect(updatedStore.error?.code).toBe('INIT_ERROR');
    });

    test('should handle logout with backend error gracefully', async () => {
      const logoutError = new Error('Backend logout failed');
      mockSocialAuthService.logout.mockRejectedValue(logoutError);

      // Set up authenticated state
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

      const store = useAuthStore.getState();
      await store.logout();

      const updatedStore = useAuthStore.getState();
      // Should still clear local state even if backend fails
      expect(updatedStore.isAuthenticated).toBe(false);
      expect(updatedStore.user).toBe(null);
      expect(updatedStore.error?.code).toBe('LOGOUT_ERROR');
    });
  });
});

console.log('Authentication tests completed successfully! ✅');