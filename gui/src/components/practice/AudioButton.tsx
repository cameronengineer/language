import React, { useState, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/src/components/ui';
import { getCachedAudioUrl } from '@/src/utils/hashUtils';
import { useTheme } from '@/src/utils/use-theme-color';
import { Spacing, BorderRadius, Typography } from '@/src/utils/theme';
import { useAudioStore, audioHelpers } from '@/src/stores';
import { AudioPlaybackOptions } from '@/src/types/audio';

export interface AudioButtonProps {
  audioUrl?: string | null;
  studyWord?: string;
  size?: 'small' | 'medium' | 'large';
  autoPlay?: boolean;
  disabled?: boolean;
  showLabel?: boolean;
  volume?: number;
  playbackOptions?: AudioPlaybackOptions;
  onPress?: () => void;
  onPlayStart?: () => void;
  onPlayComplete?: () => void;
  onError?: (error: string) => void;
}

/**
 * Audio playback button component with full functionality
 */
export default function AudioButton({
  audioUrl,
  studyWord,
  size = 'medium',
  autoPlay = false,
  disabled = false,
  showLabel = true,
  volume,
  playbackOptions,
  onPress,
  onPlayStart,
  onPlayComplete,
  onError,
}: AudioButtonProps) {
  const { colors } = useTheme();
  const [resolvedAudioUrl, setResolvedAudioUrl] = useState<string | null>(null);
  
  // Audio store state
  const {
    currentAudio,
    playbackState,
    loadingState,
    lastError,
    play,
    stop,
    setVolume,
  } = useAudioStore();
  
  // Local state for this button
  const isCurrentlyPlaying = currentAudio === studyWord && playbackState === 'playing';
  const isCurrentlyLoading = currentAudio === studyWord && (loadingState === 'loading' || playbackState === 'loading');
  const hasError = currentAudio === studyWord && (playbackState === 'error' || loadingState === 'failed');

  // Load audio URL from hash if needed
  useEffect(() => {
    const loadAudioUrl = async () => {
      if (audioUrl !== undefined) {
        setResolvedAudioUrl(audioUrl);
        return;
      }

      if (studyWord) {
        try {
          const url = await getCachedAudioUrl(studyWord);
          setResolvedAudioUrl(url);
        } catch (error) {
          console.error('Failed to load audio URL:', error);
          setResolvedAudioUrl(null);
          onError?.('Failed to load audio URL');
        }
      }
    };

    loadAudioUrl();
  }, [audioUrl, studyWord, onError]);

  // Auto-play when audio URL is resolved
  useEffect(() => {
    if (autoPlay && resolvedAudioUrl && studyWord && !disabled && !isCurrentlyPlaying) {
      handleAutoPlay();
    }
  }, [autoPlay, resolvedAudioUrl, studyWord, disabled, isCurrentlyPlaying]);

  // Handle volume changes
  useEffect(() => {
    if (volume !== undefined) {
      setVolume(volume);
    }
  }, [volume, setVolume]);

  // Handle playback state changes
  useEffect(() => {
    if (currentAudio === studyWord) {
      if (playbackState === 'playing') {
        onPlayStart?.();
      } else if (playbackState === 'ended' || playbackState === 'stopped') {
        onPlayComplete?.();
      } else if (playbackState === 'error') {
        onError?.(lastError?.message || 'Audio playback failed');
      }
    }
  }, [playbackState, currentAudio, studyWord, onPlayStart, onPlayComplete, onError, lastError]);

  const handleAutoPlay = async () => {
    if (!studyWord) return;
    
    try {
      await audioHelpers.autoPlay(studyWord, playbackOptions);
    } catch (error) {
      console.error('Auto-play failed:', error);
      onError?.('Auto-play failed');
    }
  };

  const handlePress = async () => {
    if (disabled || !studyWord) return;

    try {
      if (isCurrentlyPlaying) {
        // Stop current playback
        await stop();
      } else {
        // Start playback
        const options = {
          volume,
          ...playbackOptions,
        };
        await play(studyWord, options);
      }
    } catch (error) {
      console.error('Audio playback failed:', error);
      onError?.('Audio playback failed');
    }

    onPress?.();
  };

  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return { width: 40, height: 40, iconSize: 20 };
      case 'large':
        return { width: 64, height: 64, iconSize: 32 };
      default:
        return { width: 48, height: 48, iconSize: 24 };
    }
  };

  const buttonSize = getButtonSize();
  const isDisabled = disabled || !resolvedAudioUrl || !studyWord;

  return (
    <View style={styles.container}>
      <Pressable
        style={[
          styles.button,
          {
            width: buttonSize.width,
            height: buttonSize.height,
            backgroundColor: isDisabled 
              ? colors.backgroundSecondary 
              : colors.tint,
            opacity: isDisabled ? 0.5 : 1,
          },
        ]}
        onPress={handlePress}
        disabled={isDisabled}
        android_ripple={{ 
          color: colors.background + '40',
          borderless: true,
        }}
      >
        {isCurrentlyLoading ? (
          <Ionicons
            name="sync"
            size={buttonSize.iconSize}
            color={colors.textSecondary}
            style={{
              transform: [{ rotate: isCurrentlyLoading ? '360deg' : '0deg' }]
            }}
          />
        ) : hasError ? (
          <Ionicons
            name="warning"
            size={buttonSize.iconSize}
            color={colors.textMuted}
          />
        ) : isCurrentlyPlaying ? (
          <Ionicons
            name="stop"
            size={buttonSize.iconSize}
            color={isDisabled ? colors.textMuted : colors.background}
          />
        ) : (
          <Ionicons
            name="play"
            size={buttonSize.iconSize}
            color={isDisabled ? colors.textMuted : colors.background}
            style={{ marginLeft: 2 }} // Optical alignment for play icon
          />
        )}
      </Pressable>

      {showLabel && (
        <ThemedText 
          style={[
            styles.label,
            size === 'small' && styles.labelSmall,
            { color: colors.textSecondary }
          ]}
        >
          {isCurrentlyLoading
            ? 'Loading...'
            : hasError
            ? 'Error'
            : isCurrentlyPlaying
            ? 'Stop'
            : isDisabled
            ? 'No audio'
            : 'Listen'}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    marginTop: Spacing.xs,
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
  },
  labelSmall: {
    fontSize: Typography.sizes.xs,
    marginTop: Spacing.xs / 2,
  },
});
