import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useThemeColor } from '@/src/utils/use-theme-color';
import { Spacing, BorderRadius, Typography, AppColors } from '@/src/utils/theme';
import { ThemedText, Card, LoadingSpinner } from '@/src/components/ui';
import { IconSymbol } from '@/src/components/ui/ui/icon-symbol';
import { useAnalyticsData } from '@/src/stores/analyticsStore';
import { CEFRLevel } from '@/src/types/language';

interface RetentionAnalyticsProps {
  userId: string;
  timeRange?: 'week' | 'month' | 'quarter';
}

interface RetentionMetric {
  label: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  color: string;
}

interface ForgettingCurvePoint {
  days: number;
  retention: number;
}

/**
 * Individual metric card showing retention statistics
 */
function RetentionMetricCard({ metric }: { metric: RetentionMetric }) {
  const backgroundColor = useThemeColor({}, 'surface');
  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'paperplane.fill';
      case 'down':
        return 'xmark';
      case 'stable':
        return 'info.circle.fill';
      default:
        return 'info.circle.fill';
    }
  };
  
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return AppColors.success;
      case 'down':
        return AppColors.error;
      case 'stable':
        return textSecondaryColor;
      default:
        return textSecondaryColor;
    }
  };
  
  return (
    <Card style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <ThemedText style={[styles.metricLabel, { color: textSecondaryColor }]}>
          {metric.label}
        </ThemedText>
        
        <View style={styles.trendIndicator}>
          <IconSymbol
            name={getTrendIcon(metric.trend)}
            size={16}
            color={getTrendColor(metric.trend)}
          />
        </View>
      </View>
      
      <View style={styles.metricValue}>
        <ThemedText style={[styles.metricNumber, { color: metric.color }]}>
          {metric.value}
        </ThemedText>
        <ThemedText style={[styles.metricUnit, { color: textSecondaryColor }]}>
          {metric.unit}
        </ThemedText>
      </View>
    </Card>
  );
}

/**
 * Forgetting curve visualization component
 */
function ForgettingCurveChart({ data }: { data: ForgettingCurvePoint[] }) {
  const backgroundColor = useThemeColor({}, 'surface');
  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  
  const chartHeight = 150;
  const chartWidth = 280;
  
  // Calculate curve path
  const curvePoints = data.map((point, index) => {
    const x = (index / (data.length - 1)) * chartWidth;
    const y = chartHeight - (point.retention / 100) * chartHeight;
    return { x, y, retention: point.retention };
  });
  
  return (
    <Card style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <ThemedText style={[styles.chartTitle, { color: textColor }]}>
          Forgetting Curve
        </ThemedText>
        <ThemedText style={[styles.chartSubtitle, { color: textSecondaryColor }]}>
          Memory retention over time
        </ThemedText>
      </View>
      
      <View style={[styles.chartContainer, { width: chartWidth, height: chartHeight }]}>
        {/* Grid lines */}
        {[25, 50, 75, 100].map((percent) => (
          <View
            key={percent}
            style={[
              styles.gridLine,
              {
                top: chartHeight - (percent / 100) * chartHeight,
                width: chartWidth,
                borderTopColor: borderColor,
              },
            ]}
          />
        ))}
        
        {/* Curve line */}
        <View style={styles.curvePath}>
          {curvePoints.map((point, index) => {
            const nextPoint = curvePoints[index + 1];
            return (
              <View key={index}>
                {/* Line segment */}
                {nextPoint && (
                  <View
                    style={[
                      styles.curveSegment,
                      {
                        position: 'absolute',
                        left: point.x,
                        top: point.y,
                        width: Math.sqrt(
                          Math.pow(nextPoint.x - point.x, 2) + 
                          Math.pow(nextPoint.y - point.y, 2)
                        ),
                        transform: [
                          {
                            rotate: `${Math.atan2(
                              nextPoint.y - point.y, 
                              nextPoint.x - point.x
                            )}rad`
                          }
                        ],
                        backgroundColor: AppColors.primary
                      }
                    ]}
                  />
                )}
                
                {/* Data point */}
                <View
                  style={[
                    styles.curvePoint,
                    {
                      left: point.x - 4,
                      top: point.y - 4,
                      backgroundColor: AppColors.primary,
                    }
                  ]}
                />
              </View>
            );
          })}
        </View>
        
        {/* Y-axis labels */}
        <View style={styles.yAxisLabels}>
          {[0, 25, 50, 75, 100].map((percent) => (
            <ThemedText
              key={percent}
              style={[
                styles.axisLabel,
                {
                  color: textSecondaryColor,
                  top: chartHeight - (percent / 100) * chartHeight - 8,
                },
              ]}
            >
              {percent}%
            </ThemedText>
          ))}
        </View>
        
        {/* X-axis labels */}
        <View style={styles.xAxisLabels}>
          {data.map((point, index) => (
            <ThemedText
              key={index}
              style={[
                styles.axisLabel,
                {
                  color: textSecondaryColor,
                  left: (index / (data.length - 1)) * chartWidth - 10,
                },
              ]}
            >
              {point.days}d
            </ThemedText>
          ))}
        </View>
      </View>
    </Card>
  );
}

