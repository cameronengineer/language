import {
  ProgressEntry,
  SessionEntry,
  LearningAnalytics,
  RetentionMetrics,
  PerformanceMetrics,
  StudyPattern,
  WordStrength,
  AnalyticsRecommendation,
  ChartDataPoint,
  DualChartData,
  Milestone,
  SRSConfig,
  ReviewSchedule,
  AnalyticsFilterOptions,
  ChartTimeRange
} from '@/src/types/analytics';
import type { CEFRLevel } from '@/src/types/language';

/**
 * Core analytics engine for processing learning data and generating insights
 */
export class AnalyticsEngine {
  private srsConfig: SRSConfig;

  constructor(config?: Partial<SRSConfig>) {
    this.srsConfig = {
      algorithm: 'sm2',
      initial_interval: 1,
      graduation_interval: 4,
      easy_interval: 4,
      max_interval: 365,
      ease_factor_modifier: 0.15,
      difficulty_modifier: 0.2,
      lapse_modifier: 0.5,
      ...config
    };
  }

  /**
   * Generate comprehensive learning analytics from raw data
   */
  generateLearningAnalytics(
    progressEntries: ProgressEntry[],
    sessionEntries: SessionEntry[],
    period: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): LearningAnalytics {
    const endDate = new Date();
    const startDate = this.getStartDateForPeriod(endDate, period);
    
    const filteredProgress = this.filterByDateRange(progressEntries, startDate, endDate);
    const filteredSessions = this.filterSessionsByDateRange(sessionEntries, startDate, endDate);

    return {
      user_id: progressEntries[0]?.user_id || '',
      analysis_period: period,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      learning_velocity: this.calculateLearningVelocity(filteredProgress, filteredSessions),
      retention_rate: this.calculateRetentionRate(filteredSessions),
      performance: this.calculatePerformanceMetrics(filteredSessions),
      study_patterns: this.analyzeStudyPatterns(filteredSessions),
      difficulty_progress: this.analyzeDifficultyProgress(filteredSessions),
      weak_areas: this.identifyWeakAreas(filteredSessions),
      strong_areas: this.identifyStrongAreas(filteredSessions),
      recommendations: this.generateRecommendations(filteredProgress, filteredSessions),
      generated_at: new Date().toISOString()
    };
  }

  /**
   * Calculate learning velocity metrics
   */
  private calculateLearningVelocity(
    progressEntries: ProgressEntry[],
    sessionEntries: SessionEntry[]
  ) {
    const totalWords = progressEntries.reduce((sum, entry) => sum + entry.words_learned, 0);
    const totalMinutes = progressEntries.reduce((sum, entry) => sum + entry.study_time_minutes, 0);
    const totalSessions = sessionEntries.length;
    const weekCount = Math.max(1, progressEntries.length / 7);

    const currentWeekWords = this.getRecentWeekAverage(progressEntries, 'words_learned');
    const previousWeekWords = this.getPreviousWeekAverage(progressEntries, 'words_learned');
    
    return {
      words_per_week: totalWords / weekCount,
      minutes_per_day: totalMinutes / Math.max(1, progressEntries.length),
      sessions_per_week: totalSessions / weekCount,
      trend: this.calculateTrend(currentWeekWords, previousWeekWords)
    };
  }

