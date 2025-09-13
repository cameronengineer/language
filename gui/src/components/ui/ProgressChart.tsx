import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemeColor } from '@/src/utils/use-theme-color';
import { Spacing, BorderRadius, Typography, AppColors } from '@/src/utils/theme';
import { DailyProgress } from '@/src/types/user';

interface ProgressChartProps {
  type: 'line' | 'bar' | 'pie' | 'progress';
  data?: DailyProgress[];
  title?: string;
  height?: number;
  style?: ViewStyle;
  showMockData?: boolean;
}

/**
 * Enhanced chart component for dashboard progress visualization
 * Shows mock data visualization until full charting library is implemented
 */
export function ProgressChart({
  type,
  data = [],
  title,
  height = 200,
  style,
  showMockData = true,
}: ProgressChartProps) {
  const backgroundColor = useThemeColor({}, 'surface');
  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');

  // Generate mock data if none provided and showMockData is true
  const chartData = React.useMemo(() => {
    if (data.length > 0) return data;
    if (!showMockData) return [];

    const mockData: DailyProgress[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      mockData.push({
        date: date.toISOString().split('T')[0],
        words_learned: Math.floor(Math.random() * 15) + 5,
        minutes_studied: Math.floor(Math.random() * 40) + 10,
      });
    }
    
    return mockData;
  }, [data, showMockData]);

  const maxMinutes = Math.max(...chartData.map(d => d.minutes_studied), 1);
  const maxWords = Math.max(...chartData.map(d => d.words_learned), 1);

  const renderBarChart = () => {
    const chartHeight = height - 80; // Account for title and labels
    const barWidth = 20;
    const spacing = 8;
    const chartWidth = chartData.length * (barWidth + spacing) - spacing;

    return (
      <View style={styles.chartContainer}>
        <View style={[styles.barChart, { height: chartHeight, width: chartWidth }]}>
          {chartData.map((item, index) => {
            const barHeight = (item.minutes_studied / maxMinutes) * (chartHeight - 40);
            const wordBarHeight = (item.words_learned / maxWords) * (chartHeight - 40);
            
            return (
              <View
                key={item.date}
                style={[
                  styles.barGroup,
                  {
                    left: index * (barWidth + spacing),
                    width: barWidth,
                  }
                ]}
              >
                {/* Minutes bar */}
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: AppColors.primary,
                      width: barWidth / 2 - 1,
                    }
                  ]}
                />
                {/* Words bar */}
                <View
                  style={[
                    styles.bar,
                    {
                      height: wordBarHeight,
                      backgroundColor: AppColors.success,
                      width: barWidth / 2 - 1,
                      left: barWidth / 2 + 1,
                    }
                  ]}
                />
                {/* Date label */}
                <Text style={[styles.barLabel, { color: textSecondaryColor, width: barWidth }]}>
                  {new Date(item.date).getDate()}
                </Text>
              </View>
            );
          })}
        </View>
        
        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: AppColors.primary }]} />
            <Text style={[styles.legendText, { color: textSecondaryColor }]}>Minutes</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: AppColors.success }]} />
            <Text style={[styles.legendText, { color: textSecondaryColor }]}>Words</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderPlaceholder = () => {
    const getChartTypeDisplay = () => {
      switch (type) {
        case 'line':
          return '📈 Line Chart';
        case 'bar':
          return '📊 Bar Chart';
        case 'pie':
          return '🥧 Pie Chart';
        case 'progress':
          return '⏳ Progress Chart';
        default:
          return '📊 Chart';
      }
    };

    return (
      <View style={styles.placeholder}>
        <Text style={[styles.chartType, { color: textSecondaryColor }]}>
          {getChartTypeDisplay()}
        </Text>
        <Text style={[styles.description, { color: textSecondaryColor }]}>
          Chart implementation coming in later phases
        </Text>
        {chartData.length > 0 && (
          <Text style={[styles.dataCount, { color: textSecondaryColor }]}>
            {chartData.length} data points
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor, height, borderColor },
      style,
    ]}>
      {title && (
        <Text style={[styles.title, { color: textColor }]}>
          {title}
        </Text>
      )}
      
      {type === 'bar' && chartData.length > 0 ? renderBarChart() : renderPlaceholder()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: AppColors.gray200,
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartType: {
    fontSize: Typography.sizes['2xl'],
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  dataCount: {
    fontSize: Typography.sizes.xs,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  // Chart-specific styles
  chartContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barChart: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  barGroup: {
    position: 'absolute',
    bottom: 20,
    alignItems: 'center',
  },
  bar: {
    position: 'absolute',
    bottom: 20,
    borderRadius: 2,
  },
  barLabel: {
    position: 'absolute',
    bottom: 0,
    fontSize: Typography.sizes.xs,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: Typography.sizes.xs,
  },
});