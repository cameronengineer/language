/**
 * Performance Optimization Suite - Main export file
 * Comprehensive performance monitoring and optimization tools
 */

// Memory Management
export { imageCacheManager, ImageCacheManager } from './ImageCacheManager';
export { memoryTracker, trackObject, untrackObject } from './MemoryTracker';

// Performance Monitoring
export { componentProfiler, useComponentProfiling, withProfiling } from './ComponentProfiler';
export { performanceMetrics } from './PerformanceMetrics';

// Audio Optimization
export { audioCacheOptimizer } from './AudioCacheOptimizer';

// Bundle Optimization
export { dependencyAnalyzer } from '../optimization/DependencyAnalyzer';

// Animation Optimization
export { animationOptimizer, useOptimizedTiming, useOptimizedSpring } from '../optimization/AnimationOptimizer';

// Production Configuration
export { productionConfig, config, isProduction, isDevelopment, environment } from '../../config/production';

/**
 * Initialize all performance optimization systems
 */
export const initializePerformanceOptimizations = async () => {
  console.log('🚀 Initializing performance optimizations...');

  try {
    // Start memory tracking
    await memoryTracker.startTracking();
    console.log('✅ Memory tracking started');

    // Start performance metrics collection
    await performanceMetrics.startCollection();
    console.log('✅ Performance metrics collection started');

    // Start animation monitoring
    const stopAnimationMonitoring = animationOptimizer.startPerformanceMonitoring();
    console.log('✅ Animation performance monitoring started');

    // Initialize production config
    await productionConfig.initializeApp();
    console.log('✅ Production configuration initialized');

    console.log('🎯 All performance optimizations initialized successfully');

    return {
      stopMemoryTracking: () => memoryTracker.stopTracking(),
      stopPerformanceMetrics: () => performanceMetrics.stopCollection(),
      stopAnimationMonitoring,
    };

  } catch (error) {
    console.error('❌ Failed to initialize performance optimizations:', error);
    throw error;
  }
};

/**
 * Get comprehensive performance report
 */
export const getPerformanceReport = async () => {
  console.log('📊 Generating comprehensive performance report...');

  const [
    memoryReport,
    metricsReport,
    animationReport,
    dependencyReport,
  ] = await Promise.all([
    memoryTracker.getMemoryReport(),
    performanceMetrics.getPerformanceSummary(),
    animationOptimizer.getPerformanceReport(),
    dependencyAnalyzer.getDependencyReport(),
  ]);

  return {
    memory: memoryReport,
    metrics: metricsReport,
    animations: animationReport,
    dependencies: dependencyReport,
    generatedAt: new Date().toISOString(),
    environment: environment,
  };
};

/**
 * Performance optimization recommendations
 */
export const getOptimizationRecommendations = () => {
  const recommendations: string[] = [];

  // Memory recommendations
  const memoryReport = memoryTracker.getMemoryReport();
  if (memoryReport.summary.currentUsage > 100 * 1024 * 1024) { // 100MB
    recommendations.push('High memory usage detected. Consider implementing more aggressive cache cleanup.');
  }

  // Animation recommendations
  const animationReport = animationOptimizer.getPerformanceReport();
  if (animationReport.averageFPS < 55) {
    recommendations.push('Frame rate is below 55fps. Optimize animations and reduce complexity.');
  }

  // Bundle size recommendations
  const dependencyReport = dependencyAnalyzer.getDependencyReport();
  if (dependencyReport.summary.totalSize > 20 * 1024 * 1024) { // 20MB
    recommendations.push('Bundle size is large. Implement code splitting and tree shaking.');
  }

  return recommendations;
};

/**
 * Emergency performance cleanup
 */
export const emergencyPerformanceCleanup = async () => {
  console.log('🆘 Performing emergency performance cleanup...');

  try {
    // Clear image cache
    await imageCacheManager.clearCache();
    
    // Force garbage collection
    memoryTracker.forceGarbageCollection();
    
    // Cancel all animations
    animationOptimizer.cancelAllAnimations();
    
    console.log('✅ Emergency cleanup completed');
  } catch (error) {
    console.error('❌ Emergency cleanup failed:', error);
  }
};

/**
 * Performance health check
 */
export const performanceHealthCheck = () => {
  const memoryMetrics = memoryTracker.getMetrics();
  const animationReport = animationOptimizer.getPerformanceReport();
  
  const health = {
    memory: memoryMetrics.averageMemoryUsage < 100 * 1024 * 1024 ? 'good' : 'warning',
    animations: animationReport.averageFPS > 55 ? 'good' : 'warning',
    overall: 'good',
  };

  if (health.memory === 'warning' || health.animations === 'warning') {
    health.overall = 'warning';
  }

  return health;
};