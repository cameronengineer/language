import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ThemedView,
  ThemedText,
  ErrorMessage,
  LoadingSpinner
} from '@/src/components/ui';
import {
  WelcomeHeader,
  StatisticsRow,
  PracticeActions
} from '@/src/components/dashboard';
import {
  MonthlyProgressChart,
  InsightsPanel,
  useAnalyticsActions
} from '@/src/components/analytics';
import { useTheme } from '@/src/utils/use-theme-color';
import { Spacing, Typography } from '@/src/utils/theme';
import { useAuth } from '@/src/stores/authStore';
import {
  useDashboardStore,
  useDashboardStatistics,
  useDashboardHasWords,
  useDashboardActions
} from '@/src/stores/dashboardStore';

/**
 * Main dashboard screen showing user progress, statistics, and quick actions
 * Serves as the central hub for the language learning application
 */
export default function DashboardScreen() {
  const { colors } = useTheme();
  const { user, isAuthenticated } = useAuth();
  
  // Dashboard state
  const { statistics, isLoadingStatistics, lastRefreshTime } = useDashboardStatistics();
  const { hasWords, isLoadingHasWords } = useDashboardHasWords();
  const { loadDashboardData, refreshDashboard, clearErrors } = useDashboardActions();
  const { isRefreshing, statisticsError, hasWordsError } = useDashboardStore();
  
  // Analytics actions
  const { loadAnalyticsData, refreshAnalytics } = useAnalyticsActions();

  // Load dashboard data when component mounts or user changes
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadDashboardData(user.id).catch(console.error);
      loadAnalyticsData(user.id).catch(console.error);
    }
  }, [isAuthenticated, user?.id, loadDashboardData, loadAnalyticsData]);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      await Promise.all([
        refreshDashboard(user.id),
        refreshAnalytics(user.id)
      ]);
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    }
  }, [user?.id, refreshDashboard, refreshAnalytics]);

  // Handle error retry
  const handleRetry = useCallback(() => {
    clearErrors();
    if (user?.id) {
      loadDashboardData(user.id).catch(console.error);
    }
  }, [user?.id, loadDashboardData, clearErrors]);

  // Loading state for initial load
  const isInitialLoading = isLoadingStatistics && !statistics;
  const hasError = statisticsError || hasWordsError;

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <ThemedText>Please log in to view your dashboard</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (isInitialLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <LoadingSpinner size="large" />
          <ThemedText style={styles.loadingText}>
            Loading your progress...
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (hasError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <ErrorMessage
            message={(statisticsError || hasWordsError)?.message || 'Unknown error occurred'}
            title="Failed to load dashboard"
            variant="error"
            actionText="Try Again"
            onAction={handleRetry}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.tint}
            colors={[colors.tint]}
          />
        }
      >
        {/* Welcome Header */}
        <WelcomeHeader 
          user={user} 
          loading={isLoadingStatistics}
        />

        {/* Statistics Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Your Progress
          </ThemedText>
          
          <StatisticsRow 
            statistics={statistics}
            loading={isLoadingStatistics}
          />
        </View>

        {/* Progress Chart Section */}
        <View style={styles.section}>
          <MonthlyProgressChart
            userId={user.id}
            height={280}
            showTimeRangeSelector={true}
            onDataPointPress={(date, data) => {
              console.log('Data point pressed:', date, data);
            }}
          />
        </View>

        {/* Learning Insights Section */}
        <View style={styles.section}>
          <InsightsPanel
            userId={user.id}
            maxRecommendations={3}
            onRecommendationPress={(recommendation) => {
              console.log('Recommendation pressed:', recommendation);
              // TODO: Navigate to detailed recommendation view
            }}
          />
        </View>

        {/* Practice Actions Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Continue Learning
          </ThemedText>
          
          <PracticeActions
            hasWords={hasWords}
            loading={isLoadingHasWords}
          />
        </View>

        {/* Last updated info */}
        {lastRefreshTime && (
          <View style={styles.lastUpdated}>
            <ThemedText style={[styles.lastUpdatedText, { color: colors.textMuted }]}>
              Last updated: {new Date(lastRefreshTime).toLocaleTimeString()}
            </ThemedText>
          </View>
        )}
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
    paddingBottom: Spacing.xl,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    textAlign: 'center',
    opacity: 0.7,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
  },
  lastUpdated: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  lastUpdatedText: {
    fontSize: Typography.sizes.xs,
  },
});