  /**
   * Calculate retention rate metrics
   */
  private calculateRetentionRate(sessionEntries: SessionEntry[]) {
    // Mock implementation - in real app, would analyze word retention over time
    const recentSessions = sessionEntries.slice(-10);
    const totalCards = recentSessions.reduce((sum, session) => sum + session.cards_total, 0);
    const correctCards = recentSessions.reduce((sum, session) => sum + session.cards_correct, 0);
    
    const overallRetention = totalCards > 0 ? (correctCards / totalCards) * 100 : 0;
    
    return {
      day_1: Math.min(100, overallRetention * 1.1),
      day_7: overallRetention,
      day_30: Math.max(0, overallRetention * 0.85),
      overall: overallRetention
    };
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(sessionEntries: SessionEntry[]) {
    const recentSessions = sessionEntries.slice(-20);
    const accuracyValues = recentSessions.map(s => s.accuracy_percentage);
    const responseTimeValues = recentSessions.map(s => s.average_response_time);
    
    const currentAccuracy = this.average(accuracyValues.slice(-5));
    const previousAccuracy = this.average(accuracyValues.slice(-10, -5));
    
    const currentResponseTime = this.average(responseTimeValues.slice(-5));
    const previousResponseTime = this.average(responseTimeValues.slice(-10, -5));
    
    return {
      average_accuracy: this.average(accuracyValues),
      accuracy_trend: this.mapTrendToPerformance(this.calculateTrend(currentAccuracy, previousAccuracy)),
      average_response_time: this.average(responseTimeValues),
      response_time_trend: this.mapTrendToPerformance(this.calculateTrend(previousResponseTime, currentResponseTime)), // Inverted for response time
      consistency_score: this.calculateConsistencyScore(accuracyValues)
    };
  }

  /**
   * Analyze study patterns
   */
  private analyzeStudyPatterns(sessionEntries: SessionEntry[]) {
    const hours = sessionEntries.map(s => new Date(s.start_time).getHours());
    const durations = sessionEntries.map(s => s.duration_minutes);
    
    const hourCounts = this.countOccurrences(hours);
    const mostActiveHour = this.getMostFrequent(hourCounts);
    
    // Mock productivity calculation
    const productivityByHour = this.calculateProductivityByHour(sessionEntries);
    const mostProductiveHour = this.getMostProductiveHour(productivityByHour);
    
    return {
      optimal_study_time: this.average(durations),
      preferred_study_hour: mostActiveHour,
      most_productive_day: this.getMostProductiveDay(sessionEntries),
      session_frequency: sessionEntries.length / 7, // sessions per week
      break_pattern: this.analyzeBreakPattern(sessionEntries)
    };
  }

  /**
   * Analyze difficulty progress
   */
  private analyzeDifficultyProgress(sessionEntries: SessionEntry[]) {
    const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];
    const progress: Record<CEFRLevel, any> = {} as Record<CEFRLevel, any>;
    
    levels.forEach(level => {
      const levelSessions = sessionEntries.filter(s => s.difficulty_level === level);
      const totalWords = levelSessions.reduce((sum, s) => sum + s.words_learned.length, 0);
      const totalTime = levelSessions.reduce((sum, s) => sum + s.duration_minutes, 0);
      const accuracyValues = levelSessions.map(s => s.accuracy_percentage);
      
      progress[level] = {
        words_learned: totalWords,
        accuracy: this.average(accuracyValues),
        time_spent_minutes: totalTime,
        confidence_level: Math.min(100, this.average(accuracyValues) * 1.2)
      };
    });
    
    return progress;
  }

  /**
   * Generate personalized recommendations
   */
  private generateRecommendations(
    progressEntries: ProgressEntry[],
    sessionEntries: SessionEntry[]
  ): AnalyticsRecommendation[] {
    const recommendations: AnalyticsRecommendation[] = [];
    
    // Study time recommendation
    const avgDuration = this.average(sessionEntries.map(s => s.duration_minutes));
    if (avgDuration < 15) {
      recommendations.push({
        id: 'study_time_increase',
        type: 'study_time',
        priority: 'high',
        title: 'Increase Study Duration',
        description: 'Your sessions are quite short. Longer sessions can improve retention.',
        action_text: 'Try 20-minute sessions',
        estimated_impact: 'Could improve retention by 25%',
        based_on: ['session_duration_analysis', 'retention_correlation']
      });
    }
    
    // Consistency recommendation
    const recentDays = this.getRecentStudyDays(progressEntries, 7);
    if (recentDays < 5) {
      recommendations.push({
        id: 'consistency_improvement',
        type: 'frequency',
        priority: 'medium',
        title: 'Improve Consistency',
        description: 'Regular daily practice leads to better long-term retention.',
        action_text: 'Set a daily reminder',
        estimated_impact: 'Could increase streak by 40%',
        based_on: ['study_frequency_analysis', 'streak_patterns']
      });
    }
    
    return recommendations;
  }

