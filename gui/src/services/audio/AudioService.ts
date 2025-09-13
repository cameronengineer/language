/**
 * AudioService - High-level audio service for language learning
 * Provides a clean interface for audio operations with caching and error handling
 */

import {
  AudioService as IAudioService,
  AudioSettings,
  AudioPlaybackOptions,
  AudioPlaybackState,
  AudioError,
  AudioCacheStats,
  AudioEvent,
  AudioEventType,
  AudioEventListener,
} from '@/src/types/audio';
import { audioManager } from './AudioManager';
import { getCachedAudioUrl } from '@/src/utils/hashUtils';

class AudioService implements IAudioService {
  private currentAudio: string | null = null;
  private playbackState: AudioPlaybackState = 'idle';
  private volume: number = 1.0;
  private lastError: AudioError | null = null;
  private eventListeners: Map<AudioEventType, AudioEventListener[]> = new Map();
  
  private settings: AudioSettings = {
    volume: 1.0,
    autoPlay: true,
    preloadEnabled: true,
    cacheEnabled: true,
    networkOnlyOnWifi: false,
    retryCount: 3,
    retryDelay: 1000,
  };

  private cache: Map<string, any> = new Map(); // Study word -> Sound
  private cacheStats = {
    hits: 0,
    misses: 0,
    loads: 0,
    errors: 0,
  };

  constructor() {
    this.initializeEventListeners();
  }

  /**
   * Initialize the audio service
   */
  async initialize(): Promise<void> {
    try {
      await audioManager.initialize();
      this.emitEvent('settings_updated', { settings: this.settings });
    } catch (error) {
      this.handleError('unknown_error', 'Failed to initialize audio service', error);
      throw error;
    }
  }

  /**
   * Play audio for a study word
   */
  async playAudio(studyWord: string, options?: AudioPlaybackOptions): Promise<void> {
    if (!studyWord) {
      throw this.createError('playback_failed', 'Study word is required');
    }

    try {
      this.setPlaybackState('loading');
      this.currentAudio = studyWord;

      // Load sound (either from cache or fresh)
      let sound = this.cache.get(studyWord);
      
      if (!sound) {
        this.cacheStats.misses++;
        sound = await this.loadAndCacheSound(studyWord);
      } else {
        this.cacheStats.hits++;
      }

      // Apply playback options
      const playbackOptions = {
        volume: options?.volume ?? this.volume,
        rate: options?.rate ?? 1.0,
        shouldCorrectPitch: options?.shouldCorrectPitch ?? true,
        loop: options?.loop ?? false,
      };

      // Play the sound
      await audioManager.play(sound, playbackOptions);
      
      this.setPlaybackState('playing');
      this.emitEvent('play_started', { studyWord });

    } catch (error) {
      this.setPlaybackState('error');
      this.handleError('playback_failed', `Failed to play audio for: ${studyWord}`, error);
      this.emitEvent('play_failed', { studyWord, error: this.lastError });
      throw error;
    }
  }

  /**
   * Stop audio playback
   */
  async stopAudio(): Promise<void> {
    if (!this.currentAudio) {
      return;
    }

    try {
      const sound = this.cache.get(this.currentAudio);
      if (sound) {
        await audioManager.stop(sound);
      }
      
      this.setPlaybackState('stopped');
      this.emitEvent('stop', { studyWord: this.currentAudio });
      this.currentAudio = null;
    } catch (error) {
      console.error('Failed to stop audio:', error);
    }
  }

  /**
   * Pause audio playback
   */
  async pauseAudio(): Promise<void> {
    if (!this.currentAudio) {
      return;
    }

    try {
      const sound = this.cache.get(this.currentAudio);
      if (sound) {
        await audioManager.pause(sound);
      }
      
      this.setPlaybackState('paused');
      this.emitEvent('pause', { studyWord: this.currentAudio });
    } catch (error) {
      console.error('Failed to pause audio:', error);
    }
  }

