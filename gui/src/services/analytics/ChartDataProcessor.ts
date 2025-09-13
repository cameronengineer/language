import {
  ProgressEntry,
  SessionEntry,
  ChartDataPoint,
  DualChartData,
  ChartTimeRange,
  AnalyticsFilterOptions,
  InteractiveChartConfig
} from '@/src/types/analytics';

/**
 * Processes raw analytics data into chart-ready formats
 */
export class ChartDataProcessor {
  /**
   * Process progress entries into dual chart data (line + bar combination)
   */
  static processDualChartData(
    progressEntries: ProgressEntry[],
    timeRange: ChartTimeRange = 'month',
    config?: Partial<InteractiveChartConfig>
  ): DualChartData {
    const filteredEntries = this.filterByTimeRange(progressEntries, timeRange);
    const sortedEntries = filteredEntries.sort((a, b) => a.date.localeCompare(b.date));
    
    const labels = sortedEntries.map(entry => this.formatDateLabel(entry.date, timeRange));
    
    // Primary data: Deep memory words (line chart)
    const primaryData: ChartDataPoint[] = sortedEntries.map(entry => ({
      date: entry.date,
      value: entry.deep_memory_words,
      label: `${entry.deep_memory_words} words in deep memory`,
      metadata: {
        total_words: entry.words_studied,
        accuracy: entry.accuracy_percentage,
        streak: entry.streak_days
      }
    }));
    
    // Secondary data: Study time (bar chart)
    const secondaryData: ChartDataPoint[] = sortedEntries.map(entry => ({
      date: entry.date,
      value: entry.study_time_minutes,
      label: `${entry.study_time_minutes} minutes studied`,
      metadata: {
        sessions: entry.session_count,
        goal_achieved: entry.goal_achieved,
        daily_goal: entry.daily_goal_minutes
      }
    }));
    
    return {
      labels,
      primary_data: primaryData,
      secondary_data: secondaryData,
      trends: {
        primary_trend: this.calculateTrend(primaryData),
        secondary_trend: this.calculateTrend(secondaryData),
        correlation: this.calculateCorrelation(primaryData, secondaryData)
      }
    };
  }

  /**
   * Generate weekly summary chart data
   */
  static processWeeklySummary(progressEntries: ProgressEntry[]): DualChartData {
    const weeklyData = this.groupByWeek(progressEntries);
    
    const labels = Object.keys(weeklyData).sort();
    
    const primaryData: ChartDataPoint[] = labels.map(week => {
      const weekEntries = weeklyData[week];
      const totalDeepMemory = weekEntries.reduce((sum, entry) => 
        Math.max(sum, entry.deep_memory_words), 0);
      
      return {
        date: week,
        value: totalDeepMemory,
        label: `${totalDeepMemory} words in deep memory`,
        metadata: {
          days_studied: weekEntries.filter(e => e.study_time_minutes > 0).length,
          total_sessions: weekEntries.reduce((sum, e) => sum + e.session_count, 0)
        }
      };
    });
    
    const secondaryData: ChartDataPoint[] = labels.map(week => {
      const weekEntries = weeklyData[week];
      const totalMinutes = weekEntries.reduce((sum, entry) => sum + entry.study_time_minutes, 0);
      
      return {
        date: week,
        value: totalMinutes,
        label: `${totalMinutes} minutes studied`,
        metadata: {
          average_per_day: Math.round(totalMinutes / 7),
          goals_achieved: weekEntries.filter(e => e.goal_achieved).length
        }
      };
    });
    
    return {
      labels: labels.map(week => this.formatWeekLabel(week)),
      primary_data: primaryData,
      secondary_data: secondaryData,
      trends: {
        primary_trend: this.calculateTrend(primaryData),
        secondary_trend: this.calculateTrend(secondaryData),
        correlation: this.calculateCorrelation(primaryData, secondaryData)
      }
    };
  }

