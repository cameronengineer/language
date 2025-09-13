import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemedText, LanguageFlag } from '@/src/components/ui';
import { useTheme } from '@/src/utils/use-theme-color';
import { Spacing, Typography } from '@/src/utils/theme';
import { User } from '@/src/types/user';

interface WelcomeHeaderProps {
  user: User | null;
  loading?: boolean;
}

/**
 * Welcome header component for dashboard
 * Shows personalized greeting with user's name and study language
 */
export function WelcomeHeader({ user, loading = false }: WelcomeHeaderProps) {
  const { colors } = useTheme();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getUserName = () => {
    if (!user) return 'there';
    return user.first_name || user.username || 'there';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.textSection}>
          <View style={[styles.loadingText, { backgroundColor: colors.surface }]} />
          <View style={[styles.loadingSubtext, { backgroundColor: colors.surface }]} />
        </View>
        <View style={styles.languageSection}>
          <View style={[styles.loadingFlag, { backgroundColor: colors.surface }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.textSection}>
        <ThemedText type="title" style={styles.greeting}>
          {getGreeting()}, {getUserName()}!
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
          {user?.study_language_id ? 'Time to practice your language skills' : 'Ready to start learning?'}
        </ThemedText>
      </View>
      
      {user?.study_language_id && (
        <View style={styles.languageSection}>
          <LanguageFlag
            languageId={user.study_language_id}
            size="large"
            showName
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  textSection: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  greeting: {
    marginBottom: Spacing.xs,
    fontSize: Typography.sizes.xl,
    lineHeight: Typography.sizes.xl * 1.2,
  },
  subtitle: {
    fontSize: Typography.sizes.base,
    lineHeight: Typography.sizes.base * 1.4,
    opacity: 0.8,
  },
  languageSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Loading states
  loadingText: {
    height: Typography.sizes.xl,
    borderRadius: 4,
    marginBottom: Spacing.xs,
    width: '70%',
  },
  loadingSubtext: {
    height: Typography.sizes.base,
    borderRadius: 4,
    width: '85%',
  },
  loadingFlag: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
});