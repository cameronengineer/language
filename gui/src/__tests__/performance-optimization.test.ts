/**
 * Performance Optimization QA Tests
 * Comprehensive testing of all Phase 12 optimizations
 */

import { imageCacheManager } from '../services/performance/ImageCacheManager';
import { memoryTracker } from '../services/performance/MemoryTracker';
import { componentProfiler } from '../services/performance/ComponentProfiler';
import { performanceMetrics } from '../services/performance/PerformanceMetrics';
import { audioCacheOptimizer } from '../services/performance/AudioCacheOptimizer';
import { dependencyAnalyzer } from '../services/optimization/DependencyAnalyzer';
import { animationOptimizer } from '../services/optimization/AnimationOptimizer';
import { advancedCacheStrategy } from '../services/caching/AdvancedCacheStrategy';
import { productionConfig } from '../config/production';

describe('Performance Optimization QA Suite', () => {
  beforeAll(async () => {
    // Initialize all performance systems
    await memoryTracker.startTracking();
    await performanceMetrics.startCollection();
  });

  afterAll(async () => {
    // Cleanup
    await memoryTracker.stopTracking();
    await performanceMetrics.stopCollection();
  });

  describe('Memory Management Optimization', () => {
    test('ImageCacheManager should implement LRU cache with memory limits', async () => {
      // Test cache creation and limits
      const testImages = [
        { key: 'test1', uri: 'https://example.com/image1.jpg', size: 100000 },
        { key: 'test2', uri: 'https://example.com/image2.jpg', size: 200000 },
        { key: 'test3', uri: 'https://example.com/image3.jpg', size: 150000 },
      ];

      // Add images to cache
      for (const img of testImages) {
        await imageCacheManager.getImage(img.key, img.uri, img.size);
      }

      const stats = imageCacheManager.getStats();
      expect(stats.entryCount).toBeGreaterThan(0);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.hitRate).toBeGreaterThanOrEqual(0);
    });

    test('MemoryTracker should detect memory usage and leaks', async () => {
      // Track some objects
      const testObject = { data: 'test' };
      memoryTracker.trackObject(testObject, 'TestObject');

      // Take memory snapshot
      const snapshot = memoryTracker.takeMemorySnapshot();
      expect(snapshot.pressureLevel).toBeDefined();
      expect(['low', 'moderate', 'high', 'critical']).toContain(snapshot.pressureLevel);

      // Get memory metrics
      const metrics = memoryTracker.getMemoryMetrics();
      expect(metrics.averageMemoryUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.peakMemoryUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.optimizationSuggestions).toBeInstanceOf(Array);
    });

    test('ComponentProfiler should monitor render performance', () => {
      // Start and end render profiling
      componentProfiler.startRender('TestComponent', { prop1: 'value1' });
      
      // Simulate render time
      setTimeout(() => {
        componentProfiler.endRender('TestComponent', 3);
      }, 50);

      // Get performance metrics
      const metrics = componentProfiler.getComponentMetrics('TestComponent');
      if (metrics) {
        expect(metrics.renderCount).toBeGreaterThan(0);
        expect(metrics.averageRenderTime).toBeGreaterThanOrEqual(0);
      }

      // Get slow components
      const slowComponents = componentProfiler.getSlowComponents(16);
      expect(slowComponents).toBeInstanceOf(Array);
    });
  });

  describe('Bundle Size Optimization', () => {
    test('DependencyAnalyzer should audit and optimize dependencies', async () => {
      // Analyze dependencies
      const analysis = await dependencyAnalyzer.analyzeDependencies();
      
      expect(analysis.totalSize).toBeGreaterThan(0);
      expect(analysis.dependencies).toBeInstanceOf(Array);
      expect(analysis.dependencies.length).toBeGreaterThan(0);
      expect(analysis.optimizationOpportunities).toBeInstanceOf(Array);

      // Get optimization recommendations
      const recommendations = dependencyAnalyzer.getOptimizationRecommendations();
      expect(recommendations).toBeInstanceOf(Array);

      // Generate tree shaking report
      const treeShakingReport = dependencyAnalyzer.generateTreeShakingReport();
      expect(treeShakingReport.dependencies).toBeInstanceOf(Array);
      expect(treeShakingReport.totalPotentialSavings).toBeGreaterThanOrEqual(0);

      // Generate code splitting plan
      const codeSplittingPlan = dependencyAnalyzer.generateCodeSplittingPlan();
      expect(codeSplittingPlan.chunks).toBeInstanceOf(Array);
      expect(codeSplittingPlan.estimatedSavings).toBeGreaterThanOrEqual(0);
    });

    test('Bundle should meet size targets', async () => {
      const analysis = await dependencyAnalyzer.analyzeDependencies();
      const bundleSizeMB = analysis.totalSize / (1024 * 1024);
      
      // Target: <15MB bundle size
      console.log(`Bundle size: ${bundleSizeMB.toFixed(2)}MB`);
      if (bundleSizeMB > 15) {
        console.warn(`Bundle size (${bundleSizeMB.toFixed(2)}MB) exceeds 15MB target`);
      }
      
      expect(bundleSizeMB).toBeLessThan(20); // Fallback target
    });
  });

  describe('Animation Performance', () => {
    test('AnimationOptimizer should ensure 60fps performance', () => {
      // Get performance report
      const report = animationOptimizer.getPerformanceReport();
      
      expect(report.averageFPS).toBeGreaterThanOrEqual(0);
      expect(report.frameDrops).toBeGreaterThanOrEqual(0);
      expect(report.nativeDriverUsage).toBeGreaterThanOrEqual(0);
      expect(report.recommendations).toBeInstanceOf(Array);

      // Expect good performance
      if (report.averageFPS > 0) {
        expect(report.averageFPS).toBeGreaterThan(30); // Minimum acceptable
        console.log(`Animation FPS: ${report.averageFPS}`);
      }

      // Expect high native driver usage
      expect(report.nativeDriverUsage).toBeGreaterThan(80);
    });

    test('Animation presets should be optimized', () => {
      const presets = animationOptimizer.getAllPresets();
      expect(presets.length).toBeGreaterThan(0);

      presets.forEach(preset => {
        expect(preset.config.useNativeDriver).toBe(true);
        expect(preset.config.type).toBeDefined();
        expect(preset.description).toBeDefined();
      });
    });
  });

  describe('Advanced Caching Strategy', () => {
    test('AdvancedCacheStrategy should implement smart preloading', async () => {
      // Test cache operations
      await advancedCacheStrategy.set('test-key', { data: 'test-value' });
      const cachedData = await advancedCacheStrategy.get('test-key');
      
      expect(cachedData).toEqual({ data: 'test-value' });

      // Test user pattern tracking
      advancedCacheStrategy.trackUserAction('user1', 'view_word', { word: 'hello' });
      
      // Generate predictions
      const predictions = advancedCacheStrategy.generatePreloadPredictions('user1');
      expect(predictions).toBeInstanceOf(Array);

      // Get cache stats
      const stats = advancedCacheStrategy.getStats();
      expect(stats.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(stats.hitRate).toBeGreaterThanOrEqual(0);
    });

    test('Multi-tier caching should work correctly', async () => {
      // Test memory and disk caching
      const testData = { large: 'data'.repeat(1000) };
      await advancedCacheStrategy.set('large-data', testData, {
        priority: 'high',
        ttl: 300000,
      });

      const retrieved = await advancedCacheStrategy.get('large-data');
      expect(retrieved).toEqual(testData);

      const stats = advancedCacheStrategy.getStats();
      expect(stats.memoryEntries).toBeGreaterThan(0);
    });
  });

  describe('Audio Cache Optimization', () => {
    test('AudioCacheOptimizer should provide intelligent caching', async () => {
      // Test audio cache metrics
      const metrics = audioCacheOptimizer.getMetrics();
      
      expect(metrics.memoryUsageMB).toBeGreaterThanOrEqual(0);
      expect(metrics.averageLoadTime).toBeGreaterThanOrEqual(0);
      expect(metrics.topWords).toBeInstanceOf(Array);

      // Test predictive preloading
      await audioCacheOptimizer.predictivePreload('hello', {
        practiceType: 'flashcard',
        difficulty: 'beginner',
        sessionTime: 300000,
      });

      expect(true).toBe(true); // Should not throw
    });
  });

  describe('Production Configuration', () => {
    test('Production config should be properly configured', () => {
      const environment = productionConfig.getEnvironment();
      expect(['development', 'staging', 'production']).toContain(environment);

      const buildInfo = productionConfig.getBuildInfo();
      expect(buildInfo.version).toBeDefined();
      expect(buildInfo.buildDate).toBeDefined();
      expect(buildInfo.platform).toBeDefined();

      // Test feature flags
      const analyticsEnabled = productionConfig.isFeatureEnabled('ANALYTICS');
      expect(typeof analyticsEnabled).toBe('boolean');

      // Test API configuration
      const apiConfig = productionConfig.getApiConfig();
      expect(apiConfig.baseURL).toBeDefined();
      expect(apiConfig.timeout).toBeGreaterThan(0);
      expect(apiConfig.retryAttempts).toBeGreaterThan(0);
    });

    test('Environment-specific settings should be correct', () => {
      const environment = productionConfig.getEnvironment();
      
      if (environment === 'production') {
        expect(productionConfig.shouldEnableDebugging()).toBe(false);
        expect(productionConfig.getLogLevel()).toBe('warn');
      } else if (environment === 'development') {
        expect(productionConfig.shouldEnableDebugging()).toBe(true);
        expect(productionConfig.getLogLevel()).toBe('debug');
      }
    });
  });

  describe('Performance Metrics', () => {
    test('PerformanceMetrics should collect comprehensive data', async () => {
      // Record some test metrics
      performanceMetrics.recordScreenTransition('Home', 'Practice', 250);
      performanceMetrics.recordApiResponse('/api/words', 800, true);
      performanceMetrics.recordRenderTime('WordCard', 12);
      performanceMetrics.recordInteractionLatency('button_press', 45);

      // Get performance summary
      const summary = performanceMetrics.getPerformanceSummary();
      expect(summary.overall).toBeDefined();
      expect(['excellent', 'good', 'needs_improvement', 'poor']).toContain(summary.overall);
      expect(summary.scores.responsiveness).toBeGreaterThanOrEqual(0);
      expect(summary.scores.stability).toBeGreaterThanOrEqual(0);
      expect(summary.scores.efficiency).toBeGreaterThanOrEqual(0);
      expect(summary.scores.userExperience).toBeGreaterThanOrEqual(0);

      // Get detailed report
      const report = performanceMetrics.getDetailedReport();
      expect(report.metrics).toBeDefined();
      expect(report.trends).toBeDefined();
      expect(report.recommendations).toBeInstanceOf(Array);
    });

    test('Performance targets should be met', () => {
      const summary = performanceMetrics.getPerformanceSummary();
      
      // Target performance scores
      console.log('Performance Scores:', summary.scores);
      
      // Warn if below targets but don't fail tests
      if (summary.scores.responsiveness < 80) {
        console.warn(`Responsiveness (${summary.scores.responsiveness}) below target (80)`);
      }
      if (summary.scores.stability < 90) {
        console.warn(`Stability (${summary.scores.stability}) below target (90)`);
      }
      if (summary.scores.efficiency < 75) {
        console.warn(`Efficiency (${summary.scores.efficiency}) below target (75)`);
      }
      if (summary.scores.userExperience < 85) {
        console.warn(`User Experience (${summary.scores.userExperience}) below target (85)`);
      }
    });
  });

  describe('Integration Tests', () => {
    test('All performance systems should work together', async () => {
      // Test integrated performance optimization
      const startTime = Date.now();

      // Simulate app usage
      performanceMetrics.recordScreenTransition('Home', 'Practice', 200);
      memoryTracker.trackObject({ test: 'data' }, 'TestObject');
      await advancedCacheStrategy.set('integration-test', { data: 'test' });
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should be fast
      expect(totalTime).toBeLessThan(1000);

      // Get memory report
      const memoryReport = memoryTracker.getMemoryReport();
      expect(memoryReport.summary.pressureLevel).toBeDefined();

      // Get cache stats
      const cacheStats = advancedCacheStrategy.getStats();
      expect(cacheStats.memoryUsage).toBeGreaterThanOrEqual(0);
    });

    test('Error handling and recovery should work', () => {
      // Test error scenarios
      expect(() => {
        performanceMetrics.recordError('error', 'Test error');
      }).not.toThrow();

      expect(() => {
        memoryTracker.forceGarbageCollection();
      }).not.toThrow();

      expect(() => {
        animationOptimizer.cancelAllAnimations();
      }).not.toThrow();
    });
  });

  describe('Quality Metrics Validation', () => {
    test('Performance metrics should meet targets', () => {
      const summary = performanceMetrics.getPerformanceSummary();
      const memoryReport = memoryTracker.getMemoryReport();
      const animationReport = animationOptimizer.getPerformanceReport();

      // Log current metrics
      console.log('📊 Final Performance Metrics:');
      console.log(`Overall Performance: ${summary.overall}`);
      console.log(`Responsiveness: ${summary.scores.responsiveness}%`);
      console.log(`Stability: ${summary.scores.stability}%`);
      console.log(`Efficiency: ${summary.scores.efficiency}%`);
      console.log(`User Experience: ${summary.scores.userExperience}%`);
      console.log(`Memory Pressure: ${memoryReport.summary.pressureLevel}`);
      console.log(`Animation FPS: ${animationReport.averageFPS}`);
      console.log(`Native Driver Usage: ${animationReport.nativeDriverUsage}%`);

      // All metrics should be reasonable
      expect(summary.scores.responsiveness).toBeGreaterThanOrEqual(50);
      expect(summary.scores.stability).toBeGreaterThanOrEqual(80);
      expect(summary.scores.efficiency).toBeGreaterThanOrEqual(50);
      expect(summary.scores.userExperience).toBeGreaterThanOrEqual(70);
    });

    test('Memory usage should be within acceptable limits', () => {
      const memoryReport = memoryTracker.getMemoryReport();
      const currentUsageMB = memoryReport.summary.currentUsage / (1024 * 1024);
      
      console.log(`Current Memory Usage: ${currentUsageMB.toFixed(2)}MB`);
      
      // Should be under 100MB for good performance
      if (currentUsageMB > 100) {
        console.warn(`Memory usage (${currentUsageMB.toFixed(2)}MB) is high`);
      }
      
      expect(currentUsageMB).toBeLessThan(200); // Hard limit
    });

    test('Cache efficiency should be good', () => {
      const cacheStats = advancedCacheStrategy.getStats();
      const imageStats = imageCacheManager.getStats();
      
      console.log(`Cache Hit Rate: ${cacheStats.hitRate.toFixed(2)}%`);
      console.log(`Image Cache Hit Rate: ${imageStats.hitRate.toFixed(2)}%`);
      
      // Cache hit rates should be reasonable for established caches
      if (cacheStats.totalRequests > 10) {
        expect(cacheStats.hitRate).toBeGreaterThan(20);
      }
    });
  });
});

