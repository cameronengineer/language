/**
 * Audio types and interfaces for the language learning application
 * Provides comprehensive type definitions for audio playback, management, and settings
 */

import { AVPlaybackStatus } from 'expo-av';

/**
 * Audio playback states
 */
export type AudioPlaybackState = 
  | 'idle'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'stopped'
  | 'error'
  | 'ended';

/**
 * Audio loading states
 */
export type AudioLoadingState = 
  | 'idle'
  | 'loading'
  | 'loaded'
  | 'failed';

/**
 * Audio error types
 */
export type AudioErrorType = 
  | 'network_error'
  | 'file_not_found'
  | 'format_unsupported'
  | 'permission_denied'
  | 'playback_failed'
  | 'unknown_error';

/**
 * Audio error details
 */
export interface AudioError {
  type: AudioErrorType;
  message: string;
  code?: string | number;
  studyWord?: string;
  audioUrl?: string;
  timestamp: Date;
}

/**
 * Audio file information
 */
export interface AudioFileInfo {
  studyWord: string;
  url: string;
  hash: string;
  duration?: number;
  size?: number;
  isValid: boolean;
  lastValidated: Date;
}

/**
 * Audio cache entry
 */
export interface AudioCacheEntry {
  studyWord: string;
  url: string;
  hash: string;
  sound: any; // expo-av Sound object
  duration: number;
  loadedAt: Date;
  lastUsed: Date;
  useCount: number;
}

/**
 * Audio cache configuration
 */
export interface AudioCacheConfig {
  maxSize: number;
  maxMemoryUsage: number; // in MB
  ttl: number; // time to live in minutes
  preloadLimit: number;
  cleanupThreshold: number;
}

/**
 * Audio settings and preferences
 */
export interface AudioSettings {
  volume: number; // 0.0 to 1.0
  autoPlay: boolean;
  preloadEnabled: boolean;
  cacheEnabled: boolean;
  networkOnlyOnWifi: boolean;
  retryCount: number;
  retryDelay: number; // in milliseconds
}

/**
 * Audio playback options
 */
export interface AudioPlaybackOptions {
  volume?: number;
  rate?: number;
  shouldCorrectPitch?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  fadeInDuration?: number;
  fadeOutDuration?: number;
}

/**
 * Audio service interface
 */
export interface AudioService {
  // Core playback methods
  playAudio: (studyWord: string, options?: AudioPlaybackOptions) => Promise<void>;
  stopAudio: () => Promise<void>;
  pauseAudio: () => Promise<void>;
  resumeAudio: () => Promise<void>;
  
  // Volume and settings
  setVolume: (volume: number) => Promise<void>;
  getVolume: () => number;
  updateSettings: (settings: Partial<AudioSettings>) => void;
  getSettings: () => AudioSettings;
  
  // State queries
  isPlaying: () => boolean;
  isPaused: () => boolean;
  isLoading: () => boolean;
  getCurrentAudio: () => string | null;
  getPlaybackState: () => AudioPlaybackState;
  
  // Preloading and caching
  preloadAudio: (studyWords: string[]) => Promise<void>;
  clearCache: () => Promise<void>;
  getCacheStats: () => AudioCacheStats;
  
  // Error handling
  getLastError: () => AudioError | null;
  clearError: () => void;
  
  // Cleanup
  cleanup: () => Promise<void>;
}

/**
 * Audio manager interface
 */
export interface AudioManager {
  // Initialization
  initialize: () => Promise<void>;
  dispose: () => Promise<void>;
  
  // Audio loading
  loadAudio: (studyWord: string) => Promise<any>; // expo-av Sound
  unloadAudio: (studyWord: string) => Promise<void>;
  validateAudioUrl: (url: string) => Promise<boolean>;
  
  // Playback control
  play: (sound: any, options?: AudioPlaybackOptions) => Promise<void>;
  stop: (sound: any) => Promise<void>;
  pause: (sound: any) => Promise<void>;
  resume: (sound: any) => Promise<void>;
  
  // Volume management
  setGlobalVolume: (volume: number) => Promise<void>;
  setSoundVolume: (sound: any, volume: number) => Promise<void>;
  
  // Status monitoring
  getPlaybackStatus: (sound: any) => Promise<AVPlaybackStatus>;
  onPlaybackStatusUpdate: (sound: any, callback: (status: AVPlaybackStatus) => void) => void;
  