  /**
   * Process session data for performance chart
   */
  static processPerformanceChart(
    sessionEntries: SessionEntry[],
    timeRange: ChartTimeRange = 'month'
  ): DualChartData {
    const filteredSessions = this.filterSessionsByTimeRange(sessionEntries, timeRange);
    const dailyPerformance = this.groupSessionsByDay(filteredSessions);
    
    const labels = Object.keys(dailyPerformance).sort();
    
    const primaryData: ChartDataPoint[] = labels.map(date => {
      const daySessions = dailyPerformance[date];
      const avgAccuracy = daySessions.reduce((sum, s) => sum + s.accuracy_percentage, 0) / daySessions.length;
      
      return {
        date,
        value: Math.round(avgAccuracy),
        label: `${Math.round(avgAccuracy)}% accuracy`,
        metadata: {
          sessions: daySessions.length,
          total_cards: daySessions.reduce((sum, s) => sum + s.cards_total, 0)
        }
      };
    });
    
    const secondaryData: ChartDataPoint[] = labels.map(date => {
      const daySessions = dailyPerformance[date];
      const avgResponseTime = daySessions.reduce((sum, s) => sum + s.average_response_time, 0) / daySessions.length;
      
      return {
        date,
        value: Math.round(avgResponseTime * 10) / 10, // Round to 1 decimal
        label: `${Math.round(avgResponseTime * 10) / 10}s avg response`,
        metadata: {
          fastest: Math.min(...daySessions.map(s => s.average_response_time)),
          slowest: Math.max(...daySessions.map(s => s.average_response_time))
        }
      };
    });
    
    return {
      labels: labels.map(date => this.formatDateLabel(date, timeRange)),
      primary_data: primaryData,
      secondary_data: secondaryData,
      trends: {
        primary_trend: this.calculateTrend(primaryData),
        secondary_trend: this.calculateTrend(secondaryData, true), // Inverted for response time
        correlation: this.calculateCorrelation(primaryData, secondaryData)
      }
    };
  }

  /**
   * Generate milestone progress data
   */
  static processMilestoneProgress(
    progressEntries: ProgressEntry[],
    milestoneTargets: { streak: number; words: number; time: number }
  ): { streak: ChartDataPoint[]; words: ChartDataPoint[]; time: ChartDataPoint[] } {
    const sortedEntries = progressEntries.sort((a, b) => a.date.localeCompare(b.date));
    
    return {
      streak: sortedEntries.map(entry => ({
        date: entry.date,
        value: (entry.streak_days / milestoneTargets.streak) * 100,
        label: `${entry.streak_days} day streak`,
        metadata: { target: milestoneTargets.streak, current: entry.streak_days }
      })),
      
      words: sortedEntries.map(entry => ({
        date: entry.date,
        value: (entry.deep_memory_words / milestoneTargets.words) * 100,
        label: `${entry.deep_memory_words} words learned`,
        metadata: { target: milestoneTargets.words, current: entry.deep_memory_words }
      })),
      
      time: sortedEntries.map(entry => ({
        date: entry.date,
        value: (entry.study_time_minutes / milestoneTargets.time) * 100,
        label: `${entry.study_time_minutes} minutes studied`,
        metadata: { target: milestoneTargets.time, current: entry.study_time_minutes }
      }))
    };
  }

  /**
   * Apply filters to chart data
   */
  static applyFilters(
    data: DualChartData,
    filters: Partial<AnalyticsFilterOptions>
  ): DualChartData {
    let filteredPrimary = [...data.primary_data];
    let filteredSecondary = [...data.secondary_data];
    let filteredLabels = [...data.labels];
    
    // Apply time range filter
    if (filters.time_range) {
      const cutoffDate = this.getCutoffDate(filters.time_range);
      const cutoffIndex = filteredPrimary.findIndex(point => 
        new Date(point.date) >= cutoffDate
      );
      
      if (cutoffIndex > 0) {
        filteredPrimary = filteredPrimary.slice(cutoffIndex);
        filteredSecondary = filteredSecondary.slice(cutoffIndex);
        filteredLabels = filteredLabels.slice(cutoffIndex);
      }
    }
    
    return {
      labels: filteredLabels,
      primary_data: filteredPrimary,
      secondary_data: filteredSecondary,
      trends: data.trends
    };
  }

