import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useThemeColor } from '@/src/utils/use-theme-color';
import { Spacing, BorderRadius, Typography, AppColors } from '@/src/utils/theme';
import { ThemedText, Card, LoadingSpinner } from '@/src/components/ui';
import { IconSymbol } from '@/src/components/ui/ui/icon-symbol';
import { useAnalyticsData } from '@/src/stores/analyticsStore';
import { AnalyticsRecommendation } from '@/src/types/analytics';

interface InsightsPanelProps {
  userId: string;
  onRecommendationPress?: (recommendation: AnalyticsRecommendation) => void;
  maxRecommendations?: number;
}

interface InsightCardProps {
  recommendation: AnalyticsRecommendation;
  onPress?: () => void;
}

/**
 * Card component for displaying individual insights and recommendations
 */
function InsightCard({ recommendation, onPress }: InsightCardProps) {
  const backgroundColor = useThemeColor({}, 'surface');
  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return AppColors.error;
      case 'medium':
        return AppColors.warning;
      case 'low':
        return AppColors.info;
      default:
        return AppColors.primary;
    }
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'study_time':
        return 'flashcard.fill';
      case 'frequency':
        return 'house.fill';
      case 'difficulty':
        return 'book.fill';
      case 'review':
        return 'chevron.right';
      case 'goal':
        return 'paperplane.fill';
      default:
        return 'info.circle.fill';
    }
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.insightCard,
        { backgroundColor, borderColor }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.insightHeader}>
        <View style={styles.insightIconContainer}>
          <IconSymbol
            name={getTypeIcon(recommendation.type)}
            size={20}
            color={getPriorityColor(recommendation.priority)}
          />
        </View>
        
        <View style={styles.insightContent}>
          <ThemedText style={styles.insightTitle}>
            {recommendation.title}
          </ThemedText>
          
          <View style={styles.priorityContainer}>
            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: getPriorityColor(recommendation.priority) + '20' }
              ]}
            >
              <ThemedText
                style={[
                  styles.priorityText,
                  { color: getPriorityColor(recommendation.priority) }
                ]}
              >
                {recommendation.priority.toUpperCase()}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>
      
      <ThemedText style={[styles.insightDescription, { color: textSecondaryColor }]}>
        {recommendation.description}
      </ThemedText>
      
      <View style={styles.insightFooter}>
        <ThemedText style={[styles.impactText, { color: textSecondaryColor }]}>
          {recommendation.estimated_impact}
        </ThemedText>
        
        <View style={styles.actionContainer}>
          <ThemedText style={[styles.actionText, { color: AppColors.primary }]}>
            {recommendation.action_text}
          </ThemedText>
          <IconSymbol
            name="chevron.right"
            size={16}
            color={AppColors.primary}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

/**
 * Panel component showing learning insights and personalized recommendations
 */
