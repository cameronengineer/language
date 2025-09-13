import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { 
  ThemedView, 
  ThemedText, 
  PracticeButton,
  LoadingSpinner,
  Modal 
} from '@/src/components/ui';
import { useTheme } from '@/src/utils/use-theme-color';
import { Spacing, Typography, BorderRadius, AppColors } from '@/src/utils/theme';
import { IconSymbol } from '@/src/components/ui/ui/icon-symbol';
import { SettingsSectionProps, ProfilePreferences } from '@/src/types/profile';

/**
 * Settings section component for managing user preferences
 */
export function SettingsSection({ 
  preferences, 
  onUpdatePreferences, 
  isLoading = false 
}: SettingsSectionProps) {
  const { colors } = useTheme();
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);

  const handleToggleSetting = (key: keyof ProfilePreferences, value: boolean) => {
    onUpdatePreferences({ [key]: value });
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
    onUpdatePreferences({ theme });
    setShowThemeModal(false);
  };

  const handleDailyGoalChange = (goal: number) => {
    onUpdatePreferences({ dailyGoal: goal });
    setShowGoalModal(false);
  };

  const getThemeDisplayName = (theme: string) => {
    switch (theme) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'auto': return 'Auto (System)';
      default: return 'Auto';
    }
  };

  const SettingRow = ({ 
    title, 
    subtitle, 
    icon, 
    rightComponent,
    onPress,
    disabled = false
  }: {
    title: string;
    subtitle?: string;
    icon: string;
    rightComponent?: React.ReactNode;
    onPress?: () => void;
    disabled?: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.settingRow,
        { backgroundColor: colors.surface },
        disabled && styles.disabledRow
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, { backgroundColor: colors.backgroundSecondary }]}>
          <IconSymbol 
            name={icon as any} 
            size={20} 
            color={colors.icon} 
          />
        </View>
        <View style={styles.settingText}>
          <ThemedText style={styles.settingTitle}>{title}</ThemedText>
          {subtitle && (
            <ThemedText style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </ThemedText>
          )}
        </View>
      </View>

      <View style={styles.settingRight}>
        {rightComponent}
        {onPress && (
          <IconSymbol 
            name="chevron.right" 
            size={16} 
            color={colors.iconSecondary} 
            style={styles.chevron}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  const ThemeModal = () => (
    <Modal
      visible={showThemeModal}
      onClose={() => setShowThemeModal(false)}
      title="Choose Theme"
      size="small"
    >
      <View style={styles.optionsContainer}>
        {[
          { value: 'light', label: 'Light', icon: '☀️' },
          { value: 'dark', label: 'Dark', icon: '🌙' },
          { value: 'auto', label: 'Auto (System)', icon: '📱' },
        ].map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionItem,
              { backgroundColor: colors.surface },
              preferences.theme === option.value && { borderColor: colors.tint }
            ]}
            onPress={() => handleThemeChange(option.value as any)}
          >
            <ThemedText style={styles.optionIcon}>{option.icon}</ThemedText>
            <ThemedText style={styles.optionLabel}>{option.label}</ThemedText>
            {preferences.theme === option.value && (
              <IconSymbol name="person.fill" size={16} color={colors.tint} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </Modal>
  );

  const DailyGoalModal = () => (
    <Modal
      visible={showGoalModal}
      onClose={() => setShowGoalModal(false)}
      title="Daily Word Goal"
      size="small"
    >
      <View style={styles.optionsContainer}>
        {[10, 15, 20, 25, 30, 40, 50].map((goal) => (
          <TouchableOpacity
            key={goal}
            style={[
              styles.optionItem,
              { backgroundColor: colors.surface },
              preferences.dailyGoal === goal && { borderColor: colors.tint }
            ]}
            onPress={() => handleDailyGoalChange(goal)}
          >
            <ThemedText style={styles.optionLabel}>{goal} words per day</ThemedText>
            {preferences.dailyGoal === goal && (
              <IconSymbol name="person.fill" size={16} color={colors.tint} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </Modal>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Settings & Preferences
        </ThemedText>
        <ThemedText style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          Customize your learning experience
        </ThemedText>
      </View>

      {/* App Preferences */}
      <View style={styles.settingsGroup}>
        <ThemedText style={[styles.groupTitle, { color: colors.textSecondary }]}>
          App Preferences
        </ThemedText>

        <View style={styles.settingsList}>
          <SettingRow
            title="Theme"
            subtitle={`Current: ${getThemeDisplayName(preferences.theme)}`}
            icon="person.fill"
            onPress={() => setShowThemeModal(true)}
          />

          <SettingRow
            title="Daily Goal"
            subtitle={`${preferences.dailyGoal} words per day`}
            icon="flashcard.fill"
            onPress={() => setShowGoalModal(true)}
          />
        </View>
      </View>

      {/* Learning Preferences */}
      <View style={styles.settingsGroup}>
        <ThemedText style={[styles.groupTitle, { color: colors.textSecondary }]}>
          Learning Preferences
        </ThemedText>

        <View style={styles.settingsList}>
          <SettingRow
            title="Audio Enabled"
            subtitle="Play pronunciation audio"
            icon="mic.fill"
            rightComponent={
              <Switch
                value={preferences.audioEnabled}
                onValueChange={(value) => handleToggleSetting('audioEnabled', value)}
                disabled={isLoading}
                trackColor={{ false: colors.backgroundSecondary, true: colors.tint }}
                thumbColor={colors.background}
              />
            }
          />
        </View>
      </View>

      {/* Notifications */}
      <View style={styles.settingsGroup}>
        <ThemedText style={[styles.groupTitle, { color: colors.textSecondary }]}>
          Notifications
        </ThemedText>

        <View style={styles.settingsList}>
          <SettingRow
            title="Push Notifications"
            subtitle="Receive app notifications"
            icon="person.fill"
            rightComponent={
              <Switch
                value={preferences.notifications}
                onValueChange={(value) => handleToggleSetting('notifications', value)}
                disabled={isLoading}
                trackColor={{ false: colors.backgroundSecondary, true: colors.tint }}
                thumbColor={colors.background}
              />
            }
          />

          <SettingRow
            title="Study Reminders"
            subtitle="Daily practice reminders"
            icon="person.fill"
            rightComponent={
              <Switch
                value={preferences.studyReminders}
                onValueChange={(value) => handleToggleSetting('studyReminders', value)}
                disabled={isLoading}
                trackColor={{ false: colors.backgroundSecondary, true: colors.tint }}
                thumbColor={colors.background}
              />
            }
          />
        </View>
      </View>

      {/* Privacy */}
      <View style={styles.settingsGroup}>
        <ThemedText style={[styles.groupTitle, { color: colors.textSecondary }]}>
          Privacy
        </ThemedText>

        <View style={styles.settingsList}>
          <SettingRow
            title="Analytics"
            subtitle="Help improve the app"
            icon="info.circle.fill"
            rightComponent={
              <Switch
                value={preferences.privacy.analyticsEnabled}
                onValueChange={(value) => 
                  onUpdatePreferences({ 
                    privacy: { ...preferences.privacy, analyticsEnabled: value } 
                  })
                }
                disabled={isLoading}
                trackColor={{ false: colors.backgroundSecondary, true: colors.tint }}
                thumbColor={colors.background}
              />
            }
          />

          <SettingRow
            title="Marketing Emails"
            subtitle="Receive promotional emails"
            icon="person.fill"
            rightComponent={
              <Switch
                value={preferences.privacy.marketingEmails}
                onValueChange={(value) => 
                  onUpdatePreferences({ 
                    privacy: { ...preferences.privacy, marketingEmails: value } 
                  })
                }
                disabled={isLoading}
                trackColor={{ false: colors.backgroundSecondary, true: colors.tint }}
                thumbColor={colors.background}
              />
            }
          />
        </View>
      </View>

      {/* Modals */}
      <ThemeModal />
      <DailyGoalModal />

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner message="Updating settings..." overlay />
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
    position: 'relative',
  },
  header: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  sectionDescription: {
    fontSize: Typography.sizes.sm,
  },
  settingsGroup: {
    marginBottom: Spacing.xl,
  },
  groupTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsList: {
    gap: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    minHeight: 64,
  },
  disabledRow: {
    opacity: 0.6,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: Typography.sizes.sm,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevron: {
    marginLeft: Spacing.sm,
  },
  optionsContainer: {
    gap: Spacing.sm,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionIcon: {
    fontSize: 20,
    marginRight: Spacing.md,
  },
  optionLabel: {
    fontSize: Typography.sizes.base,
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});