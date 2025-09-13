/**
 * AudioCacheOptimizer - Smart audio caching with usage pattern analysis
 * Optimizes audio loading and memory usage based on user behavior
 */

import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { audioManager } from '../audio/AudioManager';

interface AudioCacheEntry {
  uri: string;
  sound?: Audio.Sound;
  lastAccessed: number;
  accessCount: number;
  loadTime: number;
  size: number;
  preloadPriority: number;
  userPattern: UserAccessPattern;
}

interface UserAccessPattern {
  timeOfDay: number[];
  sessionFrequency: number;
  practiceType: string[];
  difficulty: string;
  averageSessionLength: number;
}

interface CacheMetrics {
  totalSize: number;
  entryCount: number;
  hitRate: number;
  preloadSuccessRate: number;
  memoryPressureEvents: number;
  adaptiveEvictions: number;
}

interface PredictionModel {
  nextLikelyWords: string[];
  confidenceScores: number[];
  timeBasedPredictions: string[];
  contextualPredictions: string[];
}

export class AudioCacheOptimizer {
  private cache = new Map<string, AudioCacheEntry>();
  private accessPatterns = new Map<string, UserAccessPattern>();
  private metrics: CacheMetrics;
  private maxCacheSize: number;
  private maxEntries: number;
  private predictionModel: PredictionModel;
  private readonly STORAGE_KEY = 'audioCacheOptimizer';
  private readonly PATTERNS_KEY = 'audioAccessPatterns';

  constructor(
    maxCacheSizeMB: number = 30,
    maxEntries: number = 100
  ) {
    this.maxCacheSize = maxCacheSizeMB * 1024 * 1024;
    this.maxEntries = maxEntries;
    this.metrics = {
      totalSize: 0,
      entryCount: 0,
      hitRate: 0,
      preloadSuccessRate: 0,
      memoryPressureEvents: 0,
      adaptiveEvictions: 0,
    };
    this.predictionModel = {
      nextLikelyWords: [],
      confidenceScores: [],
      timeBasedPredictions: [],
      contextualPredictions: [],
    };

    this.initializeCache();
  }

  /**
   * Initialize cache and load persisted data
   */
  private async initializeCache(): Promise<void> {
    await this.loadPersistedData();
    this.setupPerformanceMonitoring();
    this.startPredictivePreloading();
  }

  /**
   * Get audio with intelligent caching and preloading
   */
  async getAudio(
    studyWord: string, 
    uri: string, 
    context?: {
      practiceType: string;
      difficulty: string;
      sessionTime: number;
    }
  ): Promise<Audio.Sound> {
    const entry = this.cache.get(studyWord);
    
    if (entry && entry.sound) {
      // Cache hit
      entry.lastAccessed = Date.now();
      entry.accessCount++;
      this.updateAccessPattern(studyWord, context);
      this.metrics.hitRate = this.calculateHitRate();
      return entry.sound;
    }

    // Cache miss - load audio
    const loadStartTime = Date.now();
    
    try {
      const sound = await audioManager.loadAudio(studyWord);
      const loadTime = Date.now() - loadStartTime;
      
      // Create cache entry with pattern analysis
      const cacheEntry: AudioCacheEntry = {
        uri,
        sound,
        lastAccessed: Date.now(),
        accessCount: 1,
        loadTime,
        size: await this.estimateAudioSize(uri),
        preloadPriority: this.calculatePreloadPriority(studyWord, context),
        userPattern: this.getOrCreatePattern(studyWord),
      };

      this.addToCache(studyWord, cacheEntry);
      this.updateAccessPattern(studyWord, context);
      this.triggerPredictivePreloading(studyWord, context);

      return sound;

    } catch (error) {
      console.error(`Failed to load audio for ${studyWord}:`, error);
      throw error;
    }
  }

