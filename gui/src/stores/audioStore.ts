/**
 * Audio Store - Zustand state management for audio functionality
 * Manages audio playback state, settings, cache, and user preferences
 */

import { create } from 'zustand';
import { audioService } from '@/src/services/audio';
import {
  AudioStoreState,
  AudioStoreActions,
  AudioSettings,
  AudioPlaybackOptions,
  AudioPlaybackState,
  AudioError,
  AudioCacheStats,
  AudioEvent,
  AudioEventType,
} from '@/src/types/audio';

interface AudioStore extends AudioStoreState, AudioStoreActions {}

export const useAudioStore = create<AudioStore>((set, get) => ({
  // Initial state
  currentAudio: null,
  playbackState: 'idle',
  loadingState: 'idle',
  volume: 1.0,
  
  settings: {
    volume: 1.0,
    autoPlay: true,
    preloadEnabled: true,
    cacheEnabled: true,
    networkOnlyOnWifi: false,
    retryCount: 3,
    retryDelay: 1000,
  },
  
  cache: new Map(),
  cacheStats: {
    totalEntries: 0,
    totalMemoryUsage: 0,
    hitRate: 0,
    oldestEntry: null,
    newestEntry: null,
    averageUseCount: 0,
  },
  
  preloadProgress: null,
  queue: [],
  isProcessingQueue: false,
  lastError: null,
  errorHistory: [],
  playbackHistory: [],

  // Actions
  play: async (studyWord: string, options?: AudioPlaybackOptions) => {
    if (!studyWord) {
      console.warn('Cannot play audio: studyWord is required');
      return;
    }

    const state = get();
    
    try {
      // Clear any previous errors
      set({ lastError: null, loadingState: 'loading', currentAudio: studyWord });
      
      // Play audio using the service
      await audioService.playAudio(studyWord, options);
      
      // Update state on successful playback
      set({
        playbackState: 'playing',
        loadingState: 'loaded',
        currentAudio: studyWord,
      });
      
      // Add to playback history
      const newPlaybackEntry = {
        studyWord,
        playedAt: new Date(),
        duration: 0, // Will be updated when playback completes
        wasSuccessful: true,
      };
      
      set({
        playbackHistory: [newPlaybackEntry, ...state.playbackHistory.slice(0, 49)], // Keep last 50
      });
      
    } catch (error) {
      console.error('Failed to play audio:', error);
      
      const audioError: AudioError = {
        type: 'playback_failed',
        message: `Failed to play audio for: ${studyWord}`,
        studyWord,
        timestamp: new Date(),
      };
      
      set({
        playbackState: 'error',
        loadingState: 'failed',
        lastError: audioError,
        errorHistory: [audioError, ...state.errorHistory.slice(0, 9)], // Keep last 10
      });
      
      // Add failed playback to history
      const failedPlaybackEntry = {
        studyWord,
        playedAt: new Date(),
        duration: 0,
        wasSuccessful: false,
      };
      
      set({
        playbackHistory: [failedPlaybackEntry, ...state.playbackHistory.slice(0, 49)],
      });
    }
  },

  stop: async () => {
    try {
      await audioService.stopAudio();
      set({
        playbackState: 'stopped',
        currentAudio: null,
      });
    } catch (error) {
      console.error('Failed to stop audio:', error);
    }
  },

  pause: async () => {
    try {
      await audioService.pauseAudio();
      set({ playbackState: 'paused' });
    } catch (error) {
      console.error('Failed to pause audio:', error);
    }
  },

  resume: async () => {
    try {
      await audioService.resumeAudio();
      set({ playbackState: 'playing' });
    } catch (error) {
      console.error('Failed to resume audio:', error);
    }
  },

  setVolume: (volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    
    set((state) => ({
      volume: clampedVolume,
      settings: { ...state.settings, volume: clampedVolume },
    }));
    
    // Update the audio service volume
    audioService.setVolume(clampedVolume);
  },

  updateSettings: (newSettings: Partial<AudioSettings>) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    }));
    
    // Update the audio service settings
    audioService.updateSettings(newSettings);
    
    // Handle volume change
    if (newSettings.volume !== undefined) {
      set({ volume: newSettings.volume });
    }
  },

  preloadAudio: async (studyWords: string[]) => {
    const state = get();
    
    if (!state.settings.preloadEnabled || studyWords.length === 0) {
      return;
    }

    try {
      // Set up preload progress
      set({
        preloadProgress: {
          total: studyWords.length,
          completed: 0,
          failed: 0,
          currentWord: studyWords[0] || null,
          isComplete: false,
          startTime: new Date(),
          estimatedTimeRemaining: 0,
        },
      });

      // Start preloading
      await audioService.preloadAudio(studyWords);
      
      // Update cache stats
      const cacheStats = audioService.getCacheStats();
      set({ cacheStats });
      
      // Mark preload as complete
      set((state) => ({
        preloadProgress: state.preloadProgress ? {
          ...state.preloadProgress,
          completed: studyWords.length,
          isComplete: true,
          currentWord: null,
        } : null,
      }));
      
    } catch (error) {
      console.error('Preload failed:', error);
      
      set((state) => ({
        preloadProgress: state.preloadProgress ? {
          ...state.preloadProgress,
          failed: state.preloadProgress.failed + 1,
          isComplete: true,
        } : null,
      }));
    }
  },

  clearCache: async () => {
    try {
      await audioService.clearCache();
      
      set({
        cache: new Map(),
        cacheStats: {
          totalEntries: 0,
          totalMemoryUsage: 0,
          hitRate: 0,
          oldestEntry: null,
          newestEntry: null,
          averageUseCount: 0,
        },
      });
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  },

  removeFromCache: async (studyWord: string) => {
    const state = get();
    const newCache = new Map(state.cache);
    newCache.delete(studyWord);
    
    set({ cache: newCache });
    
    // Update cache stats
    const cacheStats = audioService.getCacheStats();
    set({ cacheStats });
  },

  addToQueue: (studyWord: string, options?: AudioPlaybackOptions, priority: number = 0) => {
    const state = get();
    
    const queueEntry = {
      studyWord,
      options,
      priority,
      addedAt: new Date(),
    };
    
    // Insert based on priority (higher priority first)
    const newQueue = [...state.queue, queueEntry].sort((a, b) => b.priority - a.priority);
    
    set({ queue: newQueue });
  },

  clearQueue: () => {
    set({ queue: [] });
  },

  processQueue: async () => {
    const state = get();
    
    if (state.isProcessingQueue || state.queue.length === 0) {
      return;
    }
    
    set({ isProcessingQueue: true });
    
    try {
      while (state.queue.length > 0) {
        const nextItem = state.queue[0];
        
        // Remove from queue
        set((state) => ({ queue: state.queue.slice(1) }));
        
        // Play the audio
        await get().play(nextItem.studyWord, nextItem.options);
        
        // Wait for playback to complete (simplified)
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error('Error processing audio queue:', error);
    } finally {
      set({ isProcessingQueue: false });
    }
  },

  clearError: () => {
    set({ lastError: null });
  },

  clearErrorHistory: () => {
    set({ errorHistory: [] });
  },

  reset: () => {
    set({
      currentAudio: null,
      playbackState: 'idle',
      loadingState: 'idle',
      queue: [],
      isProcessingQueue: false,
      lastError: null,
      preloadProgress: null,
    });
  },

  initialize: async () => {
    try {
      await audioService.initialize();
      
      // Set up event listeners for audio service events
      const handleAudioEvent = (event: AudioEvent) => {
        const state = get();
        
        switch (event.type) {
          case 'play_started':
            set({ playbackState: 'playing' });
            break;
            
          case 'play_completed':
            set({ 
              playbackState: 'ended',
              currentAudio: null,
            });
            break;
            
          case 'play_failed':
            if (event.error) {
              set({
                playbackState: 'error',
                lastError: event.error,
                errorHistory: [event.error, ...state.errorHistory.slice(0, 9)],
              });
            }
            break;
            
          case 'volume_changed':
            if (event.data?.volume !== undefined) {
              set({ volume: event.data.volume });
            }
            break;
            
          case 'cache_cleared':
            set({
              cache: new Map(),
              cacheStats: {
                totalEntries: 0,
                totalMemoryUsage: 0,
                hitRate: 0,
                oldestEntry: null,
                newestEntry: null,
                averageUseCount: 0,
              },
            });
            break;
        }
      };
      
      // Register event listeners
      const eventTypes: AudioEventType[] = [
        'play_started',
        'play_completed', 
        'play_failed',
        'volume_changed',
        'cache_cleared'
      ];
      
      eventTypes.forEach(type => {
        audioService.addEventListener(type, handleAudioEvent);
      });
      
      // Load initial settings
      const settings = audioService.getSettings();
      set({ 
        settings,
        volume: settings.volume,
      });
      
    } catch (error) {
      console.error('Failed to initialize audio store:', error);
      
      const audioError: AudioError = {
        type: 'unknown_error',
        message: 'Failed to initialize audio system',
        timestamp: new Date(),
      };
      
      set({ lastError: audioError });
    }
  },

  cleanup: async () => {
    try {
      await get().stop();
      await audioService.cleanup();
      get().reset();
    } catch (error) {
      console.error('Failed to cleanup audio store:', error);
    }
  },
}));

// Helper functions for common audio operations
export const audioHelpers = {
  /**
   * Quick play function with error handling
   */
  quickPlay: async (studyWord: string, options?: AudioPlaybackOptions) => {
    const store = useAudioStore.getState();
    try {
      await store.play(studyWord, options);
    } catch (error) {
      console.error('Quick play failed:', error);
    }
  },

  /**
   * Auto-play with settings check
   */
  autoPlay: async (studyWord: string, options?: AudioPlaybackOptions) => {
    const store = useAudioStore.getState();
    if (store.settings.autoPlay) {
      return audioHelpers.quickPlay(studyWord, options);
    }
  },

  /**
   * Check if audio is available (not playing/loading)
   */
  isAudioAvailable: (): boolean => {
    const store = useAudioStore.getState();
    return !['playing', 'loading'].includes(store.playbackState);
  },

  /**
   * Get formatted playback stats
   */
  getPlaybackStats: () => {
    const store = useAudioStore.getState();
    const history = store.playbackHistory;
    
    const successful = history.filter(h => h.wasSuccessful).length;
    const failed = history.filter(h => !h.wasSuccessful).length;
    const total = history.length;
    
    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total) * 100 : 0,
    };
  },
};

export default useAudioStore;