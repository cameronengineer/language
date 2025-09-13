/**
 * ImageCacheManager - LRU cache with memory limits for vocabulary images
 * Optimizes memory usage and provides intelligent image caching
 */

import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry {
  uri: string;
  size: number;
  lastAccessed: number;
  loadTime: number;
  accessCount: number;
}

interface CacheStats {
  totalSize: number;
  entryCount: number;
  hitRate: number;
  totalRequests: number;
  cacheHits: number;
  evictions: number;
}

export class ImageCacheManager {
  private cache = new Map<string, CacheEntry>();
  private maxCacheSize: number;
  private maxEntries: number;
  private stats: CacheStats;
  private readonly STORAGE_KEY = 'imageCacheStats';

  constructor(
    maxCacheSizeMB: number = 50,
    maxEntries: number = 200
  ) {
    this.maxCacheSize = maxCacheSizeMB * 1024 * 1024; // Convert to bytes
    this.maxEntries = maxEntries;
    this.stats = {
      totalSize: 0,
      entryCount: 0,
      hitRate: 0,
      totalRequests: 0,
      cacheHits: 0,
      evictions: 0,
    };
    
    this.loadStats();
    this.setupMemoryWarningListener();
  }

  /**
   * Get image from cache or load if not cached
   */
  async getImage(key: string, uri: string, estimatedSize: number = 100000): Promise<string> {
    this.stats.totalRequests++;

    const entry = this.cache.get(key);
    if (entry) {
      // Cache hit
      entry.lastAccessed = Date.now();
      entry.accessCount++;
      this.stats.cacheHits++;
      this.updateHitRate();
      return entry.uri;
    }

    // Cache miss - load image
    const loadStartTime = Date.now();
    
    try {
      // Preload image to ensure it's available
      await Image.prefetch(uri);
      
      const loadTime = Date.now() - loadStartTime;
      
      // Add to cache
      const newEntry: CacheEntry = {
        uri,
        size: estimatedSize,
        lastAccessed: Date.now(),
        loadTime,
        accessCount: 1,
      };

      this.addToCache(key, newEntry);
      return uri;

    } catch (error) {
      console.error('Failed to load image:', error);
      throw error;
    }
  }

  /**
   * Preload multiple images for performance
   */
  async preloadImages(items: Array<{ key: string; uri: string; size?: number }>): Promise<void> {
    const preloadPromises = items.map(async ({ key, uri, size = 100000 }) => {
      try {
        await this.getImage(key, uri, size);
      } catch (error) {
        console.warn(`Failed to preload image ${key}:`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Add entry to cache with LRU eviction
   */
  private addToCache(key: string, entry: CacheEntry): void {
    // Check if we need to evict entries
    this.evictIfNecessary(entry.size);

    this.cache.set(key, entry);
    this.stats.totalSize += entry.size;
    this.stats.entryCount++;

    this.saveStats();
  }

  /**
   * Evict entries if necessary using LRU strategy
   */
  private evictIfNecessary(newEntrySize: number): void {
    // Check size limit
    while (
      this.stats.totalSize + newEntrySize > this.maxCacheSize ||
      this.stats.entryCount >= this.maxEntries
    ) {
      this.evictLRU();
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey)!;
      this.cache.delete(oldestKey);
      this.stats.totalSize -= entry.size;
      this.stats.entryCount--;
      this.stats.evictions++;

      // Clear from Expo Image cache as well
      Image.clearDiskCache();
    }
  }

  /**
   * Smart cache cleanup based on memory pressure
   */
  async performSmartCleanup(): Promise<void> {
    const entries = Array.from(this.cache.entries());
    
    // Sort by access frequency and recency
    entries.sort(([, a], [, b]) => {
      const aScore = a.accessCount * 0.7 + (Date.now() - a.lastAccessed) * -0.3;
      const bScore = b.accessCount * 0.7 + (Date.now() - b.lastAccessed) * -0.3;
      return aScore - bScore;
    });

    // Remove bottom 25% of entries
    const toRemove = Math.floor(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      const [key, entry] = entries[i];
      this.cache.delete(key);
      this.stats.totalSize -= entry.size;
      this.stats.entryCount--;
    }

    this.saveStats();
  }

  /**
   * Clear all cached images
   */
  async clearCache(): Promise<void> {
    this.cache.clear();
    this.stats.totalSize = 0;
    this.stats.entryCount = 0;
    this.stats.evictions = 0;
    
    await Image.clearDiskCache();
    await this.saveStats();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get memory usage in MB
   */
  getMemoryUsageMB(): number {
    return this.stats.totalSize / (1024 * 1024);
  }

  /**
   * Update hit rate calculation
   */
  private updateHitRate(): void {
    this.stats.hitRate = this.stats.totalRequests > 0 
      ? (this.stats.cacheHits / this.stats.totalRequests) * 100 
      : 0;
  }

  /**
   * Setup memory warning listener for automatic cleanup
   */
  private setupMemoryWarningListener(): void {
    // Note: This would be implemented with a native module in production
    // For now, we'll use a timer-based approach
    setInterval(() => {
      if (this.getMemoryUsageMB() > this.maxCacheSize * 0.8 / (1024 * 1024)) {
        this.performSmartCleanup();
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Save cache statistics to persistent storage
   */
  private async saveStats(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.stats));
    } catch (error) {
      console.error('Failed to save cache stats:', error);
    }
  }

  /**
   * Load cache statistics from persistent storage
   */
  private async loadStats(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const loadedStats = JSON.parse(stored);
        this.stats = { ...this.stats, ...loadedStats };
      }
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    }
  }

  /**
   * Get cache efficiency report
   */
  getEfficiencyReport(): {
    hitRate: number;
    averageLoadTime: number;
    memoryEfficiency: number;
    totalSavings: number;
  } {
    const entries = Array.from(this.cache.values());
    const averageLoadTime = entries.length > 0 
      ? entries.reduce((sum, entry) => sum + entry.loadTime, 0) / entries.length 
      : 0;

    const memoryEfficiency = this.maxCacheSize > 0 
      ? (this.stats.totalSize / this.maxCacheSize) * 100 
      : 0;

    const totalSavings = this.stats.cacheHits * averageLoadTime;

    return {
      hitRate: this.stats.hitRate,
      averageLoadTime,
      memoryEfficiency,
      totalSavings,
    };
  }
}

// Singleton instance
export const imageCacheManager = new ImageCacheManager();