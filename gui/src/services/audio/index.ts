/**
 * Audio services exports
 * Provides centralized access to all audio-related services
 */

export { default as audioManager } from './AudioManager';
export { default as audioService } from './AudioService';
export { default as audioPreloader } from './AudioPreloader';

// Re-export types for convenience
export type {
  AudioService,
  AudioManager,
  AudioPreloader,
  AudioSettings,
  AudioPlaybackOptions,
  AudioError,
  AudioEvent,
  AudioEventType,
  AudioEventListener,
  AudioPlaybackState,
  AudioCacheStats,
  PreloadResult,
  PreloadProgress,
} from '@/src/types/audio';