export function InsightsPanel({
  userId,
  onRecommendationPress,
  maxRecommendations = 5
}: InsightsPanelProps) {
  const backgroundColor = useThemeColor({}, 'surface');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  
  const {
    learningAnalytics,
    recommendations,
    isLoading,
    error
  } = useAnalyticsData();
  
  if (isLoading) {
    return (
      <Card style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <ThemedText style={styles.loadingText}>
            Analyzing your learning patterns...
          </ThemedText>
        </View>
      </Card>
    );
  }
  
  if (error || !learningAnalytics) {
    return (
      <Card style={styles.container}>
        <View style={styles.emptyContainer}>
          <IconSymbol
            name="exclamationmark.triangle.fill"
            size={32}
            color={textSecondaryColor}
          />
          <ThemedText style={[styles.emptyText, { color: textSecondaryColor }]}>
            Unable to load insights
          </ThemedText>
          <ThemedText style={[styles.emptySubtext, { color: textSecondaryColor }]}>
            Try again later or contact support
          </ThemedText>
        </View>
      </Card>
    );
  }
  
  const displayedRecommendations = recommendations.slice(0, maxRecommendations);
  
  if (displayedRecommendations.length === 0) {
    return (
      <Card style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.title}>
            Learning Insights
          </ThemedText>
        </View>
        
        <View style={styles.emptyContainer}>
          <IconSymbol
            name="paperplane.fill"
            size={32}
            color={AppColors.success}
          />
          <ThemedText style={[styles.emptyText, { color: textSecondaryColor }]}>
            You're doing great!
          </ThemedText>
          <ThemedText style={[styles.emptySubtext, { color: textSecondaryColor }]}>
            Keep up the excellent learning habits
          </ThemedText>
        </View>
      </Card>
    );
  }
  
  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="subtitle" style={styles.title}>
          Learning Insights
        </ThemedText>
        
        <View style={styles.insightsCount}>
          <ThemedText style={[styles.countText, { color: textSecondaryColor }]}>
            {displayedRecommendations.length} insights
          </ThemedText>
        </View>
      </View>
      
      {/* Learning Overview */}
      {learningAnalytics && (
        <View style={styles.overviewContainer}>
          <View style={styles.overviewItem}>
            <ThemedText style={[styles.overviewLabel, { color: textSecondaryColor }]}>
              Learning Velocity
            </ThemedText>
            <View style={styles.overviewValue}>
              <ThemedText style={styles.overviewNumber}>
                {Math.round(learningAnalytics.learning_velocity.words_per_week)}
              </ThemedText>
              <ThemedText style={[styles.overviewUnit, { color: textSecondaryColor }]}>
                words/week
              </ThemedText>
              <IconSymbol
                name="chevron.right"
                size={12}
                color={learningAnalytics.learning_velocity.trend === 'increasing' ? 
                  AppColors.success : learningAnalytics.learning_velocity.trend === 'decreasing' ? 
                  AppColors.error : textSecondaryColor}
              />
            </View>
          </View>
          
          <View style={styles.overviewItem}>
            <ThemedText style={[styles.overviewLabel, { color: textSecondaryColor }]}>
              Retention Rate
            </ThemedText>
            <View style={styles.overviewValue}>
              <ThemedText style={styles.overviewNumber}>
                {Math.round(learningAnalytics.retention_rate.overall)}%
              </ThemedText>
              <ThemedText style={[styles.overviewUnit, { color: textSecondaryColor }]}>
                retention
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.overviewItem}>
            <ThemedText style={[styles.overviewLabel, { color: textSecondaryColor }]}>
              Consistency
            </ThemedText>
            <View style={styles.overviewValue}>
              <ThemedText style={styles.overviewNumber}>
                {Math.round(learningAnalytics.performance.consistency_score)}%
              </ThemedText>
              <ThemedText style={[styles.overviewUnit, { color: textSecondaryColor }]}>
                consistent
              </ThemedText>
            </View>
          </View>
        </View>
      )}
      
      {/* Recommendations List */}
      <ScrollView 
        style={styles.recommendationsContainer}
        showsVerticalScrollIndicator={false}
      >
        {displayedRecommendations.map((recommendation) => (
          <InsightCard
            key={recommendation.id}
            recommendation={recommendation}
            onPress={() => onRecommendationPress?.(recommendation)}
          />
        ))}
      </ScrollView>
      
      {recommendations.length > maxRecommendations && (
        <TouchableOpacity
          style={styles.showMoreButton}
          onPress={() => {
            // Handle show more action
            console.log('Show more insights');
          }}
          activeOpacity={0.7}
        >
          <ThemedText style={[styles.showMoreText, { color: AppColors.primary }]}>
            View {recommendations.length - maxRecommendations} more insights
          </ThemedText>
          <IconSymbol
            name="chevron.right"
            size={16}
            color={AppColors.primary}
          />
        </TouchableOpacity>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.sm,
    textAlign: 'center',
    opacity: 0.7,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    marginTop: Spacing.sm,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.medium,
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: Spacing.xs,
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
  },
  insightsCount: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    backgroundColor: AppColors.gray100,
    borderRadius: BorderRadius.sm,
  },
  countText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  overviewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray200,
  },
  overviewItem: {
    flex: 1,
    alignItems: 'center',
  },
  overviewLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.xs / 2,
  },
  overviewValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs / 2,
  },
  overviewNumber: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  overviewUnit: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  recommendationsContainer: {
    maxHeight: 300,
  },
  insightCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  insightIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.xs / 2,
  },
  priorityContainer: {
    flexDirection: 'row',
  },
  priorityBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
  },
  priorityText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  insightDescription: {
    fontSize: Typography.sizes.sm,
    lineHeight: Typography.lineHeights.normal * Typography.sizes.sm,
    marginBottom: Spacing.sm,
  },
  insightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  impactText: {
    fontSize: Typography.sizes.xs,
    fontStyle: 'italic',
    flex: 1,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
  },
  actionText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  showMoreButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  showMoreText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
});