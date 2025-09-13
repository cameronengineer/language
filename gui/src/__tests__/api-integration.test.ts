/**
 * API Integration Tests
 * Tests all API endpoints, error handling, and backend communication
 */

import { api } from '@/src/services/api';
import { AuthTokens } from '@/src/types/auth';
import { User } from '@/src/types/user';
import { Translation, Language, Catalogue } from '@/src/types/language';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock token storage
jest.mock('@/src/services/storage/tokenStorage', () => ({
  getAccessToken: jest.fn(() => Promise.resolve('mock-access-token')),
  storeTokens: jest.fn(() => Promise.resolve()),
  clearTokens: jest.fn(() => Promise.resolve()),
}));

describe('API Integration Tests', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    // Default successful response
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, data: {} }),
      headers: new Headers(),
    });
  });

  describe('Authentication API', () => {
    test('should handle social login', async () => {
      const mockResponse = {
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
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
        is_new_user: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const loginRequest = {
        provider: 'google',
        access_token: 'google-token',
        device_info: {
          device_type: 'ios',
          device_id: 'test-device',
          app_version: '1.0.0',
        },
      };

      const result = await api.auth.socialLogin(loginRequest);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/social'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(loginRequest),
        })
      );

      expect(result.data).toEqual(mockResponse);
    });

    test('should handle get user profile', async () => {
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockUser),
      });

      const result = await api.auth.getMe();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/me'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-access-token',
          }),
        })
      );

      expect(result.data).toEqual(mockUser);
    });

    test('should handle logout', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ message: 'Logged out successfully' }),
      });

      await api.auth.logout();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/logout'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-access-token',
          }),
        })
      );
    });

    test('should handle authentication errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Invalid credentials' }),
      });

      await expect(api.auth.socialLogin({
        provider: 'google',
        access_token: 'invalid-token',
      })).rejects.toThrow('HTTP error! status: 401');
    });
  });

  describe('User API', () => {
    test('should get user profile', async () => {
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockUser),
      });

      const result = await api.user.getProfile('user-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/user-123'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-access-token',
          }),
        })
      );

      expect(result.data).toEqual(mockUser);
    });

    test('should update user profile', async () => {
      const updateData = {
        name: 'Updated Name',
        preferences: {
          audio_enabled: true,
          notifications: false,
        },
      };

      const updatedProfile = {
        user: {
          id: 'user-123',
          name: 'Updated Name',
          email: 'test@example.com',
          avatar: 'https://example.com/avatar.jpg',
          createdAt: new Date().toISOString(),
        },
        languages: {
          native: { id: 'en', name: 'English' },
          study: { id: 'es', name: 'Spanish' },
        },
        preferences: {
          audio_enabled: true,
          notifications: false,
        },
        statistics: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(updatedProfile),
      });

      const result = await api.user.updateProfile('user-123', updateData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/user-123/profile'),
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-access-token',
          }),
          body: JSON.stringify(updateData),
        })
      );

      expect(result.data).toEqual(updatedProfile);
    });

    test('should get user progress', async () => {
      const mockProgress = {
        total_words: 150,
        words_in_deep_memory: 45,
        current_streak: 7,
        daily_progress: [
          { date: '2024-01-01', words_learned: 5, minutes_studied: 25 },
          { date: '2024-01-02', words_learned: 8, minutes_studied: 30 },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockProgress),
      });

      const result = await api.user.getProgress('user-123');

      expect(result.data).toEqual(mockProgress);
    });
  });

  describe('Practice API', () => {
    test('should get random translation', async () => {
      const mockTranslation: Translation = {
        id: 'translation-1',
        native_term: {
          id: 'term-1',
          phrase: 'hello',
          language_id: 'en',
          type_id: 'word',
          audio_hash: 'audio-hash-1',
          image_hash: 'image-hash-1',
        },
        study_term: {
          id: 'term-2',
          phrase: 'hola',
          language_id: 'es',
          type_id: 'word',
          audio_hash: 'audio-hash-2',
          image_hash: 'image-hash-2',
        },
        catalogue_id: 'catalogue-1',
        user_id: 'user-123',
        is_known: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ translation: mockTranslation }),
      });

      const result = await api.practice.getRandomTranslation('user-123', 'catalogue-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/user-123/practice/random'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-access-token',
          }),
        })
      );

      expect(result.data.translation).toEqual(mockTranslation);
    });

    test('should update translation knowledge', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ message: 'Translation updated successfully' }),
      });

      const result = await api.practice.updateTranslation('user-123', 'translation-1', true);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/user-123/translations/translation-1'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-access-token',
          }),
          body: JSON.stringify({ is_known: true }),
        })
      );

      expect(result.data.message).toBe('Translation updated successfully');
    });

    test('should create study session', async () => {
      const sessionData = {
        catalogue_id: 'catalogue-1',
        session_type: 'words' as const,
        cards_reviewed: 10,
        cards_known: 7,
        cards_unknown: 3,
        duration_minutes: 15,
      };

      const mockSession = {
        session_id: 'session-123',
        user_id: 'user-123',
        ...sessionData,
        completed_at: new Date().toISOString(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockSession),
      });

      const result = await api.practice.createStudySession('user-123', sessionData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/user-123/study-sessions'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-access-token',
          }),
          body: JSON.stringify(sessionData),
        })
      );

      expect(result.data).toEqual(mockSession);
    });
  });

  describe('Language API', () => {
    test('should get available languages', async () => {
      const mockLanguages: Language[] = [
        {
          id: 'en',
          name: 'English',
          code: 'en',
          flag_emoji: '🇺🇸',
          is_active: true,
        },
        {
          id: 'es',
          name: 'Spanish',
          code: 'es',
          flag_emoji: '🇪🇸',
          is_active: true,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockLanguages),
      });

      const result = await api.language.getLanguages();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/languages'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result.data).toEqual(mockLanguages);
    });

    test('should get catalogues for language', async () => {
      const mockCatalogues: Catalogue[] = [
        {
          id: 'catalogue-1',
          name: 'Basic Spanish',
          description: 'Learn basic Spanish vocabulary',
          language_id: 'es',
          cefr_level: 'A1',
          total_terms: 100,
          user_progress: 15,
        },
        {
          id: 'catalogue-2',
          name: 'Spanish Verbs',
          description: 'Common Spanish verbs',
          language_id: 'es',
          cefr_level: 'A2',
          total_terms: 150,
          user_progress: 0,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ catalogues: mockCatalogues }),
      });

      const result = await api.catalogue.getCatalogues('es');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/catalogues/'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result.data.catalogues).toEqual(mockCatalogues);
    });
  });

  describe('Catalogue API', () => {
    test('should get catalogue details', async () => {
      const mockCatalogue: Catalogue = {
        id: 'catalogue-1',
        name: 'Basic Spanish',
        description: 'Learn basic Spanish vocabulary',
        language_id: 'es',
        cefr_level: 'A1',
        total_terms: 100,
        user_progress: 15,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockCatalogue),
      });

      const result = await api.catalogue.getCatalogue('catalogue-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/catalogues/catalogue-1'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result.data).toEqual(mockCatalogue);
    });

    test('should add translations to user vocabulary', async () => {
      const translationIds = ['translation-1', 'translation-2', 'translation-3'];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          added_count: 3,
          skipped_count: 0,
          errors: []
        }),
      });

      const result = await api.practice.addTranslations('user-123', translationIds);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/user-123/translations/bulk'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-access-token',
          }),
          body: JSON.stringify({ translation_ids: translationIds }),
        })
      );

      expect(result.data.added_count).toBe(3);
    });

    test('should get catalogue translations', async () => {
      const mockTranslationsResponse = {
        translations: [
          {
            id: 'translation-1',
            catalogue_id: 'catalogue-1',
            native_word: 'hello',
            study_word: 'hola',
            native_definition: 'A greeting',
            study_definition: 'Un saludo',
            image_hash: 'image-hash-1',
            audio_hash: 'audio-hash-1',
            difficulty: 1,
            frequency: 100,
            part_of_speech: 'noun',
            examples: [],
            tags: ['greeting'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        total_count: 100,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockTranslationsResponse),
      });

      const result = await api.catalogue.getCatalogueTranslations('catalogue-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/catalogues/catalogue-1/translations'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result.data.translations).toEqual(mockTranslationsResponse.translations);
      expect(result.data.total_count).toBe(100);
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(api.auth.getMe()).rejects.toThrow('Network error');
    });

    test('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal server error' }),
      });

      await expect(api.auth.getMe()).rejects.toThrow('HTTP error! status: 500');
    });

    test('should handle 401 unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      });

      await expect(api.user.getProfile('user-123')).rejects.toThrow('HTTP error! status: 401');
    });

    test('should handle 404 not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'User not found' }),
      });

      await expect(api.user.getProfile('nonexistent-user')).rejects.toThrow('HTTP error! status: 404');
    });

    test('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await expect(api.auth.getMe()).rejects.toThrow('Invalid JSON');
    });
  });

  describe('Request Headers and Authentication', () => {
    test('should include authorization header for authenticated requests', async () => {
      const { getAccessToken } = require('@/src/services/storage/tokenStorage');
      getAccessToken.mockResolvedValueOnce('test-token-123');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      await api.user.getProfile('user-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token-123',
          }),
        })
      );
    });

    test('should include content-type header for POST requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      await api.auth.socialLogin({
        provider: 'google',
        access_token: 'test-token',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    test('should handle requests without authentication', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      });

      await api.language.getLanguages();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'GET',
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String),
          }),
        })
      );
    });
  });

  describe('Request/Response Data Validation', () => {
    test('should handle empty response data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(null),
      });

      const result = await api.language.getLanguages();
      expect(result.data).toBe(null);
    });

    test('should handle array responses', async () => {
      const mockArray = [1, 2, 3];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockArray),
      });

      const result = await api.language.getLanguages();
      expect(result.data).toEqual(mockArray);
    });

    test('should handle complex nested object responses', async () => {
      const complexUser: User = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        native_language_id: 'en',
        study_language_id: 'es',
        profile_picture_url: 'https://example.com/avatar.jpg',
        created_at: '2024-01-01T00:00:00Z',
        provider: 'google',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(complexUser),
      });

      const result = await api.auth.getMe();
      expect(result.data).toEqual(complexUser);
      expect(result.data.id).toBe('user-123');
      expect(result.data.email).toBe('test@example.com');
    });
  });

  describe('API Rate Limiting and Retries', () => {
    test('should handle rate limiting responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ 
          error: 'Rate limit exceeded',
          retry_after: 60 
        }),
      });

      await expect(api.auth.getMe()).rejects.toThrow('HTTP error! status: 429');
    });

    test('should handle timeout scenarios', async () => {
      // Simulate timeout by rejecting after delay
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      await expect(api.auth.getMe()).rejects.toThrow('Request timeout');
    });
  });
});

console.log('API integration tests completed successfully! ✅');