  // === Helper Methods ===

  private static filterByTimeRange(
    entries: ProgressEntry[],
    timeRange: ChartTimeRange
  ): ProgressEntry[] {
    const cutoffDate = this.getCutoffDate(timeRange);
    return entries.filter(entry => new Date(entry.date) >= cutoffDate);
  }

  private static filterSessionsByTimeRange(
    sessions: SessionEntry[],
    timeRange: ChartTimeRange
  ): SessionEntry[] {
    const cutoffDate = this.getCutoffDate(timeRange);
    return sessions.filter(session => new Date(session.start_time) >= cutoffDate);
  }

  private static getCutoffDate(timeRange: ChartTimeRange): Date {
    const now = new Date();
    switch (timeRange) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'quarter':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      case 'all':
        return new Date(0);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  private static formatDateLabel(date: string, timeRange: ChartTimeRange): string {
    const dateObj = new Date(date);
    
    switch (timeRange) {
      case 'week':
        return dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      case 'month':
        return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'quarter':
      case 'year':
        return dateObj.toLocaleDateString('en-US', { month: 'short' });
      default:
        return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }

  private static formatWeekLabel(weekString: string): string {
    const [year, week] = weekString.split('-W');
    return `W${week}`;
  }

  private static groupByWeek(entries: ProgressEntry[]): Record<string, ProgressEntry[]> {
    return entries.reduce((groups, entry) => {
      const date = new Date(entry.date);
      const week = this.getWeekString(date);
      
      if (!groups[week]) groups[week] = [];
      groups[week].push(entry);
      
      return groups;
    }, {} as Record<string, ProgressEntry[]>);
  }

  private static groupSessionsByDay(sessions: SessionEntry[]): Record<string, SessionEntry[]> {
    return sessions.reduce((groups, session) => {
      const date = new Date(session.start_time).toISOString().split('T')[0];
      
      if (!groups[date]) groups[date] = [];
      groups[date].push(session);
      
      return groups;
    }, {} as Record<string, SessionEntry[]>);
  }

  private static getWeekString(date: Date): string {
    const year = date.getFullYear();
    const week = this.getWeekNumber(date);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  private static getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  private static calculateTrend(
    data: ChartDataPoint[],
    inverted: boolean = false
  ): 'up' | 'down' | 'stable' {
    if (data.length < 2) return 'stable';
    
    const first = data[0].value;
    const last = data[data.length - 1].value;
    const change = (last - first) / Math.max(first, 1);
    
    const threshold = 0.1; // 10% threshold
    let trend: 'up' | 'down' | 'stable';
    
    if (change > threshold) trend = 'up';
    else if (change < -threshold) trend = 'down';
    else trend = 'stable';
    
    // Invert trend for metrics where lower is better (e.g., response time)
    if (inverted) {
      if (trend === 'up') return 'down';
      if (trend === 'down') return 'up';
    }
    
    return trend;
  }

  private static calculateCorrelation(
    data1: ChartDataPoint[],
    data2: ChartDataPoint[]
  ): number {
    if (data1.length !== data2.length || data1.length === 0) return 0;
    
    const values1 = data1.map(d => d.value);
    const values2 = data2.map(d => d.value);
    
    const mean1 = values1.reduce((sum, val) => sum + val, 0) / values1.length;
    const mean2 = values2.reduce((sum, val) => sum + val, 0) / values2.length;
    
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
    return denominator > 0 ? Math.round((numerator / denominator) * 100) / 100 : 0;
  }
}