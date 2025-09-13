import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text } from 'react-native';
import { useThemeColor } from '@/src/utils/use-theme-color';
import { Spacing, BorderRadius, Typography, AppColors } from '@/src/utils/theme';
import { useChartData, useAnalyticsActions } from '@/src/stores/analyticsStore';
import { ChartTimeRange } from '@/src/types/analytics';
import { ThemedText, LoadingSpinner, ErrorMessage } from '@/src/components/ui';
import { IconSymbol } from '@/src/components/ui/ui/icon-symbol';

interface MonthlyProgressChartProps {
  userId: string;
  height?: number;
  showTimeRangeSelector?: boolean;
  onDataPointPress?: (date: string, data: any) => void;
}

interface DataPoint {
  x: number;
  y: number;
  date: string;
  label: string;
  metadata?: any;
}

/**
 * Enhanced progress chart with dual visualization (line + bar chart)
 * Shows deep memory words progression (line) and study time (bars)
 */
export function MonthlyProgressChart({
  userId,
  height = 250,
  showTimeRangeSelector = true,
  onDataPointPress
}: MonthlyProgressChartProps) {
  const backgroundColor = useThemeColor({}, 'surface');
  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  
  const {
    chartData,
    currentTimeRange,
    isLoading,
    error,
    setTimeRange
  } = useChartData();
  
  const { loadAnalyticsData } = useAnalyticsActions();
  const [selectedPoint, setSelectedPoint] = useState<DataPoint | null>(null);
  
  // Load analytics data when component mounts
  useEffect(() => {
    if (userId) {
      loadAnalyticsData(userId).catch(console.error);
    }
  }, [userId, loadAnalyticsData]);
  
  // Process chart data for rendering
  const processedData = useMemo(() => {
    if (!chartData || chartData.primary_data.length === 0) return null;
    
    const screenWidth = Dimensions.get('window').width;
    const chartWidth = screenWidth - (Spacing.md * 4); // Account for padding
    const chartHeight = height - 120; // Account for title, legend, and time selector
    
    const primaryData = chartData.primary_data;
    const secondaryData = chartData.secondary_data;
    
    // Find data ranges
    const primaryMax = Math.max(...primaryData.map(d => d.value));
    const primaryMin = Math.min(...primaryData.map(d => d.value));
    const secondaryMax = Math.max(...secondaryData.map(d => d.value));
    
    // Create scaled data points
    const linePoints: DataPoint[] = primaryData.map((point, index) => ({
      x: (index / Math.max(primaryData.length - 1, 1)) * chartWidth,
      y: chartHeight - ((point.value - primaryMin) / Math.max(primaryMax - primaryMin, 1)) * chartHeight,
      date: point.date,
      label: point.label || `${point.value} words`,
      metadata: point.metadata
    }));
    
    const barPoints: DataPoint[] = secondaryData.map((point, index) => ({
      x: (index / Math.max(secondaryData.length - 1, 1)) * chartWidth,
      y: (point.value / Math.max(secondaryMax, 1)) * chartHeight,
      date: point.date,
      label: point.label || `${point.value} minutes`,
      metadata: point.metadata
    }));
    
    return {
      linePoints,
      barPoints,
      chartWidth,
      chartHeight,
      primaryMax,
      secondaryMax,
      labels: chartData.labels
    };
  }, [chartData, height]);
  
  const timeRangeOptions: { key: ChartTimeRange; label: string }[] = [
    { key: 'week', label: '1W' },
    { key: 'month', label: '1M' },
    { key: 'quarter', label: '3M' },
    { key: 'year', label: '1Y' }
  ];
  
  const handleDataPointPress = (point: DataPoint) => {
    setSelectedPoint(point);
    onDataPointPress?.(point.date, point.metadata);
  };
  
  const renderSVGChart = () => {
    if (!processedData) return null;
    
    const { linePoints, barPoints, chartWidth, chartHeight } = processedData;
    const barWidth = Math.max(8, chartWidth / Math.max(barPoints.length, 1) * 0.6);
    
    return (
      <View style={[styles.chartContainer, { width: chartWidth, height: chartHeight }]}>
        {/* Render bars (study time) */}
        {barPoints.map((point, index) => (
          <TouchableOpacity
            key={`bar-${index}`}
            style={[
              styles.bar,
              {
                left: point.x - barWidth / 2,
                bottom: 0,
                width: barWidth,
                height: point.y,
                backgroundColor: AppColors.secondary + '40', // Semi-transparent
              }
            ]}
            onPress={() => handleDataPointPress(point)}
            activeOpacity={0.7}
          />
        ))}
        
        {/* Render line chart (deep memory words) */}
        <View style={styles.lineContainer}>
          {linePoints.map((point, index) => {
            const nextPoint = linePoints[index + 1];
            return (
              <View key={`line-segment-${index}`}>
                {/* Line segment */}
                {nextPoint && (
                  <View
                    style={[
                      styles.lineSegment,
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
                <TouchableOpacity
                  style={[
                    styles.dataPoint,
                    {
                      left: point.x - 6,
                      top: point.y - 6,
                      backgroundColor: AppColors.primary,
                      borderColor: backgroundColor,
                      opacity: selectedPoint === point ? 1 : 0.8
                    }
                  ]}
                  onPress={() => handleDataPointPress(point)}
                  activeOpacity={0.6}
                />
              </View>
            );
          })}
        </View>
        
        {/* Selected point tooltip */}
        {selectedPoint && (
          <View
            style={[
              styles.tooltip,
              {
                left: Math.min(selectedPoint.x, chartWidth - 120),
                top: Math.max(0, selectedPoint.y - 40),
                backgroundColor: textColor,
              }
            ]}
          >
            <Text style={[styles.tooltipText, { color: backgroundColor }]}>
              {selectedPoint.label}
            </Text>
          </View>
        )}
      </View>
    );
  };
  
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor, height, borderColor }]}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <ThemedText style={styles.loadingText}>
            Loading progress data...
          </ThemedText>
        </View>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor, height, borderColor }]}>
        <ErrorMessage
          message={error.message}
          title="Failed to load chart"
          variant="error"
          actionText="Retry"
          onAction={() => loadAnalyticsData(userId)}
        />
      </View>
    );
  }
  
  if (!chartData || !processedData) {
    return (
      <View style={[styles.container, { backgroundColor, height, borderColor }]}>
        <View style={styles.emptyContainer}>
          <IconSymbol
            name="paperplane.fill"
            size={32}
            color={textSecondaryColor}
          />
          <ThemedText style={[styles.emptyText, { color: textSecondaryColor }]}>
            No progress data available
          </ThemedText>
          <ThemedText style={[styles.emptySubtext, { color: textSecondaryColor }]}>
            Start practicing to see your progress
          </ThemedText>
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor, height, borderColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="subtitle" style={styles.title}>
          Learning Progress
        </ThemedText>
        
        {/* Trend indicators */}
        <View style={styles.trendContainer}>
          <View style={styles.trendItem}>
            <IconSymbol
              name={chartData.trends.primary_trend === 'up' ? 'chevron.right' :
                    chartData.trends.primary_trend === 'down' ? 'chevron.right' : 'chevron.right'}
              size={16}
              color={chartData.trends.primary_trend === 'up' ? AppColors.success :
                    chartData.trends.primary_trend === 'down' ? AppColors.error : textSecondaryColor}
            />
            <Text style={[styles.trendText, { color: textSecondaryColor }]}>
              Words
            </Text>
          </View>
          
          <View style={styles.trendItem}>
            <IconSymbol
              name={chartData.trends.secondary_trend === 'up' ? 'chevron.right' :
                    chartData.trends.secondary_trend === 'down' ? 'chevron.right' : 'chevron.right'}
              size={16}
              color={chartData.trends.secondary_trend === 'up' ? AppColors.success :
                    chartData.trends.secondary_trend === 'down' ? AppColors.error : textSecondaryColor}
            />
            <Text style={[styles.trendText, { color: textSecondaryColor }]}>
              Time
            </Text>
          </View>
        </View>
      </View>
      
      {/* Chart */}
      <View style={styles.chartWrapper}>
        {renderSVGChart()}
      </View>
      
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: AppColors.primary }]} />
          <Text style={[styles.legendText, { color: textSecondaryColor }]}>
            Deep Memory Words
          </Text>
        </View>
        
        <View style={styles.legendItem}>
          <View style={[styles.legendBar, { backgroundColor: AppColors.secondary + '40' }]} />
          <Text style={[styles.legendText, { color: textSecondaryColor }]}>
            Study Time (min)
          </Text>
        </View>
      </View>
      
      {/* Time Range Selector */}
      {showTimeRangeSelector && (
        <View style={styles.timeRangeSelector}>
          {timeRangeOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.timeRangeButton,
                {
                  backgroundColor: currentTimeRange === option.key ? AppColors.primary : 'transparent',
                  borderColor: currentTimeRange === option.key ? AppColors.primary : borderColor
                }
              ]}
              onPress={() => setTimeRange(option.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.timeRangeButtonText,
                  {
                    color: currentTimeRange === option.key ? '#FFFFFF' : textSecondaryColor
                  }
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.sm,
    textAlign: 'center',
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: Spacing.sm,
    fontSize: Typography.sizes.base,
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
  trendContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  trendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
  },
  trendText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  chartWrapper: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  chartContainer: {
    position: 'relative',
  },
  bar: {
    position: 'absolute',
    borderRadius: 2,
  },
  lineContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  lineSegment: {
    height: 2,
    borderRadius: 1,
  },
  dataPoint: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  tooltip: {
    position: 'absolute',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  tooltipText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendLine: {
    width: 16,
    height: 2,
    borderRadius: 1,
  },
  legendBar: {
    width: 12,
    height: 8,
    borderRadius: 2,
  },
  legendText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  timeRangeButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  timeRangeButtonText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
});