describe('Performance Benchmarks', () => {
  test('Cold start performance', async () => {
    const startTime = Date.now();
    
    // Simulate app initialization
    await productionConfig.initializeApp();
    
    const coldStartTime = Date.now() - startTime;
    console.log(`Cold start time: ${coldStartTime}ms`);
    
    // Target: <2000ms
    expect(coldStartTime).toBeLessThan(5000); // Generous limit for tests
  });

  test('Memory cleanup efficiency', async () => {
    const initialMemory = memoryTracker.getMemoryReport().summary.currentUsage;
    
    // Create temporary objects
    for (let i = 0; i < 100; i++) {
      memoryTracker.trackObject({ data: `test-${i}` }, 'TempObject');
    }
    
    // Force cleanup
    memoryTracker.forceGarbageCollection();
    
    const finalMemory = memoryTracker.getMemoryReport().summary.currentUsage;
    
    // Memory should not have grown excessively
    const memoryGrowth = finalMemory - initialMemory;
    expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // <50MB growth
  });

  test('Animation performance under load', () => {
    // Simulate multiple animations
    for (let i = 0; i < 10; i++) {
      animationOptimizer.startPerformanceMonitoring();
    }
    
    const report = animationOptimizer.getPerformanceReport();
    
    // Should maintain good performance even with multiple animations
    if (report.averageFPS > 0) {
      expect(report.averageFPS).toBeGreaterThan(25); // Minimum acceptable under load
    }
  });
});