import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatisticBox } from '@/src/components/ui';
import { useTheme } from '@/src/utils/use-theme-color';
import { Spacing, AppColors } from '@/src/utils/theme';
import { DashboardStatistics } from '@/src/stores/dashboardStore';

interface StatisticsRowProps {
  statistics: DashboardStatistics | null;
  loading?: boolean;
}

/**
 * Statistics row component showing key learning metrics
 * Uses StatisticBox components to display total words, deep memory, and streak
 */
export function StatisticsRow({ statistics, loading = false }: StatisticsRowProps) {
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.statsGrid}>
          <StatisticBox
            title="Total Words"
            value=""
            subtitle="In your vocabulary"
            icon="book.fill"
            color={AppColors.primary}
            loading={true}
          />
          <StatisticBox
            title="Deep Memory"
            value=""
            subtitle="Long-term retention"
            icon="brain.head.profile"
            color={colors.deepMemory}
            loading={true}
          />
        </View>
        
        <View style={styles.statsGrid}>
          <StatisticBox
            title="Current Streak"
            value=""
            subtitle="Days in a row"
            icon="flame.fill"
            color={colors.streak}
            loading={true}
          />
          <StatisticBox
            title="Today"
            value=""
            subtitle="Minutes practiced"
            icon="clock.fill"
            color={colors.progress}
            loading={true}
          />
        </View>
      </View>
    );
  }

  if (!statistics) {
    return (
      <View style={styles.container}>
        <View style={styles.statsGrid}>
          <StatisticBox
            title="Total Words"
            value="--"
            subtitle="In your vocabulary"
            icon="book.fill"
            color={AppColors.primary}
          />
          <StatisticBox
            title="Deep Memory"
            value="--"
            subtitle="Long-term retention"
            icon="brain.head.profile"
            color={colors.deepMemory}
          />
        </View>
        
        <View style={styles.statsGrid}>
          <StatisticBox
            title="Current Streak"
            value="--"
            subtitle="Days in a row"
            icon="flame.fill"
            color={colors.streak}
          />
          <StatisticBox
            title="Today"
            value="--"
            subtitle="Minutes practiced"
            icon="clock.fill"
            color={colors.progress}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statsGrid}>
        <StatisticBox
          title="Total Words"
          value={statistics.total_words}
          subtitle="In your vocabulary"
          icon="book.fill"
          color={AppColors.primary}
        />
        <StatisticBox
          title="Deep Memory"
          value={statistics.words_in_deep_memory}
          subtitle="Long-term retention"
          icon="brain.head.profile"
          color={colors.deepMemory}
        />
      </View>
      
      <View style={styles.statsGrid}>
        <StatisticBox
          title="Current Streak"
          value={statistics.current_streak}
          subtitle="Days in a row"
          icon="flame.fill"
          color={colors.streak}
        />
        <StatisticBox
          title="Today"
          value={`${statistics.today_minutes}m`}
          subtitle="Minutes practiced"
          icon="clock.fill"
          color={colors.progress}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
});