/**
 * Difficulty level breakdown component
 */
function DifficultyBreakdown({ 
  difficultyData 
}: { 
  difficultyData: Record<CEFRLevel, { retention: number; words: number }> 
}) {
  const backgroundColor = useThemeColor({}, 'surface');
  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  
  const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];
  
  const getLevelColor = (level: CEFRLevel) => {
    switch (level) {
      case 'A1':
        return AppColors.success;
      case 'A2':
        return AppColors.primary;
      case 'B1':
        return AppColors.warning;
      case 'B2':
        return AppColors.secondary;
      case 'C1':
        return AppColors.error;
      default:
        return AppColors.primary;
    }
  };
  
  return (
    <Card style={styles.difficultyCard}>
      <View style={styles.cardHeader}>
        <ThemedText style={[styles.cardTitle, { color: textColor }]}>
          Retention by Difficulty
        </ThemedText>
        <ThemedText style={[styles.cardSubtitle, { color: textSecondaryColor }]}>
          CEFR level performance
        </ThemedText>
      </View>
      
      <View style={styles.difficultyLevels}>
        {levels.map((level) => {
          const data = difficultyData[level];
          const retention = data?.retention || 0;
          const words = data?.words || 0;
          
          return (
            <View key={level} style={styles.difficultyLevel}>
              <View style={styles.levelHeader}>
                <View
                  style={[
                    styles.levelIndicator,
                    { backgroundColor: getLevelColor(level) }
                  ]}
                />
                <ThemedText style={[styles.levelLabel, { color: textColor }]}>
                  {level}
                </ThemedText>
              </View>
              
              <View style={styles.levelStats}>
                <ThemedText style={[styles.levelRetention, { color: textColor }]}>
                  {Math.round(retention)}%
                </ThemedText>
                <ThemedText style={[styles.levelWords, { color: textSecondaryColor }]}>
                  {words} words
                </ThemedText>
              </View>
              
              <View style={styles.levelProgress}>
                <View
                  style={[
                    styles.levelProgressFill,
                    {
                      width: `${retention}%`,
                      backgroundColor: getLevelColor(level),
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

/**
 * Main retention analytics component
 */
export function RetentionAnalytics({ 
  userId, 
  timeRange = 'month' 
}: RetentionAnalyticsProps) {
  const { learningAnalytics, isLoading } = useAnalyticsData();
  
  // Generate retention metrics
  const retentionMetrics = useMemo((): RetentionMetric[] => {
    if (!learningAnalytics) return [];
    
    return [
      {
        label: '7-Day Retention',
        value: Math.round(learningAnalytics.retention_rate.day_7),
        unit: '%',
        trend: 'stable',
        color: AppColors.primary,
      },
      {
        label: '30-Day Retention',
        value: Math.round(learningAnalytics.retention_rate.day_30),
        unit: '%',
        trend: 'up',
        color: AppColors.success,
      },
      {
        label: 'Overall Rate',
        value: Math.round(learningAnalytics.retention_rate.overall),
        unit: '%',
        trend: 'stable',
        color: AppColors.secondary,
      },
      {
        label: 'Learning Velocity',
        value: Math.round(learningAnalytics.learning_velocity.words_per_week),
        unit: 'words/week',
        trend: learningAnalytics.learning_velocity.trend === 'increasing' ? 'up' : 
               learningAnalytics.learning_velocity.trend === 'decreasing' ? 'down' : 'stable',
        color: AppColors.warning,
      },
    ];
  }, [learningAnalytics]);
  
  // Generate forgetting curve data
  const forgettingCurveData = useMemo((): ForgettingCurvePoint[] => {
    if (!learningAnalytics) {
      return [
        { days: 1, retention: 100 },
        { days: 2, retention: 85 },
        { days: 7, retention: 75 },
        { days: 14, retention: 65 },
        { days: 30, retention: 55 },
      ];
    }
    
    return [
      { days: 1, retention: learningAnalytics.retention_rate.day_1 },
      { days: 7, retention: learningAnalytics.retention_rate.day_7 },
      { days: 30, retention: learningAnalytics.retention_rate.day_30 },
    ];
  }, [learningAnalytics]);
  
  // Generate difficulty breakdown data
  const difficultyData = useMemo(() => {
    if (!learningAnalytics) {
      return {
        A1: { retention: 85, words: 25 },
        A2: { retention: 78, words: 42 },
        B1: { retention: 71, words: 35 },
        B2: { retention: 65, words: 18 },
        C1: { retention: 58, words: 8 },
      };
    }
    
    const result: Record<CEFRLevel, { retention: number; words: number }> = {
      A1: { retention: 0, words: 0 },
      A2: { retention: 0, words: 0 },
      B1: { retention: 0, words: 0 },
      B2: { retention: 0, words: 0 },
      C1: { retention: 0, words: 0 },
    };
    
    Object.entries(learningAnalytics.difficulty_progress).forEach(([level, data]) => {
      if (level in result) {
        result[level as CEFRLevel] = {
          retention: data.accuracy,
          words: data.words_learned,
        };
      }
    });
    
    return result;
  }, [learningAnalytics]);
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <ThemedText style={styles.loadingText}>
          Analyzing retention patterns...
        </ThemedText>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        {retentionMetrics.map((metric, index) => (
          <RetentionMetricCard key={index} metric={metric} />
        ))}
      </View>
      
      {/* Forgetting Curve */}
      <View style={styles.section}>
        <ForgettingCurveChart data={forgettingCurveData} />
      </View>
      
      {/* Difficulty Breakdown */}
      <View style={styles.section}>
        <DifficultyBreakdown difficultyData={difficultyData} />
      </View>
      
      {/* Performance Insights */}
      {learningAnalytics && (
        <Card style={styles.insightsCard}>
          <View style={styles.cardHeader}>
            <ThemedText style={styles.cardTitle}>
              Performance Insights
            </ThemedText>
          </View>
          
          <View style={styles.insightsList}>
            <View style={styles.insightItem}>
              <IconSymbol
                name="info.circle.fill"
                size={16}
                color={AppColors.info}
              />
              <ThemedText style={styles.insightText}>
                Your consistency score is {Math.round(learningAnalytics.performance.consistency_score)}%
              </ThemedText>
            </View>
            
            <View style={styles.insightItem}>
              <IconSymbol
                name="paperplane.fill"
                size={16}
                color={AppColors.success}
              />
              <ThemedText style={styles.insightText}>
                Best study time: {learningAnalytics.study_patterns.preferred_study_hour}:00
              </ThemedText>
            </View>
            
            <View style={styles.insightItem}>
              <IconSymbol
                name="exclamationmark.triangle.fill"
                size={16}
                color={AppColors.warning}
              />
              <ThemedText style={styles.insightText}>
                Average response time: {learningAnalytics.performance.average_response_time.toFixed(1)}s
              </ThemedText>
            </View>
          </View>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.sm,
    textAlign: 'center',
    opacity: 0.7,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  
  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  metricCard: {
    flex: 1,
    minWidth: 140,
    padding: Spacing.md,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  metricLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  trendIndicator: {
    padding: Spacing.xs / 2,
  },
  metricValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs / 2,
  },
  metricNumber: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
  },
  metricUnit: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  
  // Chart Styles
  chartCard: {
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  chartHeader: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  chartTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.xs / 2,
  },
  chartSubtitle: {
    fontSize: Typography.sizes.sm,
  },
  chartContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  gridLine: {
    position: 'absolute',
    borderTopWidth: 1,
    opacity: 0.2,
  },
  curvePath: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  curveSegment: {
    height: 2,
    borderRadius: 1,
  },
  curvePoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  yAxisLabels: {
    position: 'absolute',
    left: -30,
    top: 0,
    height: '100%',
  },
  xAxisLabels: {
    position: 'absolute',
    bottom: -25,
    width: '100%',
    height: 20,
  },
  axisLabel: {
    position: 'absolute',
    fontSize: Typography.sizes.xs,
    textAlign: 'center',
  },
  
  // Difficulty Breakdown
  difficultyCard: {
    padding: Spacing.md,
  },
  cardHeader: {
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.xs / 2,
  },
  cardSubtitle: {
    fontSize: Typography.sizes.sm,
  },
  difficultyLevels: {
    gap: Spacing.sm,
  },
  difficultyLevel: {
    gap: Spacing.xs,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  levelIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  levelLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    flex: 1,
  },
  levelStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelRetention: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
  },
  levelWords: {
    fontSize: Typography.sizes.sm,
  },
  levelProgress: {
    height: 6,
    backgroundColor: AppColors.gray200,
    borderRadius: 3,
    overflow: 'hidden',
  },
  levelProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  
  // Insights
  insightsCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  insightsList: {
    gap: Spacing.sm,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  insightText: {
    fontSize: Typography.sizes.sm,
    flex: 1,
  },
});