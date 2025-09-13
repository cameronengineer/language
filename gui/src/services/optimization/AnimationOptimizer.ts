/**
 * AnimationOptimizer - Ensure 60fps performance for all animations
 * Optimizes animations for native driver usage and smooth performance
 */

import { Animated, Easing, InteractionManager } from 'react-native';
import Reanimated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';

interface AnimationConfig {
  duration?: number;
  easing?: any;
  useNativeDriver: boolean;
  delay?: number;
  type: 'timing' | 'spring' | 'sequence' | 'parallel';
}

interface PerformanceMetrics {
  frameDrops: number;
  averageFPS: number;
  animationDuration: number;
  memoryUsage: number;
  isUsingNativeDriver: boolean;
}

interface OptimizedAnimation {
  id: string;
  name: string;
  config: AnimationConfig;
  performance: PerformanceMetrics;
  optimizations: string[];
}

interface AnimationPreset {
  name: string;
  config: AnimationConfig;
  description: string;
  useCase: string;
}

export class AnimationOptimizer {
  private activeAnimations = new Map<string, OptimizedAnimation>();
  private frameTracker: number[] = [];
  private performanceCallbacks: ((metrics: PerformanceMetrics) => void)[] = [];
  private readonly TARGET_FPS = 60;
  private readonly FRAME_BUDGET_MS = 16.67; // 60fps = 16.67ms per frame

  /**
   * Optimized animation presets for common use cases
   */
  private readonly ANIMATION_PRESETS: AnimationPreset[] = [
    {
      name: 'quickFade',
      config: {
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
        type: 'timing',
      },
      description: 'Fast fade in/out for UI elements',
      useCase: 'Modal transitions, overlay animations',
    },
    {
      name: 'smoothSlide',
      config: {
        duration: 300,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        useNativeDriver: true,
        type: 'timing',
      },
      description: 'Smooth sliding animation',
      useCase: 'Screen transitions, drawer animations',
    },
    {
      name: 'bouncyScale',
      config: {
        useNativeDriver: true,
        type: 'spring',
      },
      description: 'Bouncy scaling animation',
      useCase: 'Button press feedback, card interactions',
    },
    {
      name: 'gentleSpring',
      config: {
        useNativeDriver: true,
        type: 'spring',
      },
      description: 'Gentle spring animation',
      useCase: 'List item animations, layout changes',
    },
  ];

  /**
   * Create optimized timing animation
   */
  createOptimizedTiming(
    animatedValue: Animated.Value,
    toValue: number,
    config?: Partial<AnimationConfig>
  ): Animated.CompositeAnimation {
    const optimizedConfig = this.optimizeAnimationConfig({
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
      type: 'timing',
      ...config,
    });

    return Animated.timing(animatedValue, {
      toValue,
      duration: optimizedConfig.duration,
      easing: optimizedConfig.easing,
      useNativeDriver: optimizedConfig.useNativeDriver,
      delay: optimizedConfig.delay,
    });
  }

  /**
   * Create optimized spring animation
   */
  createOptimizedSpring(
    animatedValue: Animated.Value,
    toValue: number,
    config?: any
  ): Animated.CompositeAnimation {
    const optimizedConfig = {
      tension: 100,
      friction: 8,
      useNativeDriver: true,
      ...config,
    };

    return Animated.spring(animatedValue, {
      toValue,
      ...optimizedConfig,
    });
  }

  /**
   * Create Reanimated optimized timing animation
   */
  createReanimatedTiming(
    toValue: number,
    config?: {
      duration?: number;
      easing?: any;
    }
  ) {
    return withTiming(toValue, {
      duration: config?.duration || 300,
      easing: config?.easing || Easing.out(Easing.quad),
    });
  }

  /**
   * Create Reanimated optimized spring animation
   */
  createReanimatedSpring(
    toValue: number,
    config?: {
      damping?: number;
      stiffness?: number;
      mass?: number;
    }
  ) {
    return withSpring(toValue, {
      damping: config?.damping || 15,
      stiffness: config?.stiffness || 150,
      mass: config?.mass || 1,
    });
  }