  /**
   * Predictive preloading based on user patterns
   */
  async predictivePreload(
    currentWord: string,
    context?: {
      practiceType: string;
      difficulty: string;
      sessionTime: number;
    }
  ): Promise<void> {
    const predictions = this.generatePredictions(currentWord, context);
    
    // Preload high-confidence predictions
    const preloadPromises = predictions.nextLikelyWords
      .slice(0, 5) // Limit to top 5 predictions
      .map(async (word, index) => {
        const confidence = predictions.confidenceScores[index];
        if (confidence > 0.6 && !this.cache.has(word)) {
          try {
            // Simulate audio URI generation for predicted word
            const uri = await this.generateAudioUri(word);
            await this.getAudio(word, uri, context);
          } catch (error) {
            console.warn(`Failed to preload audio for ${word}:`, error);
          }
        }
      });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Generate predictions based on user patterns and context
   */
  private generatePredictions(
    currentWord: string,
    context?: {
      practiceType: string;
      difficulty: string;
      sessionTime: number;
    }
  ): PredictionModel {
    const pattern = this.accessPatterns.get(currentWord);
    const timeOfDay = new Date().getHours();
    
    // Analyze patterns to predict next words
    const nextLikelyWords: string[] = [];
    const confidenceScores: number[] = [];

    // Time-based predictions
    const timeBasedPredictions = this.getTimeBasedPredictions(timeOfDay);
    
    // Context-based predictions
    const contextualPredictions = context 
      ? this.getContextualPredictions(context)
      : [];

    // Combine predictions
    const combinedPredictions = [
      ...timeBasedPredictions,
      ...contextualPredictions,
    ].filter((word, index, self) => self.indexOf(word) === index);

    // Calculate confidence scores
    combinedPredictions.forEach(word => {
      const confidence = this.calculatePredictionConfidence(word, context);
      nextLikelyWords.push(word);
      confidenceScores.push(confidence);
    });

    return {
      nextLikelyWords,
      confidenceScores,
      timeBasedPredictions,
      contextualPredictions,
    };
  }

  /**
   * Adaptive cache management based on memory pressure
   */
  async adaptiveCacheManagement(): Promise<void> {
    const memoryPressure = await this.detectMemoryPressure();
    
    if (memoryPressure > 0.8) {
      // High memory pressure - aggressive cleanup
      await this.performAggressiveCleanup();
      this.metrics.memoryPressureEvents++;
    } else if (memoryPressure > 0.6) {
      // Moderate memory pressure - smart cleanup
      await this.performSmartCleanup();
    }

    // Adjust cache size based on available memory
    this.adjustCacheSize(memoryPressure);
  }

  /**
   * Smart cleanup based on usage patterns and priority
   */
  private async performSmartCleanup(): Promise<void> {
    const entries = Array.from(this.cache.entries());
    
    // Score entries based on multiple factors
    const scored = entries.map(([word, entry]) => ({
      word,
      entry,
      score: this.calculateRetentionScore(entry),
    }));

    // Sort by score (lowest first for removal)
    scored.sort((a, b) => a.score - b.score);

    // Remove bottom 30% of entries
    const toRemove = Math.floor(scored.length * 0.3);
    for (let i = 0; i < toRemove; i++) {
      const { word, entry } = scored[i];
      await this.removeFromCache(word);
      this.metrics.adaptiveEvictions++;
    }

    this.persistData();
  }

  /**
   * Calculate retention score for cache entry
   */
  private calculateRetentionScore(entry: AudioCacheEntry): number {
    const now = Date.now();
    const timeSinceAccess = now - entry.lastAccessed;
    const accessFrequency = entry.accessCount;
    const preloadPriority = entry.preloadPriority;
    const loadTime = entry.loadTime;

    // Higher score means higher retention value
    const timeScore = Math.max(0, 1 - (timeSinceAccess / (24 * 60 * 60 * 1000))); // 24h decay
    const frequencyScore = Math.min(1, accessFrequency / 10); // Normalize to 0-1
    const priorityScore = preloadPriority / 100; // Normalize to 0-1
    const performanceScore = Math.max(0, 1 - (loadTime / 5000)); // 5s max load time

    return (timeScore * 0.3) + (frequencyScore * 0.4) + (priorityScore * 0.2) + (performanceScore * 0.1);
  }

  /**
   * Update access pattern for a word
   */
  private updateAccessPattern(
    studyWord: string,
    context?: {
      practiceType: string;
      difficulty: string;
      sessionTime: number;
    }
  ): void {
    const pattern = this.getOrCreatePattern(studyWord);
    const hour = new Date().getHours();
    
    // Update time of day pattern
    pattern.timeOfDay[hour] = (pattern.timeOfDay[hour] || 0) + 1;
    pattern.sessionFrequency += 1;
    
    if (context) {
      // Update practice type patterns
      if (!pattern.practiceType.includes(context.practiceType)) {
        pattern.practiceType.push(context.practiceType);
      }
      
      pattern.difficulty = context.difficulty;
      pattern.averageSessionLength = 
        (pattern.averageSessionLength * 0.8) + (context.sessionTime * 0.2);
    }

    this.accessPatterns.set(studyWord, pattern);
  }

  /**
   * Get or create user access pattern for a word
   */
  private getOrCreatePattern(studyWord: string): UserAccessPattern {
    return this.accessPatterns.get(studyWord) || {
      timeOfDay: new Array(24).fill(0),
      sessionFrequency: 0,
      practiceType: [],
      difficulty: 'beginner',
      averageSessionLength: 0,
    };
  }

  /**
   * Calculate preload priority based on context and patterns
   */
  private calculatePreloadPriority(
    studyWord: string,
    context?: {
      practiceType: string;
      difficulty: string;
      sessionTime: number;
    }
  ): number {
    const pattern = this.accessPatterns.get(studyWord);
    let priority = 50; // Base priority

    if (pattern) {
      // Higher frequency = higher priority
      priority += Math.min(30, pattern.sessionFrequency * 2);
      
      // Recent access = higher priority
      const hoursSinceAccess = (Date.now() - Date.now()) / (1000 * 60 * 60);
      priority += Math.max(0, 20 - hoursSinceAccess);
    }

    if (context) {
      // Difficulty-based adjustments
      switch (context.difficulty) {
        case 'beginner': priority += 15; break;
        case 'intermediate': priority += 10; break;
        case 'advanced': priority += 5; break;
      }
    }

    return Math.min(100, Math.max(0, priority));
  }

  /**
   * Add entry to cache with intelligent management
   */
  private async addToCache(studyWord: string, entry: AudioCacheEntry): Promise<void> {
    // Check if eviction is needed
    await this.evictIfNecessary(entry.size);

    this.cache.set(studyWord, entry);
    this.metrics.totalSize += entry.size;
    this.metrics.entryCount++;

    this.persistData();
  }

  /**
   * Remove entry from cache
   */
  private async removeFromCache(studyWord: string): Promise<void> {
    const entry = this.cache.get(studyWord);
    if (entry) {
      if (entry.sound) {
        await audioManager.unloadAudio(studyWord);
      }
      
      this.cache.delete(studyWord);
      this.metrics.totalSize -= entry.size;
      this.metrics.entryCount--;
    }
  }

  /**
   * Estimate audio file size
   */
  private async estimateAudioSize(uri: string): Promise<number> {
    // Rough estimation based on URI or default size
    // In production, this could fetch actual file size
    return 50000; // 50KB default estimate
  }

  /**
   * Generate audio URI for a word
   */
  private async generateAudioUri(word: string): Promise<string> {
    // Simulate URI generation logic
    return `https://api.example.com/audio/${word}.mp3`;
  }

  /**
   * Detect memory pressure (0-1 scale)
   */
  private async detectMemoryPressure(): Promise<number> {
    // Simulate memory pressure detection
    // In production, this would use native memory monitoring
    const cacheUsage = this.metrics.totalSize / this.maxCacheSize;
    return Math.min(1, cacheUsage * 1.2);
  }

  /**
   * Calculate hit rate
   */
  private calculateHitRate(): number {
    const totalRequests = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.accessCount, 0);
    const hits = Array.from(this.cache.values())
      .filter(entry => entry.accessCount > 1)
      .reduce((sum, entry) => sum + (entry.accessCount - 1), 0);
    
    return totalRequests > 0 ? (hits / totalRequests) * 100 : 0;
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    setInterval(async () => {
      await this.adaptiveCacheManagement();
      this.persistData();
    }, 60000); // Check every minute
  }