  /**
   * Generate chart data for visualization
   */
  generateChartData(
    progressEntries: ProgressEntry[],
    timeRange: ChartTimeRange = 'month'
  ): DualChartData {
    const endDate = new Date();
    const startDate = this.getStartDateForPeriod(endDate, timeRange);
    const filteredEntries = this.filterByDateRange(progressEntries, startDate, endDate);
    
    const labels = filteredEntries.map(entry => entry.date);
    
    const primaryData: ChartDataPoint[] = filteredEntries.map(entry => ({
      date: entry.date,
      value: entry.deep_memory_words,
      label: `${entry.deep_memory_words} words`
    }));
    
    const secondaryData: ChartDataPoint[] = filteredEntries.map(entry => ({
      date: entry.date,
      value: entry.study_time_minutes,
      label: `${entry.study_time_minutes} minutes`
    }));
    
    return {
      labels,
      primary_data: primaryData,
      secondary_data: secondaryData,
      trends: {
        primary_trend: this.calculateDataTrend(primaryData),
        secondary_trend: this.calculateDataTrend(secondaryData),
        correlation: this.calculateCorrelation(primaryData, secondaryData)
      }
    };
  }

  /**
   * Spaced Repetition Scheduling
   */
  calculateNextReview(wordStrength: WordStrength, wasCorrect: boolean): ReviewSchedule {
    const { strength, consecutive_correct, consecutive_incorrect, ease_factor, interval_days } = wordStrength;
    
    let newInterval = interval_days;
    let newEaseFactor = ease_factor;
    
    if (wasCorrect) {
      // SM-2 algorithm implementation
      if (consecutive_correct === 0) {
        newInterval = this.srsConfig.initial_interval;
      } else if (consecutive_correct === 1) {
        newInterval = this.srsConfig.graduation_interval;
      } else {
        newInterval = Math.round(interval_days * newEaseFactor);
      }
      
      newInterval = Math.min(newInterval, this.srsConfig.max_interval);
    } else {
      // Reset on incorrect answer
      newInterval = this.srsConfig.initial_interval;
      newEaseFactor = Math.max(1.3, ease_factor - 0.2);
    }
    
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
    
    return {
      word_id: wordStrength.word_id,
      current_interval: newInterval,
      next_review: nextReviewDate.toISOString(),
      priority: this.calculatePriority(wordStrength, wasCorrect),
      estimated_difficulty: this.estimateDifficulty(wordStrength),
      predicted_success_rate: this.predictSuccessRate(wordStrength)
    };
  }

  // === Helper Methods ===

