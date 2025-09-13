/**
 * AdvancedCacheStrategy - Smart preloading and multi-tier caching
 * Implements intelligent caching with predictive preloading
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { imageCacheManager } from '../performance/ImageCacheManager';
import { audioCacheOptimizer } from '../performance/AudioCacheOptimizer';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  size: number;
}

interface CacheConfig {
  maxMemorySize: number; // in bytes
  maxDiskSize: number; // in bytes
  defaultTTL: number; // in milliseconds
  compressionEnabled: boolean;
  persistToDisk: boolean;
  enablePredictivePreloading: boolean;
}

interface CacheStats {
  memoryUsage: number;
  diskUsage: number;
  hitRate: number;
  totalRequests: number;
  cacheHits: number;
  evictions: number;
  preloadSuccessRate: number;
}

interface PreloadPrediction {
  key: string;
  confidence: number;
  urgency: 'immediate' | 'soon' | 'eventual';
  estimatedSize: number;
}

interface UserPattern {
  userActions: string[];
  timestamps: number[];
  sessionDuration: number;
  commonSequences: string[][];
  preferences: Record<string, any>;
}

export class AdvancedCacheStrategy {
  private memoryCache = new Map<string, CacheEntry>();
  private diskCacheKeys = new Set<string>();
  private userPatterns = new Map<string, UserPattern>();
  private preloadQueue: PreloadPrediction[] = [];
  private config: CacheConfig;
  private stats: CacheStats;
  private readonly STORAGE_PREFIX = 'advancedCache_';

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      maxMemorySize: 50 * 1024 * 1024, // 50MB
      maxDiskSize: 200 * 1024 * 1024, // 200MB
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      compressionEnabled: true,
      persistToDisk: true,
      enablePredictivePreloading: true,
      ...config,
    };

    this.stats = {
      memoryUsage: 0,
      diskUsage: 0,
      hitRate: 0,
      totalRequests: 0,
      cacheHits: 0,
      evictions: 0,
      preloadSuccessRate: 0,
    };

    this.initializeCache();
  }

  /**
   * Initialize cache system
   */
  private async initializeCache(): Promise<void> {
    await this.loadPersistedStats();
    await this.loadDiskCacheIndex();
    
    if (this.config.enablePredictivePreloading) {
      this.startPredictivePreloading();
    }

    // Setup cache cleanup interval
    setInterval(() => {
      this.performCacheCleanup();
    }, 60000); // Every minute
  }

  /**
   * Get data from cache with multi-tier strategy
   */
  async get<T>(key: string, fetchFunction?: () => Promise<T>, options?: {
    ttl?: number;
    priority?: 'high' | 'medium' | 'low';
    tags?: string[];
  }): Promise<T | null> {
    this.stats.totalRequests++;

    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && this.isValidEntry(memoryEntry)) {
      memoryEntry.accessCount++;
      memoryEntry.lastAccessed = Date.now();
      this.stats.cacheHits++;
      this.updateHitRate();
      return memoryEntry.data;
    }

    // Check disk cache
    if (this.diskCacheKeys.has(key)) {
      try {
        const diskData = await this.getFromDisk<T>(key);
        if (diskData) {
          // Promote to memory cache
          await this.set(key, diskData, options);
          this.stats.cacheHits++;
          this.updateHitRate();
          return diskData;
        }
      } catch (error) {
        console.warn('Failed to read from disk cache:', error);
      }
    }

    // Cache miss - fetch data if function provided
    if (fetchFunction) {
      try {
        const data = await fetchFunction();
        await this.set(key, data, options);
        return data;
      } catch (error) {
        console.error('Failed to fetch data:', error);
        return null;
      }
    }

    this.updateHitRate();
    return null;
  }

  /**
   * Set data in cache with intelligent placement
   */
  async set<T>(key: string, data: T, options?: {
    ttl?: number;
    priority?: 'high' | 'medium' | 'low';
    tags?: string[];
  }): Promise<void> {
    const ttl = options?.ttl || this.config.defaultTTL;
    const priority = options?.priority || 'medium';
    const tags = options?.tags || [];
    const size = this.estimateSize(data);

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
      accessCount: 1,
      lastAccessed: Date.now(),
      priority,
      tags,
      size,
    };

    // Always store in memory cache
    await this.setInMemory(key, entry);

    // Store in disk cache if configured and data is large enough
    if (this.config.persistToDisk && (size > 10000 || priority === 'high')) {
      await this.setOnDisk(key, data);
    }
  }

  /**
   * Intelligent preloading based on user patterns
   */
  async preloadData(predictions: PreloadPrediction[]): Promise<void> {
    if (!this.config.enablePredictivePreloading) return;

    // Sort by confidence and urgency
    const sortedPredictions = predictions.sort((a, b) => {
      const urgencyScore = { immediate: 3, soon: 2, eventual: 1 };
      return (b.confidence * urgencyScore[b.urgency]) - (a.confidence * urgencyScore[a.urgency]);
    });

    // Preload top predictions
    for (const prediction of sortedPredictions.slice(0, 5)) {
      if (prediction.urgency === 'immediate' && prediction.confidence > 0.8) {
        await this.preloadItem(prediction);
      }
    }
  }

  /**
   * Track user behavior for predictive caching
   */
  trackUserAction(userId: string, action: string, context?: any): void {
    if (!this.userPatterns.has(userId)) {
      this.userPatterns.set(userId, {
        userActions: [],
        timestamps: [],
        sessionDuration: 0,
        commonSequences: [],
        preferences: {},
      });
    }

    const pattern = this.userPatterns.get(userId)!;
    pattern.userActions.push(action);
    pattern.timestamps.push(Date.now());
    
    if (context) {
      Object.assign(pattern.preferences, context);
    }

    // Keep only recent actions (last 100)
    if (pattern.userActions.length > 100) {
      pattern.userActions.shift();
      pattern.timestamps.shift();
    }

    // Update common sequences
    this.updateCommonSequences(pattern);
  }

  /**
   * Generate predictive preloading suggestions
   */
  generatePreloadPredictions(userId: string, currentContext?: any): PreloadPrediction[] {
    const pattern = this.userPatterns.get(userId);
    if (!pattern) return [];

    const predictions: PreloadPrediction[] = [];
    const recentActions = pattern.userActions.slice(-10);

    // Analyze common sequences
    for (const sequence of pattern.commonSequences) {
      const sequenceMatch = this.findSequenceMatch(recentActions, sequence);
      if (sequenceMatch.confidence > 0.6) {
        const nextAction = sequence[sequenceMatch.matchIndex + 1];
        if (nextAction) {
          predictions.push({
            key: this.actionToKey(nextAction),
            confidence: sequenceMatch.confidence,
            urgency: sequenceMatch.confidence > 0.8 ? 'immediate' : 'soon',
            estimatedSize: 50000, // Estimate based on action type
          });
        }
      }
    }

    // Time-based predictions
    const timeBasedPredictions = this.generateTimeBasedPredictions(pattern);
    predictions.push(...timeBasedPredictions);

    return predictions;
  }

  /**
   * Cache invalidation by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    const keysToInvalidate: string[] = [];

    // Find keys with matching tags
    for (const [key, entry] of this.memoryCache) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        keysToInvalidate.push(key);
      }
    }

    // Remove from caches
    for (const key of keysToInvalidate) {
      await this.delete(key);
    }
  }

  /**
   * Delete item from all cache tiers
   */
  async delete(key: string): Promise<void> {
    // Remove from memory
    const entry = this.memoryCache.get(key);
    if (entry) {
      this.stats.memoryUsage -= entry.size;
      this.memoryCache.delete(key);
    }

    // Remove from disk
    if (this.diskCacheKeys.has(key)) {
      try {
        await AsyncStorage.removeItem(this.STORAGE_PREFIX + key);
        this.diskCacheKeys.delete(key);
      } catch (error) {
        console.warn('Failed to remove from disk cache:', error);
      }
    }
  }

  /**
   * Clear all caches
   */
  async clearAll(): Promise<void> {
    // Clear memory
    this.memoryCache.clear();
    this.stats.memoryUsage = 0;

    // Clear disk
    const diskKeys = Array.from(this.diskCacheKeys);
    for (const key of diskKeys) {
      try {
        await AsyncStorage.removeItem(this.STORAGE_PREFIX + key);
      } catch (error) {
        console.warn('Failed to clear disk cache item:', error);
      }
    }
    this.diskCacheKeys.clear();
    this.stats.diskUsage = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & {
    memoryEntries: number;
    diskEntries: number;
    averageAccessCount: number;
    topKeys: string[];
  } {
    const memoryEntries = Array.from(this.memoryCache.values());
    const averageAccessCount = memoryEntries.length > 0
      ? memoryEntries.reduce((sum, entry) => sum + entry.accessCount, 0) / memoryEntries.length
      : 0;

    const topKeys = memoryEntries
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10)
      .map((entry, index) => Array.from(this.memoryCache.keys())[index]);

    return {
      ...this.stats,
      memoryEntries: this.memoryCache.size,
      diskEntries: this.diskCacheKeys.size,
      averageAccessCount,
      topKeys,
    };
  }

  // Private helper methods

  private isValidEntry(entry: CacheEntry): boolean {
    return entry.expiresAt > Date.now();
  }

  private estimateSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate
    } catch {
      return 1000; // Default estimate
    }
  }

  private async setInMemory<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    // Check if we need to evict items
    while (this.stats.memoryUsage + entry.size > this.config.maxMemorySize) {
      this.evictLRU();
    }

    this.memoryCache.set(key, entry);
    this.stats.memoryUsage += entry.size;
  }

  private async setOnDisk<T>(key: string, data: T): Promise<void> {
    try {
      const serialized = JSON.stringify({
        data,
        timestamp: Date.now(),
      });

      await AsyncStorage.setItem(this.STORAGE_PREFIX + key, serialized);
      this.diskCacheKeys.add(key);
      this.stats.diskUsage += serialized.length;
    } catch (error) {
      console.warn('Failed to store in disk cache:', error);
    }
  }

  private async getFromDisk<T>(key: string): Promise<T | null> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_PREFIX + key);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.data;
      }
    } catch (error) {
      console.warn('Failed to read from disk cache:', error);
    }
    return null;
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.memoryCache) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.memoryCache.get(oldestKey)!;
      this.memoryCache.delete(oldestKey);
      this.stats.memoryUsage -= entry.size;
      this.stats.evictions++;
    }
  }

  private updateHitRate(): void {
    this.stats.hitRate = this.stats.totalRequests > 0
      ? (this.stats.cacheHits / this.stats.totalRequests) * 100
      : 0;
  }

  private performCacheCleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    // Find expired entries
    for (const [key, entry] of this.memoryCache) {
      if (entry.expiresAt <= now) {
        expiredKeys.push(key);
      }
    }

    // Remove expired entries
    for (const key of expiredKeys) {
      this.delete(key);
    }
  }

  private async preloadItem(prediction: PreloadPrediction): Promise<void> {
    try {
      // Simulate preloading logic
      // In real implementation, would trigger actual data fetching
      console.log(`Preloading ${prediction.key} with confidence ${prediction.confidence}`);
    } catch (error) {
      console.warn('Preloading failed:', error);
    }
  }

  private updateCommonSequences(pattern: UserPattern): void {
    // Simplified sequence detection
    const actions = pattern.userActions;
    if (actions.length < 3) return;

    const sequence = actions.slice(-3);
    const existingSequence = pattern.commonSequences.find(seq => 
      seq.length === sequence.length && 
      seq.every((action, index) => action === sequence[index])
    );

    if (!existingSequence) {
      pattern.commonSequences.push(sequence);
    }
  }

  private findSequenceMatch(recentActions: string[], sequence: string[]): {
    confidence: number;
    matchIndex: number;
  } {
    // Simplified sequence matching
    for (let i = 0; i <= recentActions.length - sequence.length; i++) {
      const matches = sequence.every((action, index) => 
        recentActions[i + index] === action
      );
      
      if (matches) {
        return { confidence: 0.8, matchIndex: i + sequence.length - 1 };
      }
    }

    return { confidence: 0, matchIndex: -1 };
  }

  private generateTimeBasedPredictions(pattern: UserPattern): PreloadPrediction[] {
    // Simplified time-based prediction
    return [];
  }

  private actionToKey(action: string): string {
    // Convert user action to cache key
    return `preload_${action}`;
  }

  private startPredictivePreloading(): void {
    setInterval(() => {
      // Process preload queue
      if (this.preloadQueue.length > 0) {
        const predictions = this.preloadQueue.splice(0, 3); // Process 3 at a time
        this.preloadData(predictions);
      }
    }, 5000); // Every 5 seconds
  }

  private async loadPersistedStats(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('cacheStats');
      if (stored) {
        const persistedStats = JSON.parse(stored);
        this.stats = { ...this.stats, ...persistedStats };
      }
    } catch (error) {
      console.warn('Failed to load persisted cache stats:', error);
    }
  }

  private async loadDiskCacheIndex(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('diskCacheIndex');
      if (stored) {
        const keys = JSON.parse(stored);
        this.diskCacheKeys = new Set(keys);
      }
    } catch (error) {
      console.warn('Failed to load disk cache index:', error);
    }
  }
}

// Singleton instance
export const advancedCacheStrategy = new AdvancedCacheStrategy();