  /**
   * Resume audio playback
   */
  async resumeAudio(): Promise<void> {
    if (!this.currentAudio) {
      return;
    }

    try {
      const sound = this.cache.get(this.currentAudio);
      if (sound) {
        await audioManager.resume(sound);
      }
      
      this.setPlaybackState('playing');
      this.emitEvent('resume', { studyWord: this.currentAudio });
    } catch (error) {
      console.error('Failed to resume audio:', error);
    }
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  async setVolume(volume: number): Promise<void> {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.volume = clampedVolume;
    this.settings.volume = clampedVolume;
    
    try {
      await audioManager.setGlobalVolume(clampedVolume);
      this.emitEvent('volume_changed', { volume: clampedVolume });
    } catch (error) {
      console.error('Failed to set volume:', error);
    }
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * Update audio settings
   */
  updateSettings(newSettings: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    
    if (newSettings.volume !== undefined) {
      this.setVolume(newSettings.volume);
    }
    
    this.emitEvent('settings_updated', { settings: this.settings });
  }

  /**
   * Get current settings
   */
  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  /**
   * Check if audio is currently playing
   */
  isPlaying(): boolean {
    return this.playbackState === 'playing';
  }

  /**
   * Check if audio is currently paused
   */
  isPaused(): boolean {
    return this.playbackState === 'paused';
  }

  /**
   * Check if audio is currently loading
   */
  isLoading(): boolean {
    return this.playbackState === 'loading';
  }

  /**
   * Get current audio study word
   */
  getCurrentAudio(): string | null {
    return this.currentAudio;
  }

  /**
   * Get current playback state
   */
  getPlaybackState(): AudioPlaybackState {
    return this.playbackState;
  }

  /**
   * Preload audio for multiple study words
   */
  async preloadAudio(studyWords: string[]): Promise<void> {
    if (!this.settings.preloadEnabled) {
      return;
    }

    this.emitEvent('preload_started', { studyWords });

    const preloadPromises = studyWords.map(async (studyWord) => {
      try {
        if (!this.cache.has(studyWord)) {
          await this.loadAndCacheSound(studyWord);
        }
      } catch (error) {
        console.warn(`Failed to preload audio for: ${studyWord}`, error);
      }
    });

    try {
      await Promise.allSettled(preloadPromises);
      this.emitEvent('preload_completed', { studyWords });
    } catch (error) {
      this.emitEvent('preload_failed', { studyWords, error });
    }
  }

  /**
   * Clear audio cache
   */
  async clearCache(): Promise<void> {
    try {
      // Stop current audio if playing
      if (this.currentAudio) {
        await this.stopAudio();
      }

      // Unload all cached sounds
      for (const [studyWord] of this.cache) {
        await audioManager.unloadAudio(studyWord);
      }

      this.cache.clear();
      this.cacheStats = { hits: 0, misses: 0, loads: 0, errors: 0 };
      
      this.emitEvent('cache_cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): AudioCacheStats {
    const totalRequests = this.cacheStats.hits + this.cacheStats.misses;
    const hitRate = totalRequests > 0 ? (this.cacheStats.hits / totalRequests) * 100 : 0;

    return {
      totalEntries: this.cache.size,
      totalMemoryUsage: this.cache.size * 0.5, // Rough estimate in MB
      hitRate,
      oldestEntry: null, // Would need to track timestamps
      newestEntry: null,
      averageUseCount: 1, // Would need to track usage
    };
  }

  /**
   * Get last error
   */
  getLastError(): AudioError | null {
    return this.lastError;
  }

  /**
   * Clear last error
   */
  clearError(): void {
    this.lastError = null;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.clearCache();
      await audioManager.dispose();
      this.eventListeners.clear();
    } catch (error) {
      console.error('Failed to cleanup AudioService:', error);
    }
  }

  /**
   * Add event listener
   */
  addEventListener(type: AudioEventType, listener: AudioEventListener): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(type: AudioEventType, listener: AudioEventListener): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Private helper methods
   */
  private async loadAndCacheSound(studyWord: string): Promise<any> {
    try {
      this.cacheStats.loads++;
      const sound = await audioManager.loadAudio(studyWord);
      
      if (this.settings.cacheEnabled) {
        this.cache.set(studyWord, sound);
      }
      
      return sound;
    } catch (error) {
      this.cacheStats.errors++;
      throw error;
    }
  }

  private setPlaybackState(state: AudioPlaybackState): void {
    this.playbackState = state;
  }

  private handleError(type: string, message: string, originalError?: any): void {
    this.lastError = this.createError(type as any, message, originalError);
    console.error('AudioService error:', this.lastError);
  }

  private createError(type: any, message: string, originalError?: any): AudioError {
    return {
      type,
      message,
      code: originalError?.code,
      studyWord: this.currentAudio || undefined,
      timestamp: new Date(),
    };
  }

  private emitEvent(type: AudioEventType, data?: any): void {
    const event: AudioEvent = {
      type,
      studyWord: this.currentAudio || undefined,
      timestamp: new Date(),
      data,
      error: type.includes('failed') ? this.lastError || undefined : undefined,
    };

    const listeners = this.eventListeners.get(type) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in audio event listener:', error);
      }
    });
  }

  private initializeEventListeners(): void {
    // Set up any default event listeners
    this.addEventListener('play_completed', () => {
      this.setPlaybackState('ended');
      this.currentAudio = null;
    });
  }
}

// Create singleton instance
export const audioService = new AudioService();
export default audioService;