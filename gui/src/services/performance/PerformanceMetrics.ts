/**
 * PerformanceMetrics - Real-time performance metrics collection
 * Monitors app performance and provides actionable insights
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

interface MetricEntry {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

interface AppPerformanceMetrics {
  // App Performance
  appStartTime: number;
  screenTransitionTimes: Record<string, number>;
  apiResponseTimes: Record<string, number[]>;
  renderTimes: Record<string, number[]>;
  
  // User Experience
  interactionLatencies: number[];
  frameDrops: number;
  jankyAnimations: number;
  slowOperations: number;
  
  // Resource Usage
  memoryUsage: number[];
  cpuUsage: number[];
  networkUsage: number;
  batteryImpact: number;
  
  // Error Metrics
  errorCount: number;
  crashCount: number;
  timeoutCount: number;
  retryCount: number;
}

interface PerformanceBenchmark {
  metric: string;
  target: number;
  current: number;
  status: 'excellent' | 'good' | 'needs_improvement' | 'poor';
  trend: 'improving' | 'stable' | 'degrading';
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'critical';
  metric: string;
  message: string;
  timestamp: number;
  threshold: number;
  currentValue: number;
}

export class PerformanceMetrics {
  private metrics: AppPerformanceMetrics;
  private metricHistory: MetricEntry[] = [];
  private benchmarks: PerformanceBenchmark[] = [];
  private alerts: PerformanceAlert[] = [];
  private isCollecting = false;
  private collectionInterval?: NodeJS.Timeout;
  private readonly STORAGE_KEY = 'performanceMetrics';
  private alertCallbacks: ((alert: PerformanceAlert) => void)[] = [];

  constructor() {
    this.metrics = this.getDefaultMetrics();
    this.initializeBenchmarks();
  }

  /**
   * Start performance metrics collection
   */
  async startCollection(): Promise<void> {
    if (this.isCollecting) return;

    this.isCollecting = true;
    await this.loadPersistedData();

    // Start periodic collection
    this.collectionInterval = setInterval(() => {
      this.collectSystemMetrics();
      this.evaluateBenchmarks();
      this.checkAlerts();
    }, 5000); // Every 5 seconds

    this.recordMetric('app_start_time', Date.now() - this.metrics.appStartTime);
    console.log('Performance metrics collection started');
  }

  /**
   * Stop performance metrics collection
   */
  async stopCollection(): Promise<void> {
    if (!this.isCollecting) return;

    this.isCollecting = false;

    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = undefined;
    }

    await this.persistData();
    console.log('Performance metrics collection stopped');
  }

  /**
   * Record a custom metric
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const entry: MetricEntry = {
      name,
      value,
      timestamp: Date.now(),
      tags,
    };

    this.metricHistory.push(entry);

    // Keep history limited
    if (this.metricHistory.length > 1000) {
      this.metricHistory.shift();
    }

    // Update relevant metric collections
    this.updateMetricCollections(name, value);
  }

  /**
   * Record screen transition time
   */
  recordScreenTransition(fromScreen: string, toScreen: string, duration: number): void {
    const transitionKey = `${fromScreen}_to_${toScreen}`;
    this.metrics.screenTransitionTimes[transitionKey] = duration;
    
    this.recordMetric('screen_transition', duration, {
      from: fromScreen,
      to: toScreen,
    });

    // Check for slow transitions
    if (duration > 500) { // 500ms threshold
      this.triggerAlert('warning', 'screen_transition', 
        `Slow screen transition: ${transitionKey} took ${duration}ms`);
    }
  }

  /**
   * Record API response time
   */
  recordApiResponse(endpoint: string, duration: number, success: boolean): void {
    if (!this.metrics.apiResponseTimes[endpoint]) {
      this.metrics.apiResponseTimes[endpoint] = [];
    }

    this.metrics.apiResponseTimes[endpoint].push(duration);

    // Keep only recent 50 entries per endpoint
    if (this.metrics.apiResponseTimes[endpoint].length > 50) {
      this.metrics.apiResponseTimes[endpoint].shift();
    }

    this.recordMetric('api_response_time', duration, {
      endpoint,
      status: success ? 'success' : 'error',
    });

    // Check for slow API responses
    if (duration > 3000) { // 3 second threshold
      this.triggerAlert('warning', 'api_response', 
        `Slow API response: ${endpoint} took ${duration}ms`);
    }
  }

  /**
   * Record render time for a component
   */
  recordRenderTime(component: string, duration: number): void {
    if (!this.metrics.renderTimes[component]) {
      this.metrics.renderTimes[component] = [];
    }

    this.metrics.renderTimes[component].push(duration);

    // Keep only recent 20 entries per component
    if (this.metrics.renderTimes[component].length > 20) {
      this.metrics.renderTimes[component].shift();
    }

    this.recordMetric('render_time', duration, { component });

    // Check for slow renders
    if (duration > 16) { // 16ms for 60fps
      this.metrics.jankyAnimations++;
      this.triggerAlert('warning', 'render_performance', 
        `Slow render: ${component} took ${duration}ms`);
    }
  }

  /**
   * Record user interaction latency
   */
  recordInteractionLatency(type: string, duration: number): void {
    this.metrics.interactionLatencies.push(duration);

    // Keep only recent 100 interactions
    if (this.metrics.interactionLatencies.length > 100) {
      this.metrics.interactionLatencies.shift();
    }

    this.recordMetric('interaction_latency', duration, { type });

    // Check for high latency
    if (duration > 100) { // 100ms threshold
      this.triggerAlert('warning', 'interaction_latency', 
        `High interaction latency: ${type} took ${duration}ms`);
    }
  }

  /**
   * Record frame drop
   */
  recordFrameDrop(): void {
    this.metrics.frameDrops++;
    this.recordMetric('frame_drop', 1);

    // Alert on excessive frame drops
    if (this.metrics.frameDrops % 10 === 0) {
      this.triggerAlert('warning', 'frame_drops', 
        `${this.metrics.frameDrops} frame drops detected`);
    }
  }

  /**
   * Record error occurrence
   */
  recordError(type: 'error' | 'crash' | 'timeout' | 'retry', details?: string): void {
    switch (type) {
      case 'error':
        this.metrics.errorCount++;
        break;
      case 'crash':
        this.metrics.crashCount++;
        break;
      case 'timeout':
        this.metrics.timeoutCount++;
        break;
      case 'retry':
        this.metrics.retryCount++;
        break;
    }

    this.recordMetric(`${type}_count`, 1, { details: details || 'unknown' });

    // Alert on crashes
    if (type === 'crash') {
      this.triggerAlert('critical', 'crash', 
        `Application crash detected: ${details || 'Unknown cause'}`);
    }
  }

  /**
   * Get current performance summary
   */
  getPerformanceSummary(): {
    overall: 'excellent' | 'good' | 'needs_improvement' | 'poor';
    scores: {
      responsiveness: number;
      stability: number;
      efficiency: number;
      userExperience: number;
    };
    benchmarks: PerformanceBenchmark[];
    recentAlerts: PerformanceAlert[];
  } {
    const scores = this.calculatePerformanceScores();
    const overall = this.calculateOverallPerformance(scores);

    return {
      overall,
      scores,
      benchmarks: this.benchmarks,
      recentAlerts: this.alerts.slice(-5), // Last 5 alerts
    };
  }

  /**
   * Get detailed metrics report
   */
  getDetailedReport(): {
    metrics: AppPerformanceMetrics;
    trends: {
      screenTransitions: { screen: string; avgTime: number }[];
      apiEndpoints: { endpoint: string; avgTime: number }[];
      slowComponents: { component: string; avgTime: number }[];
    };
    recommendations: string[];
  } {
    const trends = this.calculateTrends();
    const recommendations = this.generateRecommendations();

    return {
      metrics: { ...this.metrics },
      trends,
      recommendations,
    };
  }

  /**
   * Register alert callback
   */
  onAlert(callback: (alert: PerformanceAlert) => void): () => void {
    this.alertCallbacks.push(callback);
    
    return () => {
      const index = this.alertCallbacks.indexOf(callback);
      if (index > -1) {
        this.alertCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Clear all metrics and start fresh
   */
  resetMetrics(): void {
    this.metrics = this.getDefaultMetrics();
    this.metricHistory = [];
    this.alerts = [];
    this.benchmarks = [];
    this.initializeBenchmarks();
  }

  // Private helper methods

  private getDefaultMetrics(): AppPerformanceMetrics {
    return {
      appStartTime: Date.now(),
      screenTransitionTimes: {},
      apiResponseTimes: {},
      renderTimes: {},
      interactionLatencies: [],
      frameDrops: 0,
      jankyAnimations: 0,
      slowOperations: 0,
      memoryUsage: [],
      cpuUsage: [],
      networkUsage: 0,
      batteryImpact: 0,
      errorCount: 0,
      crashCount: 0,
      timeoutCount: 0,
      retryCount: 0,
    };
  }

  private initializeBenchmarks(): void {
    this.benchmarks = [
      {
        metric: 'app_start_time',
        target: 2000, // 2 seconds
        current: 0,
        status: 'good',
        trend: 'stable',
      },
      {
        metric: 'screen_transition',
        target: 300, // 300ms
        current: 0,
        status: 'good',
        trend: 'stable',
      },
      {
        metric: 'api_response_time',
        target: 1000, // 1 second
        current: 0,
        status: 'good',
        trend: 'stable',
      },
      {
        metric: 'render_time',
        target: 16, // 16ms for 60fps
        current: 0,
        status: 'good',
        trend: 'stable',
      },
      {
        metric: 'interaction_latency',
        target: 50, // 50ms
        current: 0,
        status: 'good',
        trend: 'stable',
      },
    ];
  }

  private updateMetricCollections(name: string, value: number): void {
    switch (name) {
      case 'memory_usage':
        this.metrics.memoryUsage.push(value);
        if (this.metrics.memoryUsage.length > 100) {
          this.metrics.memoryUsage.shift();
        }
        break;
      case 'cpu_usage':
        this.metrics.cpuUsage.push(value);
        if (this.metrics.cpuUsage.length > 100) {
          this.metrics.cpuUsage.shift();
        }
        break;
      case 'slow_operation':
        this.metrics.slowOperations++;
        break;
    }
  }

  private collectSystemMetrics(): void {
    // Simulate system metrics collection
    // In production, these would come from native modules
    
    // Memory usage (in MB)
    const memoryUsage = Math.random() * 100 + 20; // 20-120MB
    this.recordMetric('memory_usage', memoryUsage);

    // CPU usage (percentage)
    const cpuUsage = Math.random() * 50 + 10; // 10-60%
    this.recordMetric('cpu_usage', cpuUsage);

    // Network usage (bytes)
    const networkUsage = Math.random() * 1000; // 0-1000 bytes
    this.metrics.networkUsage += networkUsage;
    this.recordMetric('network_usage', networkUsage);
  }

  private evaluateBenchmarks(): void {
    this.benchmarks.forEach(benchmark => {
      const recentValues = this.getRecentValues(benchmark.metric, 10);
      
      if (recentValues.length > 0) {
        const current = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
        const previous = benchmark.current;
        
        benchmark.current = current;
        benchmark.status = this.getBenchmarkStatus(current, benchmark.target);
        benchmark.trend = this.getTrend(previous, current);
      }
    });
  }

  private getBenchmarkStatus(current: number, target: number): 'excellent' | 'good' | 'needs_improvement' | 'poor' {
    const ratio = current / target;
    
    if (ratio <= 0.5) return 'excellent';
    if (ratio <= 0.8) return 'good';
    if (ratio <= 1.2) return 'needs_improvement';
    return 'poor';
  }

  private getTrend(previous: number, current: number): 'improving' | 'stable' | 'degrading' {
    if (previous === 0) return 'stable';
    
    const change = (current - previous) / previous;
    
    if (change < -0.05) return 'improving';
    if (change > 0.05) return 'degrading';
    return 'stable';
  }

  private getRecentValues(metricName: string, count: number): number[] {
    return this.metricHistory
      .filter(entry => entry.name === metricName)
      .slice(-count)
      .map(entry => entry.value);
  }

  private checkAlerts(): void {
    // Check memory usage
    const recentMemory = this.getRecentValues('memory_usage', 5);
    if (recentMemory.length > 0) {
      const avgMemory = recentMemory.reduce((a, b) => a + b, 0) / recentMemory.length;
      if (avgMemory > 100) { // 100MB
        this.triggerAlert('critical', 'memory_usage', 
          `High memory usage: ${avgMemory.toFixed(2)}MB`);
      }
    }

    // Check CPU usage
    const recentCpu = this.getRecentValues('cpu_usage', 5);
    if (recentCpu.length > 0) {
      const avgCpu = recentCpu.reduce((a, b) => a + b, 0) / recentCpu.length;
      if (avgCpu > 80) { // 80%
        this.triggerAlert('warning', 'cpu_usage', 
          `High CPU usage: ${avgCpu.toFixed(2)}%`);
      }
    }
  }

  private triggerAlert(
    type: 'warning' | 'critical',
    metric: string,
    message: string
  ): void {
    const alert: PerformanceAlert = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      metric,
      message,
      timestamp: Date.now(),
      threshold: 0, // Would be set based on metric
      currentValue: 0, // Would be set based on current value
    };

    this.alerts.push(alert);

    // Keep alerts limited
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }

    // Notify callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    });

    console.warn(`Performance Alert [${type}]: ${message}`);
  }

  private calculatePerformanceScores(): {
    responsiveness: number;
    stability: number;
    efficiency: number;
    userExperience: number;
  } {
    // Calculate responsiveness score (0-100)
    const avgInteractionLatency = this.metrics.interactionLatencies.length > 0
      ? this.metrics.interactionLatencies.reduce((a, b) => a + b, 0) / this.metrics.interactionLatencies.length
      : 0;
    const responsiveness = Math.max(0, 100 - (avgInteractionLatency / 2)); // 0-100ms scale

    // Calculate stability score
    const totalErrors = this.metrics.errorCount + this.metrics.crashCount + this.metrics.timeoutCount;
    const stability = Math.max(0, 100 - (totalErrors * 5)); // Each error -5 points

    // Calculate efficiency score
    const avgMemory = this.metrics.memoryUsage.length > 0
      ? this.metrics.memoryUsage.reduce((a, b) => a + b, 0) / this.metrics.memoryUsage.length
      : 0;
    const efficiency = Math.max(0, 100 - (avgMemory / 2)); // 0-200MB scale

    // Calculate user experience score
    const frameDropRatio = this.metrics.frameDrops / Math.max(1, this.metricHistory.length);
    const userExperience = Math.max(0, 100 - (frameDropRatio * 100));

    return {
      responsiveness: Math.round(responsiveness),
      stability: Math.round(stability),
      efficiency: Math.round(efficiency),
      userExperience: Math.round(userExperience),
    };
  }

  private calculateOverallPerformance(scores: any): 'excellent' | 'good' | 'needs_improvement' | 'poor' {
    const overall = (scores.responsiveness + scores.stability + scores.efficiency + scores.userExperience) / 4;
    
    if (overall >= 90) return 'excellent';
    if (overall >= 75) return 'good';
    if (overall >= 60) return 'needs_improvement';
    return 'poor';
  }

  private calculateTrends(): {
    screenTransitions: { screen: string; avgTime: number }[];
    apiEndpoints: { endpoint: string; avgTime: number }[];
    slowComponents: { component: string; avgTime: number }[];
  } {
    // Calculate screen transition trends
    const screenTransitions = Object.entries(this.metrics.screenTransitionTimes)
      .map(([screen, time]) => ({ screen, avgTime: time }))
      .sort((a, b) => b.avgTime - a.avgTime);

    // Calculate API endpoint trends
    const apiEndpoints = Object.entries(this.metrics.apiResponseTimes)
      .map(([endpoint, times]) => ({
        endpoint,
        avgTime: times.reduce((a, b) => a + b, 0) / times.length,
      }))
      .sort((a, b) => b.avgTime - a.avgTime);

    // Calculate component render trends
    const slowComponents = Object.entries(this.metrics.renderTimes)
      .map(([component, times]) => ({
        component,
        avgTime: times.reduce((a, b) => a + b, 0) / times.length,
      }))
      .filter(item => item.avgTime > 16) // Only slow components
      .sort((a, b) => b.avgTime - a.avgTime);

    return {
      screenTransitions: screenTransitions.slice(0, 10),
      apiEndpoints: apiEndpoints.slice(0, 10),
      slowComponents: slowComponents.slice(0, 10),
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const scores = this.calculatePerformanceScores();

    if (scores.responsiveness < 80) {
      recommendations.push('Improve touch responsiveness by optimizing gesture handlers and reducing main thread work.');
    }

    if (scores.stability < 90) {
      recommendations.push('Address stability issues by implementing better error handling and crash reporting.');
    }

    if (scores.efficiency < 75) {
      recommendations.push('Optimize memory usage by implementing better caching strategies and cleanup routines.');
    }

    if (scores.userExperience < 85) {
      recommendations.push('Reduce frame drops by optimizing animations and using native driver where possible.');
    }

    if (this.metrics.jankyAnimations > 10) {
      recommendations.push('Optimize slow-rendering components to maintain 60fps performance.');
    }

    if (Object.keys(this.metrics.apiResponseTimes).some(endpoint => 
      this.metrics.apiResponseTimes[endpoint].some(time => time > 3000)
    )) {
      recommendations.push('Optimize API performance by implementing caching and request optimization.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance looks good! Continue monitoring for optimal user experience.');
    }

    return recommendations;
  }

  private async persistData(): Promise<void> {
    try {
      const data = {
        metrics: this.metrics,
        recentHistory: this.metricHistory.slice(-100), // Keep last 100 entries
        benchmarks: this.benchmarks,
        recentAlerts: this.alerts.slice(-20), // Keep last 20 alerts
      };

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to persist performance metrics:', error);
    }
  }

  private async loadPersistedData(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.metrics = { ...this.getDefaultMetrics(), ...data.metrics };
        this.metricHistory = data.recentHistory || [];
        this.benchmarks = data.benchmarks || this.benchmarks;
        this.alerts = data.recentAlerts || [];
      }
    } catch (error) {
      console.error('Failed to load persisted performance metrics:', error);
    }
  }
}

// Singleton instance
export const performanceMetrics = new PerformanceMetrics();