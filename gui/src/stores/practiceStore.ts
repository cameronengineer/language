import { create } from 'zustand';
import { api } from '@/src/services/api';
import { Translation } from '@/src/types/language';
import { 
  FlashcardSession, 
  FlashcardState, 
  StudySessionResult, 
  SessionConfig 
} from '@/src/types/practice';

interface PracticeStore {
  // Current session state
  currentSession: FlashcardSession | null;
  currentCard: FlashcardState;
  sessionQueue: Translation[];
  currentTranslation: Translation | null;
  sessionConfig: SessionConfig | null;
  
  // Session progress
  sessionStartTime: Date | null;
  cardsReviewed: number;
  cardsKnown: number;
  cardsUnknown: number;
  sessionDuration: number;
  
  // UI state
  isLoading: boolean;
  isSessionActive: boolean;
  error: string | null;
  isFlipped: boolean;
  showInstructions: boolean;
  
  // Actions
  startSession: (userId: string, config: SessionConfig) => Promise<void>;
  endSession: (userId: string) => Promise<void>;
  flipCard: () => void;
  markCardKnown: (userId: string) => Promise<void>;
  markCardUnknown: (userId: string) => Promise<void>;
  loadNextCard: (userId: string) => Promise<void>;
  pauseSession: () => void;
  resumeSession: () => void;
  resetSession: () => void;
  toggleInstructions: () => void;
  clearError: () => void;
  
  // Session management
  updateSessionProgress: () => void;
  saveSessionResult: (userId: string) => Promise<void>;
  getRandomTranslation: (userId: string, catalogueId?: string) => Promise<Translation | null>;
}

