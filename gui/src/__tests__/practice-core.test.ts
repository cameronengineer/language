/**
 * Practice System Core Tests
 * Tests flashcard sessions, card interactions, and practice logic
 */

import { usePracticeStore } from '@/src/stores/practiceStore';
import { Translation } from '@/src/types/language';
import { SessionConfig, FlashcardSession, StudySessionResult } from '@/src/types/practice';

// Mock API dependencies
jest.mock('@/src/services/api', () => ({
  api: {
    practice: {
      updateTranslation: jest.fn(),
      createStudySession: jest.fn(),
      getRandomTranslation: jest.fn(),
    },
  },
}));

describe('Practice System Core Logic', () => {
  const mockUserId = 'test-user-123';
  
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

  const mockSessionConfig: SessionConfig = {
    catalogue_id: 'catalogue-1',
    session_type: 'words',
    cards_per_session: 10,
    include_audio: true,
    shuffle_cards: true,
  };

  beforeEach(() => {
    // Reset practice store to initial state
    usePracticeStore.getState().resetSession();
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Store Initialization', () => {
    test('should initialize with correct default state', () => {
      const store = usePracticeStore.getState();
      
      expect(store.currentSession).toBe(null);
      expect(store.currentTranslation).toBe(null);
      expect(store.sessionConfig).toBe(null);
      expect(store.sessionQueue).toEqual([]);
      expect(store.cardsReviewed).toBe(0);
      expect(store.cardsKnown).toBe(0);
      expect(store.cardsUnknown).toBe(0);
      expect(store.sessionDuration).toBe(0);
      expect(store.isLoading).toBe(false);
      expect(store.isSessionActive).toBe(false);
      expect(store.isFlipped).toBe(false);
      expect(store.showInstructions).toBe(true);
      expect(store.error).toBe(null);
      expect(store.currentCard.isRevealed).toBe(false);
      expect(store.currentCard.userAnswer).toBe(null);
      expect(store.currentCard.isLoading).toBe(false);
    });

    test('should reset session correctly', () => {
      // First, set up some state
      usePracticeStore.setState({
        currentSession: {} as FlashcardSession,
        cardsReviewed: 5,
        cardsKnown: 3,
        cardsUnknown: 2,
        isSessionActive: true,
        isFlipped: true,
        error: 'Some error',
      });

      const store = usePracticeStore.getState();
      store.resetSession();

      const resetStore = usePracticeStore.getState();
      expect(resetStore.currentSession).toBe(null);
      expect(resetStore.cardsReviewed).toBe(0);
      expect(resetStore.cardsKnown).toBe(0);
      expect(resetStore.cardsUnknown).toBe(0);
      expect(resetStore.isSessionActive).toBe(false);
      expect(resetStore.isFlipped).toBe(false);
      expect(resetStore.error).toBe(null);
    });
  });

  describe('Session Management', () => {
    test('should start session correctly', async () => {
      const mockApiResponse = {
        data: { translation: mockTranslation },
      };
      
      const mockApi = require('@/src/services/api').api;
      mockApi.practice.getRandomTranslation.mockResolvedValue(mockApiResponse);

      const store = usePracticeStore.getState();
      await store.startSession(mockUserId, mockSessionConfig);

      const updatedStore = usePracticeStore.getState();
      expect(updatedStore.currentSession).toBeDefined();
      expect(updatedStore.sessionConfig).toEqual(mockSessionConfig);
      expect(updatedStore.isSessionActive).toBe(true);
      expect(updatedStore.sessionStartTime).toBeDefined();
      expect(updatedStore.currentSession?.session_type).toBe('words');
      expect(updatedStore.cardsReviewed).toBe(0);
      expect(updatedStore.cardsKnown).toBe(0);
      expect(updatedStore.cardsUnknown).toBe(0);
    });

    test('should handle session start failure', async () => {
      const mockApi = require('@/src/services/api').api;
      mockApi.practice.getRandomTranslation.mockRejectedValue(new Error('API Error'));

      const store = usePracticeStore.getState();
      await store.startSession(mockUserId, mockSessionConfig);

      const updatedStore = usePracticeStore.getState();
      expect(updatedStore.error).toContain('Failed to load next card');
      expect(updatedStore.isLoading).toBe(false);
      expect(updatedStore.isSessionActive).toBe(true); // Session starts but card loading fails
    });

    test('should end session and save results', async () => {
      const mockApi = require('@/src/services/api').api;
      mockApi.practice.createStudySession.mockResolvedValue({});

      // Set up active session
      usePracticeStore.setState({
        currentSession: {
          current_translation: mockTranslation,
          session_start: new Date(),
          cards_reviewed: 5,
          cards_known: 3,
          cards_unknown: 2,
          session_type: 'words',
        },
        sessionConfig: mockSessionConfig,
        sessionStartTime: new Date(),
        isSessionActive: true,
        cardsReviewed: 5,
        cardsKnown: 3,
        cardsUnknown: 2,
        sessionDuration: 10,
      });

      const store = usePracticeStore.getState();
      await store.endSession(mockUserId);

      expect(mockApi.practice.createStudySession).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          catalogue_id: mockSessionConfig.catalogue_id,
          session_type: mockSessionConfig.session_type,
          cards_reviewed: 5,
          cards_known: 3,
          cards_unknown: 2,
          duration_minutes: 10,
        })
      );

      const updatedStore = usePracticeStore.getState();
      expect(updatedStore.currentSession).toBe(null);
      expect(updatedStore.isSessionActive).toBe(false);
      expect(updatedStore.cardsReviewed).toBe(0);
    });

    test('should handle end session failure', async () => {
      const mockApi = require('@/src/services/api').api;
      mockApi.practice.createStudySession.mockRejectedValue(new Error('Save failed'));

      usePracticeStore.setState({
        currentSession: {} as FlashcardSession,
        sessionConfig: mockSessionConfig,
        isSessionActive: true,
      });

      const store = usePracticeStore.getState();
      await store.endSession(mockUserId);

      const updatedStore = usePracticeStore.getState();
      expect(updatedStore.error).toContain('Failed to save session results');
    });

    test('should pause and resume session', () => {
      usePracticeStore.setState({ isSessionActive: true });

      const store = usePracticeStore.getState();
      store.pauseSession();
      expect(usePracticeStore.getState().isSessionActive).toBe(false);

      store.resumeSession();
      expect(usePracticeStore.getState().isSessionActive).toBe(true);
    });
  });

  describe('Card Interactions', () => {
    beforeEach(() => {
      // Set up basic session state
      usePracticeStore.setState({
        currentTranslation: mockTranslation,
        isSessionActive: true,
        currentCard: {
          isRevealed: false,
          userAnswer: null,
          isLoading: false,
        },
        isFlipped: false,
      });
    });

    test('should flip card correctly', () => {
      const store = usePracticeStore.getState();
      store.flipCard();

      const updatedStore = usePracticeStore.getState();
      expect(updatedStore.isFlipped).toBe(true);
      expect(updatedStore.currentCard.isRevealed).toBe(true);
    });

    test('should not flip card when already flipped', () => {
      usePracticeStore.setState({ isFlipped: true });

      const store = usePracticeStore.getState();
      const initialState = usePracticeStore.getState();
      store.flipCard();

      const updatedStore = usePracticeStore.getState();
      expect(updatedStore.isFlipped).toBe(initialState.isFlipped);
    });

    test('should not flip card when loading', () => {
      usePracticeStore.setState({
        currentCard: {
          isRevealed: false,
          userAnswer: null,
          isLoading: true,
        },
      });

      const store = usePracticeStore.getState();
      store.flipCard();

      const updatedStore = usePracticeStore.getState();
      expect(updatedStore.isFlipped).toBe(false);
    });

    test('should mark card as known', async () => {
      const mockApi = require('@/src/services/api').api;
      mockApi.practice.updateTranslation.mockResolvedValue({});
      mockApi.practice.getRandomTranslation.mockResolvedValue({
        data: { translation: mockTranslation },
      });

      usePracticeStore.setState({
        isFlipped: true,
        cardsKnown: 0,
        cardsReviewed: 0,
      });

      const store = usePracticeStore.getState();
      
      // Mock setTimeout to execute immediately
      jest.spyOn(global, 'setTimeout').mockImplementation((fn: any) => fn());

      await store.markCardKnown(mockUserId);

      expect(mockApi.practice.updateTranslation).toHaveBeenCalledWith(
        mockUserId,
        mockTranslation.id,
        true
      );

      const updatedStore = usePracticeStore.getState();
      expect(updatedStore.cardsKnown).toBe(1);
      expect(updatedStore.cardsReviewed).toBe(1);
    });

    test('should mark card as unknown', async () => {
      const mockApi = require('@/src/services/api').api;
      mockApi.practice.updateTranslation.mockResolvedValue({});
      mockApi.practice.getRandomTranslation.mockResolvedValue({
        data: { translation: mockTranslation },
      });

      usePracticeStore.setState({
        isFlipped: true,
        cardsUnknown: 0,
        cardsReviewed: 0,
      });

      const store = usePracticeStore.getState();
      
      jest.spyOn(global, 'setTimeout').mockImplementation((fn: any) => fn());

      await store.markCardUnknown(mockUserId);

      expect(mockApi.practice.updateTranslation).toHaveBeenCalledWith(
        mockUserId,
        mockTranslation.id,
        false
      );

      const updatedStore = usePracticeStore.getState();
      expect(updatedStore.cardsUnknown).toBe(1);
      expect(updatedStore.cardsReviewed).toBe(1);
    });

    test('should not mark card when not flipped', async () => {
      usePracticeStore.setState({ isFlipped: false });

      const store = usePracticeStore.getState();
      await store.markCardKnown(mockUserId);
      await store.markCardUnknown(mockUserId);

      const updatedStore = usePracticeStore.getState();
      expect(updatedStore.cardsKnown).toBe(0);
      expect(updatedStore.cardsUnknown).toBe(0);
      expect(updatedStore.cardsReviewed).toBe(0);
    });

    test('should handle card marking failure', async () => {
      const mockApi = require('@/src/services/api').api;
      mockApi.practice.updateTranslation.mockRejectedValue(new Error('Update failed'));

      usePracticeStore.setState({ isFlipped: true });

      const store = usePracticeStore.getState();
      await store.markCardKnown(mockUserId);

      const updatedStore = usePracticeStore.getState();
      expect(updatedStore.error).toContain('Failed to save progress');
      expect(updatedStore.currentCard.isLoading).toBe(false);
    });
  });

  describe('Card Loading', () => {
    test('should load next card successfully', async () => {
      const mockApi = require('@/src/services/api').api;
      mockApi.practice.getRandomTranslation.mockResolvedValue({
        data: { translation: mockTranslation },
      });

      usePracticeStore.setState({
        sessionConfig: mockSessionConfig,
        cardsReviewed: 0,
        currentSession: {} as FlashcardSession,
      });

      const store = usePracticeStore.getState();
      await store.loadNextCard(mockUserId);

      expect(mockApi.practice.getRandomTranslation).toHaveBeenCalledWith(
        mockUserId,
        mockSessionConfig.catalogue_id
      );

      const updatedStore = usePracticeStore.getState();
      expect(updatedStore.currentTranslation).toEqual(mockTranslation);
      expect(updatedStore.isLoading).toBe(false);
      expect(updatedStore.isFlipped).toBe(false);
      expect(updatedStore.currentCard.isRevealed).toBe(false);
      expect(updatedStore.currentCard.userAnswer).toBe(null);
      expect(updatedStore.error).toBe(null);
    });

    test('should end session when cards per session reached', async () => {
      usePracticeStore.setState({
        sessionConfig: { ...mockSessionConfig, cards_per_session: 5 },
        cardsReviewed: 5,
        isSessionActive: true,
        currentSession: {} as FlashcardSession,
      });

      const mockApi = require('@/src/services/api').api;
      mockApi.practice.createStudySession.mockResolvedValue({});

      const store = usePracticeStore.getState();
      await store.loadNextCard(mockUserId);

      const updatedStore = usePracticeStore.getState();
      expect(updatedStore.isSessionActive).toBe(false);
      expect(updatedStore.currentSession).toBe(null);
    });

    test('should handle no cards available', async () => {
      const mockApi = require('@/src/services/api').api;
      mockApi.practice.getRandomTranslation.mockResolvedValue({
        data: { translation: null },
      });

      const store = usePracticeStore.getState();
      await store.loadNextCard(mockUserId);

      const updatedStore = usePracticeStore.getState();
      expect(updatedStore.error).toContain('No more cards available');
      expect(updatedStore.isLoading).toBe(false);
    });

    test('should handle card loading failure', async () => {
      const mockApi = require('@/src/services/api').api;
      mockApi.practice.getRandomTranslation.mockRejectedValue(new Error('Load failed'));

      const store = usePracticeStore.getState();
      await store.loadNextCard(mockUserId);

      const updatedStore = usePracticeStore.getState();
      expect(updatedStore.error).toContain('Failed to load next card');
      expect(updatedStore.isLoading).toBe(false);
      expect(updatedStore.currentCard.isLoading).toBe(false);
    });
  });

  describe('Progress Tracking', () => {
    test('should update session progress correctly', () => {
      const startTime = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      
      usePracticeStore.setState({
        sessionStartTime: startTime,
        cardsReviewed: 3,
        cardsKnown: 2,
        cardsUnknown: 1,
        currentSession: {
          current_translation: null,
          session_start: startTime,
          cards_reviewed: 0,
          cards_known: 0,
          cards_unknown: 0,
          session_type: 'words',
        },
      });

      const store = usePracticeStore.getState();
      store.updateSessionProgress();

      const updatedStore = usePracticeStore.getState();
      expect(updatedStore.sessionDuration).toBeGreaterThan(0);
      expect(updatedStore.currentSession?.cards_reviewed).toBe(3);
      expect(updatedStore.currentSession?.cards_known).toBe(2);
      expect(updatedStore.currentSession?.cards_unknown).toBe(1);
    });

    test('should handle progress tracking without start time', () => {
      usePracticeStore.setState({
        sessionStartTime: null,
        currentSession: null,
      });

      const store = usePracticeStore.getState();
      store.updateSessionProgress();

      const updatedStore = usePracticeStore.getState();
      expect(updatedStore.sessionDuration).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should clear error state', () => {
      usePracticeStore.setState({ error: 'Some error message' });

      const store = usePracticeStore.getState();
      store.clearError();

      const updatedStore = usePracticeStore.getState();
      expect(updatedStore.error).toBe(null);
    });

    test('should handle multiple error scenarios', () => {
      const errors = [
        'Network error',
        'Invalid session',
        'No cards available',
        'Save failed',
      ];

      errors.forEach(errorMessage => {
        usePracticeStore.setState({ error: errorMessage });
        expect(usePracticeStore.getState().error).toBe(errorMessage);
      });
    });
  });

  describe('UI State Management', () => {
    test('should toggle instructions visibility', () => {
      expect(usePracticeStore.getState().showInstructions).toBe(true);

      const store = usePracticeStore.getState();
      store.toggleInstructions();
      expect(usePracticeStore.getState().showInstructions).toBe(false);

      store.toggleInstructions();
      expect(usePracticeStore.getState().showInstructions).toBe(true);
    });

    test('should handle loading states correctly', () => {
      usePracticeStore.setState({ isLoading: true });
      expect(usePracticeStore.getState().isLoading).toBe(true);

      usePracticeStore.setState({ isLoading: false });
      expect(usePracticeStore.getState().isLoading).toBe(false);
    });

    test('should handle card state transitions', () => {
      const initialCard = {
        isRevealed: false,
        userAnswer: null,
        isLoading: false,
      };

      usePracticeStore.setState({ currentCard: initialCard });
      expect(usePracticeStore.getState().currentCard).toEqual(initialCard);

      const revealedCard = {
        isRevealed: true,
        userAnswer: 'known' as const,
        isLoading: false,
      };

      usePracticeStore.setState({ currentCard: revealedCard });
      expect(usePracticeStore.getState().currentCard).toEqual(revealedCard);
    });
  });

  describe('Session Types', () => {
    test('should handle word practice sessions', async () => {
      const wordConfig: SessionConfig = {
        ...mockSessionConfig,
        session_type: 'words',
      };

      const mockApi = require('@/src/services/api').api;
      mockApi.practice.getRandomTranslation.mockResolvedValue({
        data: { translation: mockTranslation },
      });

      const store = usePracticeStore.getState();
      await store.startSession(mockUserId, wordConfig);

      const updatedStore = usePracticeStore.getState();
      expect(updatedStore.currentSession?.session_type).toBe('words');
      expect(updatedStore.sessionConfig?.session_type).toBe('words');
    });

    test('should handle sentence practice sessions', async () => {
      const sentenceConfig: SessionConfig = {
        ...mockSessionConfig,
        session_type: 'sentences',
      };

      const mockApi = require('@/src/services/api').api;
      mockApi.practice.getRandomTranslation.mockResolvedValue({
        data: { translation: mockTranslation },
      });

      const store = usePracticeStore.getState();
      await store.startSession(mockUserId, sentenceConfig);

      const updatedStore = usePracticeStore.getState();
      expect(updatedStore.currentSession?.session_type).toBe('sentences');
      expect(updatedStore.sessionConfig?.session_type).toBe('sentences');
    });
  });

  describe('Edge Cases', () => {
    test('should handle session end when no active session', async () => {
      usePracticeStore.setState({
        isSessionActive: false,
        currentSession: null,
      });

      const store = usePracticeStore.getState();
      await store.endSession(mockUserId);

      // Should not throw error and state should remain unchanged
      const updatedStore = usePracticeStore.getState();
      expect(updatedStore.isSessionActive).toBe(false);
      expect(updatedStore.currentSession).toBe(null);
    });

    test('should handle card actions without current translation', async () => {
      usePracticeStore.setState({
        currentTranslation: null,
        isFlipped: true,
      });

      const store = usePracticeStore.getState();
      await store.markCardKnown(mockUserId);
      await store.markCardUnknown(mockUserId);

      const updatedStore = usePracticeStore.getState();
      expect(updatedStore.cardsKnown).toBe(0);
      expect(updatedStore.cardsUnknown).toBe(0);
    });

    test('should handle rapid consecutive actions', async () => {
      const mockApi = require('@/src/services/api').api;
      mockApi.practice.updateTranslation.mockResolvedValue({});
      mockApi.practice.getRandomTranslation.mockResolvedValue({
        data: { translation: mockTranslation },
      });

      usePracticeStore.setState({
        currentTranslation: mockTranslation,
        isFlipped: true,
      });

      jest.spyOn(global, 'setTimeout').mockImplementation((fn: any) => fn());

      const store = usePracticeStore.getState();
      
      // Fire multiple actions rapidly
      const promises = [
        store.markCardKnown(mockUserId),
        store.markCardKnown(mockUserId),
        store.markCardKnown(mockUserId),
      ];

      await Promise.all(promises);

      // Should handle gracefully without errors
      const updatedStore = usePracticeStore.getState();
      expect(updatedStore.error).toBe(null);
    });
  });
});

console.log('Practice system tests completed successfully! ✅');