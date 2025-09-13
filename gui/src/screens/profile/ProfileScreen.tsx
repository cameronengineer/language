import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ThemedView, 
  ThemedText, 
  StatisticBox, 
  PracticeButton,
  LoadingSpinner,
  ErrorMessage,
  LanguageFlag
} from '@/src/components/ui';
import { useTheme, useLanguageColors } from '@/src/utils/use-theme-color';
import { Spacing, Typography, AppColors, BorderRadius } from '@/src/utils/theme';
import { useAuth } from '@/src/stores';
import { IconSymbol } from '@/src/components/ui/ui/icon-symbol';

interface SettingItemProps {
  title: string;
  subtitle?: string;
  icon?: string;
  onPress?: () => void;
  rightContent?: React.ReactNode;
}

const SettingItem: React.FC<SettingItemProps> = ({ 
  title, 
  subtitle, 
  icon, 
  onPress, 
  rightContent 
}) => {
  const { colors } = useTheme();
  
  return (
    <TouchableOpacity 
      style={[styles.settingItem, { backgroundColor: colors.surface }]}
      onPress={onPress}
      disabled={!onPress}
    >
      {icon && (
        <IconSymbol 
          name={icon as any} 
          size={20} 
          color={colors.icon} 
          style={styles.settingIcon}
        />
      )}
      <View style={styles.settingContent}>
        <ThemedText style={styles.settingTitle}>{title}</ThemedText>
        {subtitle && (
          <ThemedText style={styles.settingSubtitle}>{subtitle}</ThemedText>
        )}
      </View>
      {rightContent}
      {onPress && (
        <IconSymbol 
          name="chevron.right" 
          size={16} 
          color={colors.iconSecondary} 
        />
      )}
    </TouchableOpacity>
  );
};

/**
 * Profile screen for user settings, account management, and preferences
 */
export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const languageColors = useLanguageColors(user?.study_language_id || undefined);

  // Mock state for demonstration
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement logout functionality
            console.log('Logout functionality to be implemented');
          }
        }
      ]
    );
  };

  const handleLanguageChange = () => {
    Alert.alert('Language Settings', 'Language change functionality coming soon!');
  };

  const handleSetting = (setting: string) => {
    Alert.alert('Settings', `${setting} functionality coming soon!`);
  };

  // Mock user stats
  const userStats = {
    totalWords: 1247,
    totalHours: 42,
    longestStreak: 28,
    joinDate: 'January 2024',
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingSpinner message="Updating profile..." overlay />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: languageColors.primary }]}>
            <ThemedText style={[styles.avatarText, { color: '#FFFFFF' }]}>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </ThemedText>
          </View>
          
          <ThemedText type="title" style={styles.userName}>
            {user?.email?.split('@')[0] || 'User'}
          </ThemedText>
          
          <ThemedText style={styles.userEmail}>
            {user?.email || 'user@example.com'}
          </ThemedText>
          
          {user?.study_language_id && (
            <View style={styles.languageInfo}>
              <ThemedText style={styles.languageLabel}>Learning:</ThemedText>
              <LanguageFlag 
                languageId={user.study_language_id} 
                size="medium" 
                showName 
              />
            </View>
          )}
        </View>

        {/* Learning Stats */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Learning Statistics
          </ThemedText>
          
          <View style={styles.statsGrid}>
            <StatisticBox
              title="Words Learned"
              value={userStats.totalWords}
              subtitle="Total vocabulary"
              color={languageColors.primary}
            />
            <StatisticBox
              title="Study Hours"
              value={userStats.totalHours}
              subtitle="Time invested"
              color={AppColors.success}
            />
          </View>
          
          <View style={styles.statsGrid}>
            <StatisticBox
              title="Best Streak"
              value={userStats.longestStreak}
              subtitle="Days in a row"
              color={AppColors.warning}
            />
            <StatisticBox
              title="Member Since"
              value={userStats.joinDate}
              subtitle="Learning journey"
              color={AppColors.info}
            />
          </View>
        </View>

        {/* Settings Sections */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Language Settings
          </ThemedText>
          <View style={styles.settingsGroup}>
            <SettingItem
              title="Study Language"
              subtitle="Change your target language"
              icon="safari.fill"
              onPress={handleLanguageChange}
            />
            <SettingItem
              title="Native Language"
              subtitle="Change your native language"
              icon="house.fill"
              onPress={handleLanguageChange}
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Practice Settings
          </ThemedText>
          <View style={styles.settingsGroup}>
            <SettingItem
              title="Daily Goal"
              subtitle="Words per day: 20"
              icon="flashcard.fill"
              onPress={() => handleSetting('Daily Goal')}
            />
            <SettingItem
              title="Notifications"
              subtitle="Remind me to practice"
              icon="mic.fill"
              onPress={() => handleSetting('Notifications')}
            />
            <SettingItem
              title="Audio Settings"
              subtitle="Voice and playback options"
              icon="mic.fill"
              onPress={() => handleSetting('Audio Settings')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Account
          </ThemedText>
          <View style={styles.settingsGroup}>
            <SettingItem
              title="Privacy Policy"
              subtitle="How we protect your data"
              icon="person.fill"
              onPress={() => handleSetting('Privacy Policy')}
            />
            <SettingItem
              title="Terms of Service"
              subtitle="Usage terms and conditions"
              icon="book.fill"
              onPress={() => handleSetting('Terms of Service')}
            />
            <SettingItem
              title="Help & Support"
              subtitle="Get help and contact us"
              icon="person.fill"
              onPress={() => handleSetting('Help & Support')}
            />
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <PracticeButton
            title="Sign Out"
            variant="outline"
            onPress={handleLogout}
            style={styles.logoutButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
  },
  userName: {
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  userEmail: {
    opacity: 0.7,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  languageLabel: {
    fontSize: Typography.sizes.sm,
    opacity: 0.7,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  settingsGroup: {
    gap: 1, // Thin separator between items
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    minHeight: 56,
  },
  settingIcon: {
    marginRight: Spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
  },
  settingSubtitle: {
    fontSize: Typography.sizes.sm,
    opacity: 0.7,
    marginTop: 2,
  },
  logoutButton: {
    alignSelf: 'center',
    paddingHorizontal: Spacing.xl,
  },
});