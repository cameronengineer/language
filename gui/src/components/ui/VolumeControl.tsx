/**
 * VolumeControl - Volume slider component for audio settings
 * Provides intuitive volume control with visual feedback
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/src/components/ui';
import { useTheme } from '@/src/utils/use-theme-color';
import { Spacing, Typography, BorderRadius } from '@/src/utils/theme';
import { VolumeControlProps } from '@/src/types/audio';

/**
 * Volume control component with slider and mute button
 */
export default function VolumeControl({
  volume,
  onVolumeChange,
  disabled = false,
  showLabel = true,
  orientation = 'horizontal',
  size = 'medium',
}: VolumeControlProps) {
  const { colors } = useTheme();
  const [isMuted, setIsMuted] = useState(volume === 0);
  const [previousVolume, setPreviousVolume] = useState(volume > 0 ? volume : 0.5);

  const handleVolumeChange = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    onVolumeChange(clampedVolume);
    setIsMuted(clampedVolume === 0);
    
    if (clampedVolume > 0) {
      setPreviousVolume(clampedVolume);
    }
  }, [onVolumeChange]);

  const handleMuteToggle = useCallback(() => {
    if (isMuted) {
      // Unmute: restore previous volume or default to 50%
      const restoreVolume = previousVolume > 0 ? previousVolume : 0.5;
      handleVolumeChange(restoreVolume);
    } else {
      // Mute: set volume to 0
      setPreviousVolume(volume);
      handleVolumeChange(0);
    }
  }, [isMuted, volume, previousVolume, handleVolumeChange]);

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return 'volume-mute';
    } else if (volume < 0.3) {
      return 'volume-low';
    } else if (volume < 0.7) {
      return 'volume-medium';
    } else {
      return 'volume-high';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          containerHeight: 32,
          iconSize: 16,
          sliderHeight: 20,
          labelSize: Typography.sizes.xs,
        };
      case 'large':
        return {
          containerHeight: 48,
          iconSize: 28,
          sliderHeight: 32,
          labelSize: Typography.sizes.lg,
        };
      default:
        return {
          containerHeight: 40,
          iconSize: 24,
          sliderHeight: 24,
          labelSize: Typography.sizes.sm,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const isVertical = orientation === 'vertical';

  return (
    <View style={[
      styles.container,
      isVertical ? styles.verticalContainer : styles.horizontalContainer,
      { opacity: disabled ? 0.5 : 1 }
    ]}>
      {showLabel && (
        <ThemedText style={[
          styles.label,
          { fontSize: sizeStyles.labelSize, color: colors.textSecondary }
        ]}>
          Volume: {Math.round(volume * 100)}%
        </ThemedText>
      )}
      
      <View style={[
        styles.controlContainer,
        isVertical ? styles.verticalControlContainer : styles.horizontalControlContainer,
        { height: sizeStyles.containerHeight }
      ]}>
        {/* Mute/Unmute Button */}
        <Pressable
          style={[
            styles.muteButton,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
            }
          ]}
          onPress={handleMuteToggle}
          disabled={disabled}
          android_ripple={{ color: colors.tint + '20', borderless: true }}
        >
          <Ionicons
            name={getVolumeIcon()}
            size={sizeStyles.iconSize}
            color={disabled ? colors.textMuted : colors.text}
          />
        </Pressable>

        {/* Volume Slider */}
        <View style={[
          styles.sliderContainer,
          isVertical ? styles.verticalSliderContainer : styles.horizontalSliderContainer
        ]}>
          <Slider
            style={[
              styles.slider,
              {
                height: sizeStyles.sliderHeight,
                width: isVertical ? sizeStyles.sliderHeight : undefined,
              }
            ]}
            value={volume}
            onValueChange={handleVolumeChange}
            minimumValue={0}
            maximumValue={1}
            step={0.01}
            disabled={disabled}
            minimumTrackTintColor={colors.tint}
            maximumTrackTintColor={colors.backgroundSecondary}
            thumbTintColor={colors.tint}
          />
        </View>

        {/* Volume Percentage */}
        <View style={styles.percentageContainer}>
          <ThemedText style={[
            styles.percentageText,
            { 
              fontSize: sizeStyles.labelSize * 0.8,
              color: colors.textSecondary,
            }
          ]}>
            {Math.round(volume * 100)}%
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.sm,
  },
  horizontalContainer: {
    flexDirection: 'column',
  },
  verticalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.xs,
  },
  controlContainer: {
    alignItems: 'center',
  },
  horizontalControlContainer: {
    flexDirection: 'row',
  },
  verticalControlContainer: {
    flexDirection: 'column',
  },
  muteButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  sliderContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  horizontalSliderContainer: {
    marginHorizontal: Spacing.sm,
  },
  verticalSliderContainer: {
    marginVertical: Spacing.sm,
  },
  slider: {
    flex: 1,
  },
  percentageContainer: {
    minWidth: 40,
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  percentageText: {
    fontWeight: Typography.weights.medium,
    textAlign: 'center',
  },
});