import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Modal, Animated, Dimensions } from 'react-native';
import { useThemeColor } from '@/src/utils/use-theme-color';
import { Spacing, BorderRadius, Typography, AppColors } from '@/src/utils/theme';
import { ThemedText, Card } from '@/src/components/ui';
import { IconSymbol } from '@/src/components/ui/ui/icon-symbol';
import { useAnalyticsData, useProgressTracking } from '@/src/stores/analyticsStore';
import { Milestone, Achievement } from '@/src/types/analytics';

interface MilestoneTrackerProps {
  userId: string;
  onMilestoneAchieved?: (milestone: Milestone, achievement: Achievement) => void;
  showCelebration?: boolean;
}

interface MilestoneCelebrationProps {
  milestone: Milestone;
  visible: boolean;
  onClose: () => void;
}

/**
 * Celebration modal that appears when a milestone is achieved
 */
function MilestoneCelebration({ milestone, visible, onClose }: MilestoneCelebrationProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  
  const [scaleAnimation] = useState(new Animated.Value(0));
  const [opacityAnimation] = useState(new Animated.Value(0));
  const [confettiAnimation] = useState(new Animated.Value(0));
  
  useEffect(() => {
    if (visible) {
      // Start celebration animation
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnimation, {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 3,
          }),
          Animated.timing(opacityAnimation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(confettiAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Auto-close after 4 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      
      return () => clearTimeout(timer);
    } else {
      scaleAnimation.setValue(0);
      opacityAnimation.setValue(0);
      confettiAnimation.setValue(0);
    }
  }, [visible]);
  
  const getMilestoneIcon = (type: string) => {
    switch (type) {
      case 'streak':
        return 'paperplane.fill';
      case 'words_learned':
        return 'book.fill';
      case 'time_studied':
        return 'flashcard.fill';
      case 'accuracy':
        return 'exclamationmark.triangle.fill';
      case 'consistency':
        return 'house.fill';
      default:
        return 'info.circle.fill';
    }
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.celebrationOverlay}>
        <Animated.View
          style={[
            styles.celebrationCard,
            { backgroundColor },
            {
              transform: [{ scale: scaleAnimation }],
              opacity: opacityAnimation,
            },
          ]}
        >
          {/* Confetti Effect */}
          <Animated.View
            style={[
              styles.confettiContainer,
              {
                opacity: confettiAnimation,
                transform: [
                  {
                    translateY: confettiAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-50, 100],
                    }),
                  },
                ],
              },
            ]}
          >
            {Array.from({ length: 12 }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.confettiPiece,
                  {
                    backgroundColor: [
                      AppColors.success,
                      AppColors.primary,
                      AppColors.warning,
                      AppColors.secondary,
                    ][index % 4],
                    left: `${10 + (index * 7)}%`,
                    animationDelay: `${index * 100}ms`,
                  },
                ]}
              />
            ))}
          </Animated.View>
          
          {/* Achievement Content */}
          <View style={styles.celebrationHeader}>
            <View
              style={[
                styles.celebrationIcon,
                { backgroundColor: milestone.color || AppColors.primary }
              ]}
            >
              <IconSymbol
                name={getMilestoneIcon(milestone.type)}
                size={32}
                color="#FFFFFF"
              />
            </View>
            
            <ThemedText style={styles.celebrationTitle}>
              🎉 Milestone Achieved! 🎉
            </ThemedText>
            
            <ThemedText style={[styles.milestoneTitle, { color: textColor }]}>
              {milestone.title}
            </ThemedText>
            
            <ThemedText style={styles.milestoneDescription}>
              {milestone.description}
            </ThemedText>
          </View>
          
          <View style={styles.celebrationStats}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>
                {milestone.current_value}
              </ThemedText>
              <ThemedText style={styles.statLabel}>
                Achieved
              </ThemedText>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>
                {milestone.reward_points}
              </ThemedText>
              <ThemedText style={styles.statLabel}>
                Points
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.celebrationFooter}>
            <ThemedText style={styles.celebrationMessage}>
              Keep up the amazing work! 🚀
            </ThemedText>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/**
 * Progress indicator for a single milestone
 */
interface MilestoneProgressProps {
  milestone: Milestone;
  compact?: boolean;
}