  /**
   * Start predictive preloading process
   */
  private startPredictivePreloading(): void {
    setInterval(() => {
      // Analyze patterns and preload likely next words
      this.performBackgroundPreloading();
    }, 30000); // Every 30 seconds
  }

  /**
   * Get cache metrics and performance data
   */
  getMetrics(): CacheMetrics & {
    memoryUsageMB: number;
    averageLoadTime: number;
    topWords: string[];
  } {
    const entries = Array.from(this.cache.values());
    const averageLoadTime = entries.length > 0
      ? entries.reduce((sum, entry) => sum + entry.loadTime, 0) / entries.length
      : 0;

    const topWords = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => b.accessCount - a.accessCount)
      .slice(0, 10)
      .map(([word]) => word);

    return {
      ...this.metrics,
      memoryUsageMB: this.metrics.totalSize / (1024 * 1024),
      averageLoadTime,
      topWords,
    };
  }

  /**
   * Persist cache data and patterns
   */
  private async persistData(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.metrics));
      await AsyncStorage.setItem(
        this.PATTERNS_KEY, 
        JSON.stringify(Array.from(this.accessPatterns.entries()))
      );
    } catch (error) {
      console.error('Failed to persist audio cache data:', error);
    }
  }

  /**
   * Load persisted data
   */
  private async loadPersistedData(): Promise<void> {
    try {
      const metricsData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (metricsData) {
        this.metrics = { ...this.metrics, ...JSON.parse(metricsData) };
      }

      const patternsData = await AsyncStorage.getItem(this.PATTERNS_KEY);
      if (patternsData) {
        const patterns = JSON.parse(patternsData);
        this.accessPatterns = new Map(patterns);
      }
    } catch (error) {
      console.error('Failed to load persisted audio cache data:', error);
    }
  }

  // Additional helper methods for predictions and cleanup...
  private getTimeBasedPredictions(hour: number): string[] {
    // Implementation for time-based predictions
    return [];
  }

  private getContextualPredictions(context: any): string[] {
    // Implementation for context-based predictions
    return [];
  }

  private calculatePredictionConfidence(word: string, context?: any): number {
    // Implementation for confidence calculation
    return 0.5;
  }

  private async performAggressiveCleanup(): Promise<void> {
    // More aggressive cleanup for high memory pressure
    await this.performSmartCleanup();
  }

  private adjustCacheSize(memoryPressure: number): void {
    // Adjust cache size based on memory pressure
    if (memoryPressure > 0.8) {
      this.maxCacheSize *= 0.8;
    } else if (memoryPressure < 0.4) {
      this.maxCacheSize *= 1.1;
    }
  }

  private async evictIfNecessary(newEntrySize: number): Promise<void> {
    while (
      this.metrics.totalSize + newEntrySize > this.maxCacheSize ||
      this.metrics.entryCount >= this.maxEntries
    ) {
      await this.performSmartCleanup();
    }
  }

  private triggerPredictivePreloading(studyWord: string, context?: any): void {
    // Trigger preloading based on current word
    setTimeout(() => {
      this.predictivePreload(studyWord, context);
    }, 1000);
  }

  private async performBackgroundPreloading(): Promise<void> {
    // Background preloading logic
    const patterns = Array.from(this.accessPatterns.entries());
    // Implementation for background preloading
  }
}

// Singleton instance
export const audioCacheOptimizer = new AudioCacheOptimizer();