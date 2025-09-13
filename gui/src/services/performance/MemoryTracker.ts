/**
 * MemoryTracker - Memory usage tracking and leak detection
 * Monitors app memory usage and provides insights for optimization
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

interface MemorySnapshot {
  timestamp: number;
  totalHeapSize: number;
  usedHeapSize: number;
  heapSizeLimit: number;
  externalMemory: number;
  arrayBuffers: number;
  pressureLevel: 'low' | 'moderate' | 'high' | 'critical';
}

interface MemoryLeak {
  objectType: string;
  count: number;
  previousCount: number;
  growthRate: number;
  firstDetected: number;
  severity: 'low' | 'medium' | 'high';
}

interface MemoryMetrics {
  averageMemoryUsage: number;
  peakMemoryUsage: number;
  memoryGrowthRate: number;
  garbageCollectionFrequency: number;
  memoryLeaks: MemoryLeak[];
  pressureEvents: number;
  optimizationSuggestions: string[];
}

interface ObjectTracker {
  [key: string]: {
    count: number;
    instances: WeakSet<object>;
    history: number[];
  };
}

export class MemoryTracker {
  private snapshots: MemorySnapshot[] = [];
  private objectTracker: ObjectTracker = {};
  private isTracking = false;
  private trackingInterval?: NodeJS.Timeout;
  private leakDetectionInterval?: NodeJS.Timeout;
  private maxSnapshots = 100;
  private readonly STORAGE_KEY = 'memoryTrackerData';
  private memoryPressureCallbacks: ((level: string) => void)[] = [];

  /**
   * Start memory tracking
   */
  async startTracking(intervalMs: number = 5000): Promise<void> {
    if (this.isTracking) return;

    this.isTracking = true;
    await this.loadPersistedData();

    // Start periodic memory snapshots
    this.trackingInterval = setInterval(() => {
      this.takeMemorySnapshot();
    }, intervalMs);

    // Start leak detection
    this.leakDetectionInterval = setInterval(() => {
      this.detectMemoryLeaks();
    }, 30000); // Check every 30 seconds

    console.log('Memory tracking started');
  }

  /**
   * Stop memory tracking
   */
  async stopTracking(): Promise<void> {
    if (!this.isTracking) return;

    this.isTracking = false;

    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = undefined;
    }

    if (this.leakDetectionInterval) {
      clearInterval(this.leakDetectionInterval);
      this.leakDetectionInterval = undefined;
    }

    await this.persistData();
    console.log('Memory tracking stopped');
  }

  /**
   * Take a memory snapshot
   */
  takeMemorySnapshot(): MemorySnapshot {
    const memInfo = this.getMemoryInfo();
    const pressureLevel = this.calculatePressureLevel(memInfo);

    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      totalHeapSize: memInfo.totalHeapSize,
      usedHeapSize: memInfo.usedHeapSize,
      heapSizeLimit: memInfo.heapSizeLimit,
      externalMemory: memInfo.externalMemory,
      arrayBuffers: memInfo.arrayBuffers,
      pressureLevel,
    };

    this.addSnapshot(snapshot);

    // Trigger pressure callbacks if needed
    if (pressureLevel !== 'low') {
      this.triggerPressureCallbacks(pressureLevel);
    }

    return snapshot;
  }

  /**
   * Track object creation for leak detection
   */
  trackObject(obj: object, type: string): void {
    if (!this.objectTracker[type]) {
      this.objectTracker[type] = {
        count: 0,
        instances: new WeakSet(),
        history: [],
      };
    }

    const tracker = this.objectTracker[type];
    if (!tracker.instances.has(obj)) {
      tracker.instances.add(obj);
      tracker.count++;
    }
  }

  /**
   * Untrack object (when explicitly destroyed)
   */
  untrackObject(obj: object, type: string): void {
    const tracker = this.objectTracker[type];
    if (tracker && tracker.instances.has(obj)) {
      tracker.count = Math.max(0, tracker.count - 1);
    }
  }

  /**
   * Detect potential memory leaks
   */
  detectMemoryLeaks(): MemoryLeak[] {
    const leaks: MemoryLeak[] = [];

    for (const [type, tracker] of Object.entries(this.objectTracker)) {
      tracker.history.push(tracker.count);
      
      // Keep history limited
      if (tracker.history.length > 20) {
        tracker.history.shift();
      }

      // Analyze growth pattern
      if (tracker.history.length >= 5) {
        const recent = tracker.history.slice(-5);
        const older = tracker.history.slice(-10, -5);
        
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.length > 0 
          ? older.reduce((a, b) => a + b, 0) / older.length 
          : 0;

        const growthRate = olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;

        // Consider it a leak if consistent growth > 10%
        if (growthRate > 0.1 && recentAvg > 10) {
          const leak: MemoryLeak = {
            objectType: type,
            count: tracker.count,
            previousCount: Math.round(olderAvg),
            growthRate,
            firstDetected: Date.now(),
            severity: this.calculateLeakSeverity(growthRate, tracker.count),
          };

          leaks.push(leak);
          console.warn(`Potential memory leak detected: ${type}`, leak);
        }
      }
    }

    return leaks;
  }

  /**
   * Get current memory metrics
   */
  getMemoryMetrics(): MemoryMetrics {
    const snapshots = this.getRecentSnapshots(20);
    
    if (snapshots.length === 0) {
      return {
        averageMemoryUsage: 0,
        peakMemoryUsage: 0,
        memoryGrowthRate: 0,
        garbageCollectionFrequency: 0,
        memoryLeaks: [],
        pressureEvents: 0,
        optimizationSuggestions: [],
      };
    }

    const memoryUsages = snapshots.map(s => s.usedHeapSize);
    const averageMemoryUsage = memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length;
    const peakMemoryUsage = Math.max(...memoryUsages);
    
    // Calculate growth rate
    const firstUsage = memoryUsages[0];
    const lastUsage = memoryUsages[memoryUsages.length - 1];
    const memoryGrowthRate = firstUsage > 0 ? (lastUsage - firstUsage) / firstUsage : 0;

    // Count pressure events
    const pressureEvents = snapshots.filter(s => s.pressureLevel !== 'low').length;

    // Get current leaks
    const memoryLeaks = this.detectMemoryLeaks();

    // Generate optimization suggestions
    const optimizationSuggestions = this.generateOptimizationSuggestions(
      averageMemoryUsage,
      peakMemoryUsage,
      memoryGrowthRate,
      memoryLeaks
    );

    return {
      averageMemoryUsage,
      peakMemoryUsage,
      memoryGrowthRate,
      garbageCollectionFrequency: 0, // Would need native implementation
      memoryLeaks,
      pressureEvents,
      optimizationSuggestions,
    };
  }

  /**
   * Force garbage collection (if available)
   */
  forceGarbageCollection(): void {
    // Try to force garbage collection
    if (global.gc) {
      global.gc();
      console.log('Garbage collection triggered');
    } else {
      // Fallback: create memory pressure to encourage GC
      const temp = new Array(1000000).fill(0);
      temp.length = 0;
    }
  }

  /**
   * Get memory pressure level
   */
  getCurrentPressureLevel(): string {
    const latest = this.getLatestSnapshot();
    return latest ? latest.pressureLevel : 'low';
  }

  /**
   * Register callback for memory pressure events
   */
  onMemoryPressure(callback: (level: string) => void): () => void {
    this.memoryPressureCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.memoryPressureCallbacks.indexOf(callback);
      if (index > -1) {
        this.memoryPressureCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get memory usage report
   */
  getMemoryReport(): {
    summary: {
      currentUsage: number;
      averageUsage: number;
      peakUsage: number;
      pressureLevel: string;
    };
    trends: {
      usageOverTime: number[];
      pressureEvents: number;
      leakCount: number;
    };
    recommendations: string[];
  } {
    const metrics = this.getMemoryMetrics();
    const latest = this.getLatestSnapshot();
    const snapshots = this.getRecentSnapshots(10);

    return {
      summary: {
        currentUsage: latest?.usedHeapSize || 0,
        averageUsage: metrics.averageMemoryUsage,
        peakUsage: metrics.peakMemoryUsage,
        pressureLevel: latest?.pressureLevel || 'low',
      },
      trends: {
        usageOverTime: snapshots.map(s => s.usedHeapSize),
        pressureEvents: metrics.pressureEvents,
        leakCount: metrics.memoryLeaks.length,
      },
      recommendations: metrics.optimizationSuggestions,
    };
  }

  /**
   * Clear all tracking data
   */
  clearData(): void {
    this.snapshots = [];
    this.objectTracker = {};
  }

  // Private helper methods

  private getMemoryInfo(): any {
    // Simulate memory info (in production, would use native module)
    const mockMemInfo = {
      totalHeapSize: 100 * 1024 * 1024, // 100MB
      usedHeapSize: Math.random() * 50 * 1024 * 1024, // 0-50MB
      heapSizeLimit: 200 * 1024 * 1024, // 200MB
      externalMemory: Math.random() * 10 * 1024 * 1024, // 0-10MB
      arrayBuffers: Math.random() * 5 * 1024 * 1024, // 0-5MB
    };

    return mockMemInfo;
  }

  private calculatePressureLevel(memInfo: any): 'low' | 'moderate' | 'high' | 'critical' {
    const usageRatio = memInfo.usedHeapSize / memInfo.heapSizeLimit;

    if (usageRatio > 0.9) return 'critical';
    if (usageRatio > 0.7) return 'high';
    if (usageRatio > 0.5) return 'moderate';
    return 'low';
  }

  private calculateLeakSeverity(growthRate: number, count: number): 'low' | 'medium' | 'high' {
    if (growthRate > 0.5 || count > 1000) return 'high';
    if (growthRate > 0.2 || count > 100) return 'medium';
    return 'low';
  }

  private addSnapshot(snapshot: MemorySnapshot): void {
    this.snapshots.push(snapshot);

    // Keep snapshots limited
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
  }

  private getRecentSnapshots(count: number): MemorySnapshot[] {
    return this.snapshots.slice(-count);
  }

  private getLatestSnapshot(): MemorySnapshot | undefined {
    return this.snapshots[this.snapshots.length - 1];
  }

  private triggerPressureCallbacks(level: string): void {
    this.memoryPressureCallbacks.forEach(callback => {
      try {
        callback(level);
      } catch (error) {
        console.error('Error in memory pressure callback:', error);
      }
    });
  }

  private generateOptimizationSuggestions(
    avgUsage: number,
    peakUsage: number,
    growthRate: number,
    leaks: MemoryLeak[]
  ): string[] {
    const suggestions: string[] = [];

    if (peakUsage > 100 * 1024 * 1024) { // > 100MB
      suggestions.push('Peak memory usage is high. Consider implementing lazy loading and virtualization.');
    }

    if (growthRate > 0.1) {
      suggestions.push('Memory usage is growing over time. Check for potential memory leaks.');
    }

    if (leaks.length > 0) {
      suggestions.push(`${leaks.length} potential memory leaks detected. Review object lifecycle management.`);
    }

    if (avgUsage > 50 * 1024 * 1024) { // > 50MB
      suggestions.push('Average memory usage is high. Consider reducing cached data and optimizing data structures.');
    }

    if (suggestions.length === 0) {
      suggestions.push('Memory usage looks healthy. Continue monitoring for optimal performance.');
    }

    return suggestions;
  }

  private async persistData(): Promise<void> {
    try {
      const data = {
        snapshots: this.snapshots.slice(-50), // Keep last 50
        objectCounts: Object.entries(this.objectTracker).reduce((acc, [key, tracker]) => {
          acc[key] = { count: tracker.count, history: tracker.history };
          return acc;
        }, {} as any),
      };

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to persist memory tracking data:', error);
    }
  }

  private async loadPersistedData(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.snapshots = data.snapshots || [];
        
        // Restore object counts (instances will be rebuilt)
        if (data.objectCounts) {
          for (const [type, trackerData] of Object.entries(data.objectCounts as any)) {
            this.objectTracker[type] = {
              count: (trackerData as any).count,
              instances: new WeakSet(),
              history: (trackerData as any).history,
            };
          }
        }
      }
    } catch (error) {
      console.error('Failed to load persisted memory tracking data:', error);
    }
  }
}

// Singleton instance
export const memoryTracker = new MemoryTracker();

// Convenience function for object tracking
export const trackObject = (obj: object, type: string) => {
  memoryTracker.trackObject(obj, type);
};

export const untrackObject = (obj: object, type: string) => {
  memoryTracker.untrackObject(obj, type);
};