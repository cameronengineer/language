/**
 * AudioPreloader - Intelligent audio preloading and caching system
 * Handles preloading audio files for practice sessions with priority-based loading
 */

import {
  AudioPreloader as IAudioPreloader,
  PreloadResult,
  PreloadProgress,
  AudioError,
} from '@/src/types/audio';
import { audioManager } from './AudioManager';
import { getCachedAudioUrl, validateFileUrl } from '@/src/utils/hashUtils';

class AudioPreloader implements IAudioPreloader {
  private preloadPromises: Map<string, Promise<any>> = new Map();
  private cancelToken: { cancelled: boolean } = { cancelled: false };
  private progress: PreloadProgress | null = null;
  private eventListeners: Array<(progress: PreloadProgress) => void> = [];

  /**
   * Preload audio files for multiple study words
   */
  async preload(studyWords: string[]): Promise<PreloadResult> {
    if (studyWords.length === 0) {
      return {
        successful: [],
        failed: [],
        totalTime: 0,
        averageLoadTime: 0,
      };
    }

    const startTime = Date.now();
    const successful: string[] = [];
    const failed: Array<{ studyWord: string; error: AudioError }> = [];

    // Reset cancel token
    this.cancelToken = { cancelled: false };

    // Initialize progress
    this.progress = {
      total: studyWords.length,
      completed: 0,
      failed: 0,
      currentWord: null,
      isComplete: false,
      startTime: new Date(),
      estimatedTimeRemaining: 0,
    };

    this.notifyProgress();

    try {
      // Initialize audio manager if needed
      await audioManager.initialize();

      // Process words with concurrency control (max 3 concurrent loads)
      const batchSize = 3;
      for (let i = 0; i < studyWords.length; i += batchSize) {
        if (this.cancelToken.cancelled) {
          break;
        }

        const batch = studyWords.slice(i, i + batchSize);
        const batchPromises = batch.map(studyWord => this.preloadSingle(studyWord));
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          const studyWord = batch[index];
          
          if (result.status === 'fulfilled') {
            successful.push(studyWord);
          } else {
            const error: AudioError = {
              type: 'network_error',
              message: result.reason?.message || 'Preload failed',
              studyWord,
              timestamp: new Date(),
            };
            failed.push({ studyWord, error });
          }
          
          // Update progress
          if (this.progress) {
            this.progress.completed++;
            this.progress.failed = failed.length;
            this.progress.currentWord = studyWord;
            
            // Calculate estimated time remaining
            const elapsed = Date.now() - startTime;
            const rate = this.progress.completed / elapsed;
            const remaining = this.progress.total - this.progress.completed;
            this.progress.estimatedTimeRemaining = remaining / rate;
            
            this.notifyProgress();
          }
        });
      }

      const totalTime = Date.now() - startTime;
      const averageLoadTime = successful.length > 0 ? totalTime / successful.length : 0;

      // Mark as complete
      if (this.progress) {
        this.progress.isComplete = true;
        this.progress.currentWord = null;
        this.progress.estimatedTimeRemaining = 0;
        this.notifyProgress();
      }