  // Audio session management
  setAudioModeAsync: (mode: any) => Promise<void>;
  setIsEnabledAsync: (enabled: boolean) => Promise<void>;
}

/**
 * Audio cache statistics
 */
export interface AudioCacheStats {
  totalEntries: number;
  totalMemoryUsage: number; // in MB
  hitRate: number; // percentage
  oldestEntry: Date | null;
  newestEntry: Date | null;
  averageUseCount: number;
}

/**
 * Audio preloader interface
 */
export interface AudioPreloader {
  preload: (studyWords: string[]) => Promise<PreloadResult>;
  preloadSession: (sessionWords: string[]) => Promise<void>;
  cancelPreload: () => void;
  getPreloadProgress: () => PreloadProgress;
}

/**
 * Preload result
 */
export interface PreloadResult {
  successful: string[];
  failed: Array<{ studyWord: string; error: AudioError }>;
  totalTime: number;
  averageLoadTime: number;
}

/**
 * Preload progress
 */
export interface PreloadProgress {
  total: number;
  completed: number;
  failed: number;
  currentWord: string | null;
  isComplete: boolean;
  startTime: Date;
  estimatedTimeRemaining: number; // in milliseconds
}

/**
 * Audio queue entry
 */
export interface AudioQueueEntry {
  studyWord: string;
  options?: AudioPlaybackOptions;
  priority: number;
  addedAt: Date;
}

/**
 * Audio event types
 */
export type AudioEventType = 
  | 'play_started'
  | 'play_completed'
  | 'play_failed'
  | 'pause'
  | 'resume'
  | 'stop'
  | 'volume_changed'
  | 'settings_updated'
  | 'cache_cleared'
  | 'preload_started'
  | 'preload_completed'
  | 'preload_failed';

/**
 * Audio event payload
 */
export interface AudioEvent {
  type: AudioEventType;
  studyWord?: string;
  timestamp: Date;
  data?: any;
  error?: AudioError;
}

/**
 * Audio event listener
 */
export type AudioEventListener = (event: AudioEvent) => void;

/**
 * Audio store state interface
 */
export interface AudioStoreState {
  // Current playback state
  currentAudio: string | null;
  playbackState: AudioPlaybackState;
  loadingState: AudioLoadingState;
  volume: number;
  
  // Settings
  settings: AudioSettings;
  
  // Cache and preloading
  cache: Map<string, AudioCacheEntry>;
  cacheStats: AudioCacheStats;
  preloadProgress: PreloadProgress | null;
  
  // Queue management
  queue: AudioQueueEntry[];
  isProcessingQueue: boolean;
  
  // Error handling
  lastError: AudioError | null;
  errorHistory: AudioError[];
  
  // Performance metrics
  playbackHistory: Array<{
    studyWord: string;
    playedAt: Date;
    duration: number;
    wasSuccessful: boolean;
  }>;
}

/**
 * Audio store actions interface
 */
export interface AudioStoreActions {
  // Playback actions
  play: (studyWord: string, options?: AudioPlaybackOptions) => Promise<void>;
  stop: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  
  // Settings actions
  setVolume: (volume: number) => void;
  updateSettings: (settings: Partial<AudioSettings>) => void;
  
  // Cache actions
  preloadAudio: (studyWords: string[]) => Promise<void>;
  clearCache: () => void;
  removeFromCache: (studyWord: string) => void;
  
  // Queue actions
  addToQueue: (studyWord: string, options?: AudioPlaybackOptions, priority?: number) => void;
  clearQueue: () => void;
  processQueue: () => Promise<void>;
  
  // Error actions
  clearError: () => void;
  clearErrorHistory: () => void;
  
  // State actions
  reset: () => void;
  initialize: () => Promise<void>;
  cleanup: () => Promise<void>;
}

/**
 * Volume control component props
 */
export interface VolumeControlProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
  disabled?: boolean;
  showLabel?: boolean;
  orientation?: 'horizontal' | 'vertical';
  size?: 'small' | 'medium' | 'large';
}

/**
 * Audio indicator component props
 */
export interface AudioIndicatorProps {
  isPlaying: boolean;
  isLoading: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  animated?: boolean;
}

/**
 * Audio settings component props
 */
export interface AudioSettingsProps {
  settings: AudioSettings;
  onSettingsChange: (settings: Partial<AudioSettings>) => void;
  disabled?: boolean;
}

// Re-export common types for convenience
export type {
  AVPlaybackStatus,
};