export const usePracticeStore = create<PracticeStore>((set, get) => ({
  // Initial state
  currentSession: null,
  currentCard: {
    isRevealed: false,
    userAnswer: null,
    isLoading: false,
  },
  sessionQueue: [],
  currentTranslation: null,
  sessionConfig: null,
  
  sessionStartTime: null,
  cardsReviewed: 0,
  cardsKnown: 0,
  cardsUnknown: 0,
  sessionDuration: 0,
  
  isLoading: false,
  isSessionActive: false,
  error: null,
  isFlipped: false,
  showInstructions: true,
  
  // Actions
  startSession: async (userId: string, config: SessionConfig) => {
    set({ isLoading: true, error: null });
    
    try {
      const startTime = new Date();
      
      // Initialize session
      const session: FlashcardSession = {
        current_translation: null,
        session_start: startTime,
        cards_reviewed: 0,
        cards_known: 0,
        cards_unknown: 0,
        session_type: config.session_type,
      };
      
      set({
        currentSession: session,
        sessionConfig: config,
        sessionStartTime: startTime,
        cardsReviewed: 0,
        cardsKnown: 0,
        cardsUnknown: 0,
        sessionDuration: 0,
        isSessionActive: true,
        isFlipped: false,
        currentCard: {
          isRevealed: false,
          userAnswer: null,
          isLoading: false,
        },
      });
      
      // Load first card
      await get().loadNextCard(userId);
      
    } catch (error) {
      console.error('Failed to start practice session:', error);
      set({ 
        error: 'Failed to start practice session. Please try again.',
        isLoading: false 
      });
    }
  },
  
  endSession: async (userId: string) => {
    const state = get();
    
    if (!state.isSessionActive || !state.currentSession) {
      return;
    }
    
    try {
      // Save session results
      await state.saveSessionResult(userId);
      
      // Reset state
      set({
        currentSession: null,
        sessionConfig: null,
        sessionStartTime: null,
        currentTranslation: null,
        sessionQueue: [],
        cardsReviewed: 0,
        cardsKnown: 0,
        cardsUnknown: 0,
        sessionDuration: 0,
        isSessionActive: false,
        isFlipped: false,
        currentCard: {
          isRevealed: false,
          userAnswer: null,
          isLoading: false,
        },
        error: null,
      });
      
    } catch (error) {
      console.error('Failed to end practice session:', error);
      set({ error: 'Failed to save session results.' });
    }
  },
  
  flipCard: () => {
    const state = get();
    
    if (state.currentCard.isLoading || state.isFlipped) {
      return;
    }
    
    set({
      isFlipped: true,
      currentCard: {
        ...state.currentCard,
        isRevealed: true,
      },
    });
  },
  
  markCardKnown: async (userId: string) => {
    const state = get();
    
    if (!state.currentTranslation || !state.isFlipped) {
      return;
    }
    
    set({
      currentCard: {
        ...state.currentCard,
        userAnswer: 'known',
        isLoading: true,
      },
    });
    
    try {
      // Update translation knowledge status
      if (state.currentTranslation.id) {
        await api.practice.updateTranslation(
          userId, 
          state.currentTranslation.id, 
          true
        );
      }
      
      // Update session progress
      set({
        cardsKnown: state.cardsKnown + 1,
        cardsReviewed: state.cardsReviewed + 1,
      });
      
      get().updateSessionProgress();
      
      // Load next card after a brief delay
      setTimeout(() => {
        get().loadNextCard(userId);
      }, 500);
      
    } catch (error) {
      console.error('Failed to mark card as known:', error);
      set({ 
        error: 'Failed to save progress. Please try again.',
        currentCard: {
          ...state.currentCard,
          isLoading: false,
        },
      });
    }
  },
  
  markCardUnknown: async (userId: string) => {
    const state = get();
    
    if (!state.currentTranslation || !state.isFlipped) {
      return;
    }
    
    set({
      currentCard: {
        ...state.currentCard,
        userAnswer: 'unknown',
        isLoading: true,
      },
    });
    
    try {
      // Update translation knowledge status
      if (state.currentTranslation.id) {
        await api.practice.updateTranslation(
          userId, 
          state.currentTranslation.id, 
          false
        );
      }
      
      // Update session progress
      set({
        cardsUnknown: state.cardsUnknown + 1,
        cardsReviewed: state.cardsReviewed + 1,
      });
      
      get().updateSessionProgress();
      
      // Load next card after a brief delay
      setTimeout(() => {
        get().loadNextCard(userId);
      }, 500);
      
    } catch (error) {
      console.error('Failed to mark card as unknown:', error);
      set({ 
        error: 'Failed to save progress. Please try again.',
        currentCard: {
          ...state.currentCard,
          isLoading: false,
        },
      });
    }
  },
  
  loadNextCard: async (userId: string) => {
    const state = get();
    
    set({
      currentCard: {
        isRevealed: false,
        userAnswer: null,
        isLoading: true,
      },
      isFlipped: false,
      isLoading: true,
    });
    
    try {
      // Check if session should end
      if (state.sessionConfig && state.cardsReviewed >= state.sessionConfig.cards_per_session) {
        await state.endSession(userId);
        return;
      }
      
      // Get random translation
      const translation = await state.getRandomTranslation(
        userId,
        state.sessionConfig?.catalogue_id
      );
      
      if (!translation) {
        set({ 
          error: 'No more cards available for practice.',
          isLoading: false 
        });
        return;
      }
      
      set({
        currentTranslation: translation,
        currentCard: {
          isRevealed: false,
          userAnswer: null,
          isLoading: false,
        },
        isLoading: false,
        error: null,
      });
      
      // Update session with current translation
      if (state.currentSession) {
        set({
          currentSession: {
            ...state.currentSession,
            current_translation: translation,
          },
        });
      }
      
    } catch (error) {
      console.error('Failed to load next card:', error);
      set({ 
        error: 'Failed to load next card. Please try again.',
        isLoading: false,
        currentCard: {
          isRevealed: false,
          userAnswer: null,
          isLoading: false,
        },
      });
    }
  },
  
  pauseSession: () => {
    set({ isSessionActive: false });
  },
  
  resumeSession: () => {
    set({ isSessionActive: true });
  },
  
  resetSession: () => {
    set({
      currentSession: null,
      sessionConfig: null,
      sessionStartTime: null,
      currentTranslation: null,
      sessionQueue: [],
      cardsReviewed: 0,
      cardsKnown: 0,
      cardsUnknown: 0,
      sessionDuration: 0,
      isSessionActive: false,
      isFlipped: false,
      currentCard: {
        isRevealed: false,
        userAnswer: null,
        isLoading: false,
      },
      error: null,
      isLoading: false,
    });
  },
  
  toggleInstructions: () => {
    set({ showInstructions: !get().showInstructions });
  },
  
  clearError: () => {
    set({ error: null });
  },
  
  // Session management helpers
  updateSessionProgress: () => {
    const state = get();
    
    if (state.sessionStartTime) {
      const now = new Date();
      const duration = Math.floor((now.getTime() - state.sessionStartTime.getTime()) / 1000 / 60);
      set({ sessionDuration: duration });
    }
    
    if (state.currentSession) {
      set({
        currentSession: {
          ...state.currentSession,
          cards_reviewed: state.cardsReviewed,
          cards_known: state.cardsKnown,
          cards_unknown: state.cardsUnknown,
        },
      });
    }
  },
  
  saveSessionResult: async (userId: string) => {
    const state = get();
    
    if (!state.currentSession || !state.sessionConfig) {
      return;
    }
    
    try {
      const sessionResult = {
        catalogue_id: state.sessionConfig.catalogue_id,
        session_type: state.sessionConfig.session_type,
        cards_reviewed: state.cardsReviewed,
        cards_known: state.cardsKnown,
        cards_unknown: state.cardsUnknown,
        duration_minutes: state.sessionDuration,
      };
      
      await api.practice.createStudySession(userId, sessionResult);
      
    } catch (error) {
      console.error('Failed to save session result:', error);
      throw error;
    }
  },
  
  getRandomTranslation: async (userId: string, catalogueId?: string): Promise<Translation | null> => {
    try {
      const response = await api.practice.getRandomTranslation(userId, catalogueId);
      
      if (response.data && response.data.translation) {
        return response.data.translation;
      }
      
      return null;
      
    } catch (error) {
      console.error('Failed to get random translation:', error);
      throw error;
    }
  },
}));

export default usePracticeStore;