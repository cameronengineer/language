/**
 * AudioSettings - Audio configuration component for user preferences
 * Provides settings for volume, auto-play, preloading, and other audio options
 */

import React from 'react';
import { View, StyleSheet, Switch } from 'react-native';
import { ThemedText, ThemedView, Card } from '@/src/components/ui';
import VolumeControl from './VolumeControl';
import { useTheme } from '@/src/utils/use-theme-color';
import { Spacing, Typography, BorderRadius } from '@/src/utils/theme';
import { AudioSettingsProps } from '@/src/types/audio';

/**
 * Audio settings component with all configuration options
 */
export default function AudioSettings({
  settings,
  onSettingsChange,
  disabled = false,
}: AudioSettingsProps) {
  const { colors } = useTheme();

  const handleSettingChange = (key: keyof typeof settings) => (value: any) => {
    onSettingsChange({ [key]: value });
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={[styles.title, { color: colors.text }]}>
        Audio Settings
      </ThemedText>

      {/* Volume Control */}
      <Card style={styles.settingCard}>
        <VolumeControl
          volume={settings.volume}
          onVolumeChange={handleSettingChange('volume')}
          disabled={disabled}
          showLabel={true}
          size="medium"
        />
      </Card>

      {/* Auto-play Setting */}
      <Card style={styles.settingCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <ThemedText style={[styles.settingLabel, { color: colors.text }]}>
              Auto-play Audio
            </ThemedText>
            <ThemedText style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Automatically play audio when flashcard is revealed
            </ThemedText>
          </View>
          <Switch
            value={settings.autoPlay}
            onValueChange={handleSettingChange('autoPlay')}
            disabled={disabled}
            trackColor={{
              false: colors.backgroundSecondary,
              true: colors.tint + '60',
            }}
            thumbColor={settings.autoPlay ? colors.tint : colors.textMuted}
          />
        </View>
      </Card>

      {/* Preload Setting */}
      <Card style={styles.settingCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <ThemedText style={[styles.settingLabel, { color: colors.text }]}>
              Preload Audio
            </ThemedText>
            <ThemedText style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Download audio files ahead of time for faster playback
            </ThemedText>
          </View>
          <Switch
            value={settings.preloadEnabled}
            onValueChange={handleSettingChange('preloadEnabled')}
            disabled={disabled}
            trackColor={{
              false: colors.backgroundSecondary,
              true: colors.tint + '60',
            }}
            thumbColor={settings.preloadEnabled ? colors.tint : colors.textMuted}
          />
        </View>
      </Card>

      {/* Cache Setting */}
      <Card style={styles.settingCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <ThemedText style={[styles.settingLabel, { color: colors.text }]}>
              Cache Audio
            </ThemedText>
            <ThemedText style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Keep audio files in memory for faster repeated playback
            </ThemedText>
          </View>
          <Switch
            value={settings.cacheEnabled}
            onValueChange={handleSettingChange('cacheEnabled')}
            disabled={disabled}
            trackColor={{
              false: colors.backgroundSecondary,
              true: colors.tint + '60',
            }}
            thumbColor={settings.cacheEnabled ? colors.tint : colors.textMuted}
          />
        </View>
      </Card>

      {/* Network Setting */}
      <Card style={styles.settingCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <ThemedText style={[styles.settingLabel, { color: colors.text }]}>
              WiFi Only
            </ThemedText>
            <ThemedText style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Only download audio files when connected to WiFi
            </ThemedText>
          </View>
          <Switch
            value={settings.networkOnlyOnWifi}
            onValueChange={handleSettingChange('networkOnlyOnWifi')}
            disabled={disabled}
            trackColor={{
              false: colors.backgroundSecondary,
              true: colors.tint + '60',
            }}
            thumbColor={settings.networkOnlyOnWifi ? colors.tint : colors.textMuted}
          />
        </View>
      </Card>

      {/* Retry Settings */}
      <Card style={styles.settingCard}>
        <View style={styles.settingColumn}>
          <ThemedText style={[styles.settingLabel, { color: colors.text }]}>
            Network Settings
          </ThemedText>
          
          <View style={styles.retryRow}>
            <ThemedText style={[styles.retryLabel, { color: colors.textSecondary }]}>
              Retry attempts: {settings.retryCount}
            </ThemedText>
            <View style={styles.retryButtons}>
              {[1, 2, 3, 5].map(count => (
                <View key={count} style={styles.retryButtonContainer}>
                  <ThemedText
                    style={[
                      styles.retryButton,
                      {
                        backgroundColor: settings.retryCount === count ? colors.tint : colors.backgroundSecondary,
                        color: settings.retryCount === count ? colors.background : colors.text,
                      }
                    ]}
                    onPress={() => !disabled && handleSettingChange('retryCount')(count)}
                  >
                    {count}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.retryRow}>
            <ThemedText style={[styles.retryLabel, { color: colors.textSecondary }]}>
              Retry delay: {settings.retryDelay / 1000}s
            </ThemedText>
            <View style={styles.retryButtons}>
              {[500, 1000, 2000, 5000].map(delay => (
                <View key={delay} style={styles.retryButtonContainer}>
                  <ThemedText
                    style={[
                      styles.retryButton,
                      {
                        backgroundColor: settings.retryDelay === delay ? colors.tint : colors.backgroundSecondary,
                        color: settings.retryDelay === delay ? colors.background : colors.text,
                      }
                    ]}
                    onPress={() => !disabled && handleSettingChange('retryDelay')(delay)}
                  >
                    {delay / 1000}s
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Card>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  settingCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingColumn: {
    flexDirection: 'column',
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.xs,
  },
  settingDescription: {
    fontSize: Typography.sizes.sm,
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.sm,
  },
  retryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  retryLabel: {
    fontSize: Typography.sizes.sm,
    flex: 1,
  },
  retryButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  retryButtonContainer: {
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  retryButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    textAlign: 'center',
    minWidth: 40,
    borderRadius: BorderRadius.sm,
  },
});