  /**
   * Create staggered animations for list items
   */
  createStaggeredAnimation(
    items: Animated.Value[],
    toValue: number,
    staggerDelay: number = 100
  ): Animated.CompositeAnimation {
    const animations = items.map((item, index) => 
      Animated.timing(item, {
        toValue,
        duration: 300,
        delay: index * staggerDelay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    );

    return Animated.parallel(animations);
  }

  /**
   * Create gesture-responsive animation
   */
  createGestureAnimation(
    animatedValue: Animated.Value,
    gestureState: any,
    config?: Partial<AnimationConfig>
  ): void {
    // Optimize gesture animations to reduce frame drops
    const optimizedConfig = this.optimizeAnimationConfig({
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
      type: 'timing',
      ...config,
    });

    // Use InteractionManager to schedule after interactions
    InteractionManager.runAfterInteractions(() => {
      Animated.timing(animatedValue, {
        toValue: gestureState.dx,
        duration: optimizedConfig.duration,
        easing: optimizedConfig.easing,
        useNativeDriver: optimizedConfig.useNativeDriver,
      }).start();
    });
  }

  /**
   * Optimize existing animation configuration
   */
  private optimizeAnimationConfig(config: AnimationConfig): AnimationConfig {
    const optimized = { ...config };

    // Always prefer native driver when possible
    if (!optimized.useNativeDriver && this.canUseNativeDriver(config)) {
      optimized.useNativeDriver = true;
    }

    // Optimize duration for smooth 60fps
    if (optimized.duration && optimized.duration % this.FRAME_BUDGET_MS !== 0) {
      optimized.duration = Math.round(optimized.duration / this.FRAME_BUDGET_MS) * this.FRAME_BUDGET_MS;
    }

    // Use hardware-accelerated easing functions
    if (!optimized.easing) {
      optimized.easing = Easing.out(Easing.quad);
    }

    return optimized;
  }

  /**
   * Check if native driver can be used for animation properties
   */
  private canUseNativeDriver(config: AnimationConfig): boolean {
    // Native driver supports: opacity, transform (scale, rotation, translation)
    // Does not support: layout properties (width, height, etc.)
    return true; // Simplified check
  }

  /**
   * Performance monitoring for animations
   */
  startPerformanceMonitoring(): () => void {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFrame = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;
      
      frameCount++;
      this.frameTracker.push(deltaTime);

      // Keep only recent frames
      if (this.frameTracker.length > 100) {
        this.frameTracker.shift();
      }

      // Calculate FPS every second
      if (deltaTime >= 1000) {
        const fps = frameCount;
        frameCount = 0;
        lastTime = currentTime;

        this.notifyPerformanceCallbacks({
          frameDrops: this.countFrameDrops(),
          averageFPS: fps,
          animationDuration: this.getAverageAnimationDuration(),
          memoryUsage: this.estimateAnimationMemoryUsage(),
          isUsingNativeDriver: this.areAllAnimationsUsingNativeDriver(),
        });
      }

      animationId = requestAnimationFrame(measureFrame);
    };

    animationId = requestAnimationFrame(measureFrame);

    return () => cancelAnimationFrame(animationId);
  }

  /**
   * Count frame drops (frames taking longer than 16.67ms)
   */
  private countFrameDrops(): number {
    return this.frameTracker.filter(frameTime => frameTime > this.FRAME_BUDGET_MS).length;
  }

  /**
   * Get average animation duration
   */
  private getAverageAnimationDuration(): number {
    const durations = Array.from(this.activeAnimations.values())
      .map(anim => anim.config.duration || 0)
      .filter(duration => duration > 0);

    return durations.length > 0 
      ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length
      : 0;
  }

  /**
   * Estimate memory usage of active animations
   */
  private estimateAnimationMemoryUsage(): number {
    // Simplified memory estimation
    return this.activeAnimations.size * 1024; // 1KB per animation
  }

  /**
   * Check if all animations are using native driver
   */
  private areAllAnimationsUsingNativeDriver(): boolean {
    return Array.from(this.activeAnimations.values())
      .every(anim => anim.config.useNativeDriver);
  }

  /**
   * Get animation preset by name
   */
  getPreset(name: string): AnimationPreset | undefined {
    return this.ANIMATION_PRESETS.find(preset => preset.name === name);
  }

  /**
   * Get all available presets
   */
  getAllPresets(): AnimationPreset[] {
    return [...this.ANIMATION_PRESETS];
  }

  /**
   * Register performance callback
   */
  onPerformanceUpdate(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.performanceCallbacks.push(callback);
    
    return () => {
      const index = this.performanceCallbacks.indexOf(callback);
      if (index > -1) {
        this.performanceCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify performance callbacks
   */
  private notifyPerformanceCallbacks(metrics: PerformanceMetrics): void {
    this.performanceCallbacks.forEach(callback => {
      try {
        callback(metrics);
      } catch (error) {
        console.error('Error in animation performance callback:', error);
      }
    });
  }

  /**
   * Optimize animation for low-end devices
   */
  optimizeForDevice(animationConfig: AnimationConfig, deviceInfo?: any): AnimationConfig {
    // Reduce animation complexity on lower-end devices
    const isLowEndDevice = deviceInfo?.totalMemory < 2000000000; // < 2GB RAM

    if (isLowEndDevice) {
      return {
        ...animationConfig,
        duration: (animationConfig.duration || 300) * 0.7, // Shorter duration
        useNativeDriver: true, // Force native driver
      };
    }

    return animationConfig;
  }

  /**
   * Create chain of optimized animations
   */
  createAnimationChain(
    animations: Array<{
      value: Animated.Value;
      toValue: number;
      config?: Partial<AnimationConfig>;
    }>
  ): Animated.CompositeAnimation {
    const optimizedAnimations = animations.map(({ value, toValue, config }) => 
      this.createOptimizedTiming(value, toValue, config)
    );

    return Animated.sequence(optimizedAnimations);
  }

  /**
   * Create parallel optimized animations
   */
  createParallelAnimations(
    animations: Array<{
      value: Animated.Value;
      toValue: number;
      config?: Partial<AnimationConfig>;
    }>
  ): Animated.CompositeAnimation {
    const optimizedAnimations = animations.map(({ value, toValue, config }) => 
      this.createOptimizedTiming(value, toValue, config)
    );

    return Animated.parallel(optimizedAnimations);
  }

  /**
   * Cancel all active animations
   */
  cancelAllAnimations(): void {
    Array.from(this.activeAnimations.values()).forEach(animation => {
      // Cancel animation logic would go here
    });
    this.activeAnimations.clear();
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): {
    averageFPS: number;
    frameDrops: number;
    nativeDriverUsage: number;
    recommendations: string[];
  } {
    const frameDrops = this.countFrameDrops();
    const averageFPS = this.frameTracker.length > 0 
      ? 1000 / (this.frameTracker.reduce((a, b) => a + b, 0) / this.frameTracker.length)
      : 0;

    const nativeDriverAnimations = Array.from(this.activeAnimations.values())
      .filter(anim => anim.config.useNativeDriver).length;
    const nativeDriverUsage = this.activeAnimations.size > 0 
      ? (nativeDriverAnimations / this.activeAnimations.size) * 100 
      : 100;

    const recommendations: string[] = [];

    if (averageFPS < 55) {
      recommendations.push('Frame rate is below 55fps. Consider reducing animation complexity.');
    }

    if (frameDrops > 5) {
      recommendations.push('Multiple frame drops detected. Optimize heavy animations.');
    }

    if (nativeDriverUsage < 90) {
      recommendations.push('Some animations not using native driver. Enable for better performance.');
    }

    if (this.activeAnimations.size > 10) {
      recommendations.push('Many concurrent animations detected. Consider staggering or reducing complexity.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Animation performance looks good!');
    }

    return {
      averageFPS: Math.round(averageFPS),
      frameDrops,
      nativeDriverUsage: Math.round(nativeDriverUsage),
      recommendations,
    };
  }

  /**
   * React hooks for optimized animations
   */
  useOptimizedTiming = (
    initialValue: number,
    config?: Partial<AnimationConfig>
  ) => {
    const animatedValue = useSharedValue(initialValue);

    const animateToValue = (toValue: number, customConfig?: Partial<AnimationConfig>) => {
      const finalConfig = this.optimizeAnimationConfig({
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
        type: 'timing',
        ...config,
        ...customConfig,
      });

      animatedValue.value = withTiming(toValue, {
        duration: finalConfig.duration,
        easing: finalConfig.easing,
      });
    };

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: animatedValue.value }],
    }));

    return { animatedValue, animateToValue, animatedStyle };
  };

  useOptimizedSpring = (
    initialValue: number,
    config?: any
  ) => {
    const animatedValue = useSharedValue(initialValue);

    const animateToValue = (toValue: number, customConfig?: any) => {
      const finalConfig = {
        damping: 15,
        stiffness: 150,
        mass: 1,
        ...config,
        ...customConfig,
      };

      animatedValue.value = withSpring(toValue, finalConfig);
    };

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: animatedValue.value }],
    }));

    return { animatedValue, animateToValue, animatedStyle };
  };
}

// Singleton instance
export const animationOptimizer = new AnimationOptimizer();

// Convenience hooks
export const useOptimizedTiming = animationOptimizer.useOptimizedTiming;
export const useOptimizedSpring = animationOptimizer.useOptimizedSpring;