  private getStartDateForPeriod(endDate: Date, period: string): Date {
    const start = new Date(endDate);
    switch (period) {
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(start.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;
    }
    return start;
  }

  private filterByDateRange(entries: ProgressEntry[], start: Date, end: Date): ProgressEntry[] {
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= start && entryDate <= end;
    });
  }

  private filterSessionsByDateRange(entries: SessionEntry[], start: Date, end: Date): SessionEntry[] {
    return entries.filter(entry => {
      const entryDate = new Date(entry.start_time);
      return entryDate >= start && entryDate <= end;
    });
  }

  private average(values: number[]): number {
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  private calculateTrend(current: number, previous: number): 'increasing' | 'decreasing' | 'stable' {
    const threshold = 0.05; // 5% threshold
    const change = (current - previous) / Math.max(previous, 1);
    
    if (change > threshold) return 'increasing';
    if (change < -threshold) return 'decreasing';
    return 'stable';
  }

  private mapTrendToPerformance(trend: 'increasing' | 'decreasing' | 'stable'): 'improving' | 'declining' | 'stable' {
    switch (trend) {
      case 'increasing':
        return 'improving';
      case 'decreasing':
        return 'declining';
      case 'stable':
        return 'stable';
    }
  }

  private calculateDataTrend(data: ChartDataPoint[]): 'up' | 'down' | 'stable' {
    if (data.length < 2) return 'stable';
    
    const first = data[0].value;
    const last = data[data.length - 1].value;
    const change = (last - first) / Math.max(first, 1);
    
    if (change > 0.1) return 'up';
    if (change < -0.1) return 'down';
    return 'stable';
  }

  private calculateCorrelation(data1: ChartDataPoint[], data2: ChartDataPoint[]): number {
    // Simplified correlation calculation
    const values1 = data1.map(d => d.value);
    const values2 = data2.map(d => d.value);
    
    if (values1.length !== values2.length || values1.length === 0) return 0;
    
    const mean1 = this.average(values1);
    const mean2 = this.average(values2);
    
    let numerator = 0;
    let sum1Sq = 0;
    let sum2Sq = 0;
    
    for (let i = 0; i < values1.length; i++) {
      const diff1 = values1[i] - mean1;
      const diff2 = values2[i] - mean2;
      numerator += diff1 * diff2;
      sum1Sq += diff1 * diff1;
      sum2Sq += diff2 * diff2;
    }
    
    const denominator = Math.sqrt(sum1Sq * sum2Sq);
    return denominator > 0 ? numerator / denominator : 0;
  }

  private getRecentWeekAverage(entries: ProgressEntry[], field: keyof ProgressEntry): number {
    const recent = entries.slice(-7);
    return this.average(recent.map(entry => entry[field] as number));
  }

  private getPreviousWeekAverage(entries: ProgressEntry[], field: keyof ProgressEntry): number {
    const previous = entries.slice(-14, -7);
    return this.average(previous.map(entry => entry[field] as number));
  }

  private calculateConsistencyScore(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = this.average(values);
    const variance = this.average(values.map(v => Math.pow(v - mean, 2)));
    const standardDeviation = Math.sqrt(variance);
    
    // Convert to 0-100 scale (lower std dev = higher consistency)
    return Math.max(0, 100 - (standardDeviation / mean) * 100);
  }

  private countOccurrences(array: number[]): Record<number, number> {
    return array.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
  }

  private getMostFrequent(counts: Record<number, number>): number {
    return parseInt(Object.keys(counts).reduce((a, b) => counts[parseInt(a)] > counts[parseInt(b)] ? a : b));
  }

  private calculateProductivityByHour(sessions: SessionEntry[]): Record<number, number> {
    const productivity: Record<number, number> = {};
    
    sessions.forEach(session => {
      const hour = new Date(session.start_time).getHours();
      if (!productivity[hour]) productivity[hour] = 0;
      productivity[hour] += session.accuracy_percentage;
    });
    
    // Average productivity by hour
    Object.keys(productivity).forEach(hour => {
      const sessionsAtHour = sessions.filter(s => new Date(s.start_time).getHours() === parseInt(hour));
      productivity[parseInt(hour)] /= sessionsAtHour.length;
    });
    
    return productivity;
  }

  private getMostProductiveHour(productivity: Record<number, number>): number {
    return parseInt(Object.keys(productivity).reduce((a, b) =>
      productivity[parseInt(a)] > productivity[parseInt(b)] ? a : b
    ));
  }

  private getMostProductiveDay(sessions: SessionEntry[]): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayProductivity: Record<string, number[]> = {};
    
    sessions.forEach(session => {
      const day = days[new Date(session.start_time).getDay()];
      if (!dayProductivity[day]) dayProductivity[day] = [];
      dayProductivity[day].push(session.accuracy_percentage);
    });
    
    let bestDay = 'Monday';
    let bestScore = 0;
    
    Object.keys(dayProductivity).forEach(day => {
      const avgScore = this.average(dayProductivity[day]);
      if (avgScore > bestScore) {
        bestScore = avgScore;
        bestDay = day;
      }
    });
    
    return bestDay;
  }

  private analyzeBreakPattern(sessions: SessionEntry[]): 'regular' | 'irregular' | 'weekend_heavy' | 'weekday_heavy' {
    const weekendSessions = sessions.filter(s => {
      const day = new Date(s.start_time).getDay();
      return day === 0 || day === 6;
    });
    
    const weekdaySessions = sessions.filter(s => {
      const day = new Date(s.start_time).getDay();
      return day >= 1 && day <= 5;
    });
    
    const weekendRatio = weekendSessions.length / Math.max(sessions.length, 1);
    
    if (weekendRatio > 0.6) return 'weekend_heavy';
    if (weekendRatio < 0.2) return 'weekday_heavy';
    
    // Check regularity based on gaps between sessions
    const gaps = this.calculateSessionGaps(sessions);
    const avgGap = this.average(gaps);
    const gapVariation = this.calculateConsistencyScore(gaps);
    
    return gapVariation > 70 ? 'regular' : 'irregular';
  }

  private calculateSessionGaps(sessions: SessionEntry[]): number[] {
    const gaps: number[] = [];
    
    for (let i = 1; i < sessions.length; i++) {
      const currentDate = new Date(sessions[i].start_time);
      const previousDate = new Date(sessions[i - 1].start_time);
      const gapDays = (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24);
      gaps.push(gapDays);
    }
    
    return gaps;
  }

  private getRecentStudyDays(entries: ProgressEntry[], days: number): number {
    const recent = entries.slice(-days);
    return recent.filter(entry => entry.study_time_minutes > 0).length;
  }

  private identifyWeakAreas(sessions: SessionEntry[]): string[] {
    const areas: string[] = [];
    
    const recentSessions = sessions.slice(-10);
    const avgAccuracy = this.average(recentSessions.map(s => s.accuracy_percentage));
    
    if (avgAccuracy < 70) areas.push('Overall accuracy needs improvement');
    
    const avgResponseTime = this.average(recentSessions.map(s => s.average_response_time));
    if (avgResponseTime > 5) areas.push('Response time could be faster');
    
    return areas;
  }

  private identifyStrongAreas(sessions: SessionEntry[]): string[] {
    const areas: string[] = [];
    
    const recentSessions = sessions.slice(-10);
    const avgAccuracy = this.average(recentSessions.map(s => s.accuracy_percentage));
    
    if (avgAccuracy > 85) areas.push('Excellent accuracy performance');
    
    const consistency = this.calculateConsistencyScore(recentSessions.map(s => s.accuracy_percentage));
    if (consistency > 80) areas.push('Very consistent performance');
    
    return areas;
  }

  private calculatePriority(wordStrength: WordStrength, wasCorrect: boolean): 'high' | 'medium' | 'low' {
    if (!wasCorrect || wordStrength.strength < 0.3) return 'high';
    if (wordStrength.strength < 0.7) return 'medium';
    return 'low';
  }

  private estimateDifficulty(wordStrength: WordStrength): number {
    return Math.max(0.1, Math.min(1.0, 1 - wordStrength.strength + wordStrength.difficulty_modifier));
  }

  private predictSuccessRate(wordStrength: WordStrength): number {
    const baseRate = wordStrength.strength * 100;
    const consistencyBonus = wordStrength.consecutive_correct * 5;
    const recencyPenalty = this.calculateRecencyPenalty(wordStrength.last_reviewed);
    
    return Math.max(10, Math.min(95, baseRate + consistencyBonus - recencyPenalty));
  }

  private calculateRecencyPenalty(lastReviewed: string): number {
    const daysSince = (Date.now() - new Date(lastReviewed).getTime()) / (1000 * 60 * 60 * 24);
    return Math.min(30, daysSince * 2); // 2% penalty per day, max 30%
  }
}

export const analyticsEngine = new AnalyticsEngine();