      return {
        successful,
        failed,
        totalTime,
        averageLoadTime,
      };

    } catch (error) {
      console.error('Preload batch failed:', error);
      
      if (this.progress) {
        this.progress.isComplete = true;
        this.progress.currentWord = null;
        this.notifyProgress();
      }

      throw error;
    }
  }

  /**
   * Preload audio for a practice session with intelligent prioritization
   */
  async preloadSession(sessionWords: string[]): Promise<void> {
    if (sessionWords.length === 0) {
      return;
    }

    try {
      // Prioritize first few words for immediate use
      const immediateWords = sessionWords.slice(0, 5);
      const laterWords = sessionWords.slice(5);

      // Preload immediate words first
      if (immediateWords.length > 0) {
        await this.preload(immediateWords);
      }

      // Preload remaining words in background if not cancelled
      if (laterWords.length > 0 && !this.cancelToken.cancelled) {
        // Don't await this - let it run in background
        this.preload(laterWords).catch(error => {
          console.warn('Background preload failed:', error);
        });
      }

    } catch (error) {
      console.error('Session preload failed:', error);
      throw error;
    }
  }

  /**
   * Cancel ongoing preload operations
   */
  cancelPreload(): void {
    this.cancelToken.cancelled = true;
    this.preloadPromises.clear();
    
    if (this.progress) {
      this.progress.isComplete = true;
      this.progress.currentWord = null;
      this.notifyProgress();
    }
  }

  /**
   * Get current preload progress
   */
  getPreloadProgress(): PreloadProgress {
    return this.progress || {
      total: 0,
      completed: 0,
      failed: 0,
      currentWord: null,
      isComplete: true,
      startTime: new Date(),
      estimatedTimeRemaining: 0,
    };
  }

  /**
   * Add progress listener
   */
  addProgressListener(listener: (progress: PreloadProgress) => void): void {
    this.eventListeners.push(listener);
  }

  /**
   * Remove progress listener
   */
  removeProgressListener(listener: (progress: PreloadProgress) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * Clear all progress listeners
   */
  clearProgressListeners(): void {
    this.eventListeners = [];
  }

  /**
   * Preload a single audio file
   */
  private async preloadSingle(studyWord: string): Promise<any> {
    // Check if already being preloaded
    if (this.preloadPromises.has(studyWord)) {
      return this.preloadPromises.get(studyWord);
    }

    const preloadPromise = this.doPreloadSingle(studyWord);
    this.preloadPromises.set(studyWord, preloadPromise);

    try {
      const result = await preloadPromise;
      this.preloadPromises.delete(studyWord);
      return result;
    } catch (error) {
      this.preloadPromises.delete(studyWord);
      throw error;
    }
  }

  /**
   * Actually perform the preload for a single word
   */
  private async doPreloadSingle(studyWord: string): Promise<any> {
    try {
      // Check if cancelled
      if (this.cancelToken.cancelled) {
        throw new Error('Preload cancelled');
      }

      // Get audio URL
      const audioUrl = await getCachedAudioUrl(studyWord);
      
      // Validate URL exists
      const isValid = await validateFileUrl(audioUrl);
      if (!isValid) {
        throw new Error(`Audio file not found: ${audioUrl}`);
      }

      // Load the audio
      const sound = await audioManager.loadAudio(studyWord);
      
      console.log(`Preloaded audio for: ${studyWord}`);
      return sound;

    } catch (error) {
      console.warn(`Failed to preload audio for ${studyWord}:`, error);
      throw error;
    }
  }

  /**
   * Notify all progress listeners
   */
  private notifyProgress(): void {
    if (this.progress) {
      this.eventListeners.forEach(listener => {
        try {
          listener(this.progress!);
        } catch (error) {
          console.error('Error in preload progress listener:', error);
        }
      });
    }
  }

  /**
   * Get cache statistics for preloaded items
   */
  getPreloadStats(): {
    totalPreloaded: number;
    cacheHitRate: number;
    averageLoadTime: number;
  } {
    return {
      totalPreloaded: audioManager.getCacheSize(),
      cacheHitRate: 0, // Would need to track this
      averageLoadTime: 0, // Would need to track this
    };
  }

  /**
   * Clear preloaded audio cache
   */
  async clearPreloadCache(): Promise<void> {
    try {
      await audioManager.clearAllSounds();
      this.preloadPromises.clear();
    } catch (error) {
      console.error('Failed to clear preload cache:', error);
    }
  }

  /**
   * Smart preload based on user behavior patterns
   */
  async smartPreload(recentWords: string[], difficulty: 'easy' | 'medium' | 'hard'): Promise<void> {
    // Prioritize based on difficulty and recent usage
    let priorityWords: string[] = [];
    
    switch (difficulty) {
      case 'easy':
        // For easy sessions, preload more words as users go faster
        priorityWords = recentWords.slice(0, 10);
        break;
      case 'medium':
        // For medium sessions, preload moderate amount
        priorityWords = recentWords.slice(0, 7);
        break;
      case 'hard':
        // For hard sessions, preload fewer but prioritize immediate next words
        priorityWords = recentWords.slice(0, 5);
        break;
    }

    if (priorityWords.length > 0) {
      await this.preloadSession(priorityWords);
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.cancelPreload();
    this.clearProgressListeners();
    await this.clearPreloadCache();
  }
}

// Create singleton instance
export const audioPreloader = new AudioPreloader();
export default audioPreloader;