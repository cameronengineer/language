/**
 * AudioManager - Core audio playback service using expo-av
 * Handles loading, playing, pausing, and managing audio files for language learning
 */

import { Audio, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';
import { 
  AudioManager as IAudioManager,
  AudioError,
  AudioErrorType,
  AudioPlaybackOptions,
  AudioPlaybackState 
} from '@/src/types/audio';
import { getCachedAudioUrl, validateFileUrl } from '@/src/utils/hashUtils';

class AudioManager implements IAudioManager {
  private sounds: Map<string, Audio.Sound> = new Map();
  private currentSound: Audio.Sound | null = null;
  private currentStudyWord: string | null = null;
  private globalVolume: number = 1.0;
  private isInitialized: boolean = false;
  private statusCallbacks: Map<string, (status: AVPlaybackStatus) => void> = new Map();

  /**
   * Initialize the audio manager and set up audio session
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Set audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        interruptionModeIOS: 2, // DO_NOT_MIX
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: 2, // DO_NOT_MIX
        playThroughEarpieceAndroid: false,
      });

      this.isInitialized = true;
      console.log('AudioManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AudioManager:', error);
      throw this.createError('unknown_error', 'Failed to initialize audio system', error);
    }
  }

  /**
   * Dispose of the audio manager and clean up resources
   */
  async dispose(): Promise<void> {
    try {
      // Stop and unload all sounds
      for (const [studyWord, sound] of this.sounds) {
        await this.unloadAudio(studyWord);
      }

      // Clear current sound
      this.currentSound = null;
      this.currentStudyWord = null;
      this.sounds.clear();
      this.statusCallbacks.clear();

      this.isInitialized = false;
      console.log('AudioManager disposed successfully');
    } catch (error) {
      console.error('Error disposing AudioManager:', error);
    }
  }

  /**
   * Load audio for a study word
   */
  async loadAudio(studyWord: string): Promise<Audio.Sound> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Check if already loaded
    const existingSound = this.sounds.get(studyWord);
    if (existingSound) {
      return existingSound;
    }

    try {
      // Get audio URL using hash utils
      const audioUrl = await getCachedAudioUrl(studyWord);
      
      // Validate URL before attempting to load
      const isValid = await validateFileUrl(audioUrl);
      if (!isValid) {
        throw this.createError(
          'file_not_found',
          `Audio file not found for study word: ${studyWord}`,
          { studyWord, audioUrl }
        );
      }

      // Create and load sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { 
          shouldPlay: false,
          volume: this.globalVolume,
          rate: 1.0,
          shouldCorrectPitch: true,
        }
      );

      // Set up status callback
      const statusCallback = (status: AVPlaybackStatus) => {
        this.handlePlaybackStatusUpdate(studyWord, status);
      };

      sound.setOnPlaybackStatusUpdate(statusCallback);
      this.statusCallbacks.set(studyWord, statusCallback);

      // Store the sound
      this.sounds.set(studyWord, sound);
      
      console.log(`Audio loaded successfully for: ${studyWord}`);
      return sound;

    } catch (error) {
      console.error(`Failed to load audio for ${studyWord}:`, error);
      
      if (error && typeof error === 'object' && 'type' in error) {
        throw error;
      }
      
      throw this.createError(
        'playback_failed',
        `Failed to load audio for: ${studyWord}`,
        { studyWord, error }
      );
    }
  }

  /**
   * Unload audio for a study word
   */
  async unloadAudio(studyWord: string): Promise<void> {
    const sound = this.sounds.get(studyWord);
    if (!sound) {
      return;
    }

    try {
      // Stop if playing
      const status = await sound.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await sound.stopAsync();
      }

      // Unload the sound
      await sound.unloadAsync();
      
      // Clean up
      this.sounds.delete(studyWord);
      this.statusCallbacks.delete(studyWord);
      
      // Clear current sound if it was this one
      if (this.currentStudyWord === studyWord) {
        this.currentSound = null;
        this.currentStudyWord = null;
      }

      console.log(`Audio unloaded for: ${studyWord}`);
    } catch (error) {
      console.error(`Failed to unload audio for ${studyWord}:`, error);
    }
  }

  /**
   * Validate if an audio URL is accessible
   */
  async validateAudioUrl(url: string): Promise<boolean> {
    return validateFileUrl(url);
  }

  /**
   * Play a sound with optional playback options
   */
  async play(sound: Audio.Sound, options?: AudioPlaybackOptions): Promise<void> {
    try {
      const status = await sound.getStatusAsync();
      
      if (!status.isLoaded) {
        throw this.createError('playback_failed', 'Sound is not loaded');
      }

      // Set playback options
      if (options) {
        await sound.setVolumeAsync(options.volume ?? this.globalVolume);
        await sound.setRateAsync(
          options.rate ?? 1.0,
          options.shouldCorrectPitch ?? true
        );
        await sound.setIsLoopingAsync(options.loop ?? false);
      }

      // Stop current sound if different
      if (this.currentSound && this.currentSound !== sound) {
        await this.stop(this.currentSound);
      }

      // Play the sound
      await sound.replayAsync();
      this.currentSound = sound;

      console.log('Audio playback started');
    } catch (error) {
      console.error('Failed to play audio:', error);
      throw this.createError('playback_failed', 'Failed to play audio', error);
    }
  }

  /**
   * Stop a sound
   */
  async stop(sound: Audio.Sound): Promise<void> {
    try {
      const status = await sound.getStatusAsync();
      
      if (status.isLoaded && status.isPlaying) {
        await sound.stopAsync();
      }

      if (this.currentSound === sound) {
        this.currentSound = null;
        this.currentStudyWord = null;
      }

      console.log('Audio playback stopped');
    } catch (error) {
      console.error('Failed to stop audio:', error);
    }
  }

  /**
   * Pause a sound
   */
  async pause(sound: Audio.Sound): Promise<void> {
    try {
      const status = await sound.getStatusAsync();
      
      if (status.isLoaded && status.isPlaying) {
        await sound.pauseAsync();
      }

      console.log('Audio playback paused');
    } catch (error) {
      console.error('Failed to pause audio:', error);
    }
  }

  /**
   * Resume a sound
   */
  async resume(sound: Audio.Sound): Promise<void> {
    try {
      const status = await sound.getStatusAsync();
      
      if (status.isLoaded && !status.isPlaying) {
        await sound.playAsync();
        this.currentSound = sound;
      }

      console.log('Audio playback resumed');
    } catch (error) {
      console.error('Failed to resume audio:', error);
    }
  }

  /**
   * Set global volume
   */
  async setGlobalVolume(volume: number): Promise<void> {
    this.globalVolume = Math.max(0, Math.min(1, volume));
    
    // Update volume for all loaded sounds
    for (const sound of this.sounds.values()) {
      try {
        await sound.setVolumeAsync(this.globalVolume);
      } catch (error) {
        console.error('Failed to update sound volume:', error);
      }
    }

    console.log(`Global volume set to: ${this.globalVolume}`);
  }

  /**
   * Set volume for a specific sound
   */
  async setSoundVolume(sound: Audio.Sound, volume: number): Promise<void> {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    
    try {
      await sound.setVolumeAsync(clampedVolume);
    } catch (error) {
      console.error('Failed to set sound volume:', error);
    }
  }

  /**
   * Get playback status for a sound
   */
  async getPlaybackStatus(sound: Audio.Sound): Promise<AVPlaybackStatus> {
    return sound.getStatusAsync();
  }

  /**
   * Set up playback status update callback
   */
  onPlaybackStatusUpdate(
    sound: Audio.Sound, 
    callback: (status: AVPlaybackStatus) => void
  ): void {
    sound.setOnPlaybackStatusUpdate(callback);
  }

  /**
   * Set audio mode
   */
  async setAudioModeAsync(mode: any): Promise<void> {
    await Audio.setAudioModeAsync(mode);
  }

  /**
   * Enable/disable audio
   */
  async setIsEnabledAsync(enabled: boolean): Promise<void> {
    await Audio.setIsEnabledAsync(enabled);
  }

  /**
   * Handle playback status updates
   */
  private handlePlaybackStatusUpdate(studyWord: string, status: AVPlaybackStatus): void {
    if (status.isLoaded) {
      const successStatus = status as AVPlaybackStatusSuccess;
      
      // Handle playback completion
      if (successStatus.didJustFinish) {
        this.currentSound = null;
        this.currentStudyWord = null;
        console.log(`Audio playback completed for: ${studyWord}`);
      }
      
      // Handle any issues during playback
      if (!successStatus.isPlaying && !successStatus.didJustFinish && successStatus.positionMillis === 0) {
        console.warn(`Potential audio playback issue for ${studyWord}`);
      }
    }
  }

  /**
   * Create a standardized audio error
   */
  private createError(
    type: AudioErrorType,
    message: string,
    originalError?: any
  ): AudioError {
    return {
      type,
      message,
      code: originalError?.code,
      timestamp: new Date(),
    };
  }

  /**
   * Get current sound and study word (for debugging)
   */
  getCurrentAudio(): { sound: Audio.Sound | null; studyWord: string | null } {
    return {
      sound: this.currentSound,
      studyWord: this.currentStudyWord,
    };
  }

  /**
   * Get cache statistics (number of loaded sounds)
   */
  getCacheSize(): number {
    return this.sounds.size;
  }

  /**
   * Clear all loaded sounds
   */
  async clearAllSounds(): Promise<void> {
    const studyWords = Array.from(this.sounds.keys());
    for (const studyWord of studyWords) {
      await this.unloadAudio(studyWord);
    }
  }
}

// Create singleton instance
export const audioManager = new AudioManager();
export default audioManager;