function MilestoneProgress({ milestone, compact = false }: MilestoneProgressProps) {
  const backgroundColor = useThemeColor({}, 'surface');
  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  
  const getMilestoneIcon = (type: string) => {
    switch (type) {
      case 'streak':
        return 'paperplane.fill';
      case 'words_learned':
        return 'book.fill';
      case 'time_studied':
        return 'flashcard.fill';
      case 'accuracy':
        return 'exclamationmark.triangle.fill';
      case 'consistency':
        return 'house.fill';
      default:
        return 'info.circle.fill';
    }
  };
  
  if (compact) {
    return (
      <View style={[styles.compactMilestone, { backgroundColor }]}>
        <View style={styles.compactIcon}>
          <IconSymbol
            name={getMilestoneIcon(milestone.type)}
            size={16}
            color={milestone.completed ? AppColors.success : AppColors.primary}
          />
        </View>
        
        <View style={styles.compactContent}>
          <ThemedText style={styles.compactTitle} numberOfLines={1}>
            {milestone.title}
          </ThemedText>
          
          <View style={styles.compactProgress}>
            <View style={styles.compactProgressBar}>
              <View
                style={[
                  styles.compactProgressFill,
                  {
                    width: `${Math.min(100, milestone.progress_percentage)}%`,
                    backgroundColor: milestone.completed ? AppColors.success : AppColors.primary,
                  },
                ]}
              />
            </View>
            
            <ThemedText style={[styles.compactPercentage, { color: textSecondaryColor }]}>
              {Math.round(milestone.progress_percentage)}%
            </ThemedText>
          </View>
        </View>
      </View>
    );
  }
  
  return (
    <Card style={styles.milestoneCard}>
      <View style={styles.milestoneHeader}>
        <View
          style={[
            styles.milestoneIcon,
            {
              backgroundColor: milestone.completed ? AppColors.success : AppColors.primary + '20',
            },
          ]}
        >
          <IconSymbol
            name={getMilestoneIcon(milestone.type)}
            size={24}
            color={milestone.completed ? '#FFFFFF' : AppColors.primary}
          />
        </View>
        
        <View style={styles.milestoneInfo}>
          <ThemedText style={[styles.milestoneTitle, { color: textColor }]}>
            {milestone.title}
          </ThemedText>
          
          <ThemedText style={[styles.milestoneDescription, { color: textSecondaryColor }]}>
            {milestone.description}
          </ThemedText>
        </View>
        
        {milestone.completed && (
          <View style={styles.completedBadge}>
            <IconSymbol
              name="paperplane.fill"
              size={16}
              color={AppColors.success}
            />
          </View>
        )}
      </View>
      
      <View style={styles.milestoneProgress}>
        <View style={styles.progressInfo}>
          <ThemedText style={[styles.progressText, { color: textSecondaryColor }]}>
            {milestone.current_value} / {milestone.target_value}
          </ThemedText>
          
          <ThemedText style={[styles.progressPercentage, { color: textColor }]}>
            {Math.round(milestone.progress_percentage)}%
          </ThemedText>
        </View>
        
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(100, milestone.progress_percentage)}%`,
                backgroundColor: milestone.completed ? AppColors.success : AppColors.primary,
              },
            ]}
          />
        </View>
      </View>
    </Card>
  );
}

/**
 * Main milestone tracker component
 */
export function MilestoneTracker({
  userId,
  onMilestoneAchieved,
  showCelebration = true
}: MilestoneTrackerProps) {
  const { progressEntries } = useAnalyticsData();
  const { checkMilestones } = useProgressTracking();
  
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [celebrationMilestone, setCelebrationMilestone] = useState<Milestone | null>(null);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  
  // Initialize default milestones
  useEffect(() => {
    const defaultMilestones: Milestone[] = [
      {
        id: 'streak_7',
        type: 'streak',
        title: '7-Day Streak',
        description: 'Study for 7 consecutive days',
        target_value: 7,
        current_value: 0,
        progress_percentage: 0,
        completed: false,
        reward_points: 100,
        icon: 'paperplane.fill',
        color: AppColors.warning,
      },
      {
        id: 'words_100',
        type: 'words_learned',
        title: 'Century Learner',
        description: 'Learn 100 words',
        target_value: 100,
        current_value: 0,
        progress_percentage: 0,
        completed: false,
        reward_points: 200,
        icon: 'book.fill',
        color: AppColors.primary,
      },
      {
        id: 'time_600',
        type: 'time_studied',
        title: '10 Hour Scholar',
        description: 'Study for 10 hours total',
        target_value: 600, // 10 hours in minutes
        current_value: 0,
        progress_percentage: 0,
        completed: false,
        reward_points: 300,
        icon: 'flashcard.fill',
        color: AppColors.secondary,
      },
      {
        id: 'accuracy_90',
        type: 'accuracy',
        title: 'Precision Master',
        description: 'Achieve 90% accuracy',
        target_value: 90,
        current_value: 0,
        progress_percentage: 0,
        completed: false,
        reward_points: 150,
        icon: 'exclamationmark.triangle.fill',
        color: AppColors.success,
      },
    ];
    
    setMilestones(defaultMilestones);
  }, []);
  
  // Update milestone progress based on user data
  useEffect(() => {
    if (progressEntries.length === 0) return;
    
    const latestProgress = progressEntries[0];
    const totalStudyTime = progressEntries.reduce((sum, entry) => sum + entry.study_time_minutes, 0);
    const averageAccuracy = progressEntries.reduce((sum, entry) => sum + entry.accuracy_percentage, 0) / progressEntries.length;
    
    setMilestones(prev => prev.map(milestone => {
      let currentValue = 0;
      
      switch (milestone.type) {
        case 'streak':
          currentValue = latestProgress.streak_days;
          break;
        case 'words_learned':
          currentValue = latestProgress.deep_memory_words;
          break;
        case 'time_studied':
          currentValue = totalStudyTime;
          break;
        case 'accuracy':
          currentValue = Math.round(averageAccuracy);
          break;
      }
      
      const progress = Math.min(100, (currentValue / milestone.target_value) * 100);
      const completed = progress >= 100;
      
      // Check if milestone was just completed
      if (completed && !milestone.completed && showCelebration) {
        const updatedMilestone = {
          ...milestone,
          current_value: currentValue,
          progress_percentage: progress,
          completed
        };
        
        setCelebrationMilestone(updatedMilestone);
        setShowCelebrationModal(true);
        
        // Create achievement record
        const achievement: Achievement = {
          id: `achievement-${Date.now()}`,
          user_id: userId,
          milestone_id: milestone.id,
          achieved_at: new Date().toISOString(),
          value_achieved: currentValue,
          celebration_shown: true,
          shared: false
        };
        
        onMilestoneAchieved?.(updatedMilestone, achievement);
      }
      
      return {
        ...milestone,
        current_value: currentValue,
        progress_percentage: progress,
        completed
      };
    }));
  }, [progressEntries, userId, onMilestoneAchieved, showCelebration]);
  
  const activeMilestones = milestones.filter(m => !m.completed);
  const completedMilestones = milestones.filter(m => m.completed);
  
  return (
    <View style={styles.container}>
      {/* Active Milestones */}
      {activeMilestones.length > 0 && (
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            Current Goals
          </ThemedText>
          
          {activeMilestones.map(milestone => (
            <MilestoneProgress
              key={milestone.id}
              milestone={milestone}
            />
          ))}
        </View>
      )}
      
      {/* Completed Milestones */}
      {completedMilestones.length > 0 && (
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            Achievements ({completedMilestones.length})
          </ThemedText>
          
          <View style={styles.completedGrid}>
            {completedMilestones.map(milestone => (
              <MilestoneProgress
                key={milestone.id}
                milestone={milestone}
                compact
              />
            ))}
          </View>
        </View>
      )}
      
      {/* Celebration Modal */}
      {celebrationMilestone && (
        <MilestoneCelebration
          milestone={celebrationMilestone}
          visible={showCelebrationModal}
          onClose={() => {
            setShowCelebrationModal(false);
            setCelebrationMilestone(null);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.md,
  },
  
  // Milestone Card Styles
  milestoneCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  milestoneIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.xs / 2,
  },
  milestoneDescription: {
    fontSize: Typography.sizes.sm,
  },
  completedBadge: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: AppColors.success + '20',
  },
  milestoneProgress: {
    marginTop: Spacing.sm,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  progressText: {
    fontSize: Typography.sizes.sm,
  },
  progressPercentage: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  progressBar: {
    height: 8,
    backgroundColor: AppColors.gray200,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  
  // Compact Milestone Styles
  compactMilestone: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  compactIcon: {
    marginRight: Spacing.sm,
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.xs / 2,
  },
  compactProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  compactProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: AppColors.gray200,
    borderRadius: 2,
    overflow: 'hidden',
  },
  compactProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  compactPercentage: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    minWidth: 32,
  },
  completedGrid: {
    gap: Spacing.sm,
  },
  
  // Celebration Modal Styles
  celebrationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  celebrationCard: {
    width: Math.min(Dimensions.get('window').width - Spacing.xl * 2, 320),
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    pointerEvents: 'none',
  },
  confettiPiece: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  celebrationHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  celebrationIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  celebrationTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  celebrationStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.xs / 2,
  },
  statLabel: {
    fontSize: Typography.sizes.sm,
    opacity: 0.7,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: AppColors.gray300,
    marginHorizontal: Spacing.md,
  },
  celebrationFooter: {
    alignItems: 'center',
  },
  celebrationMessage: {
    fontSize: Typography.sizes.base,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});