/**
 * ComponentProfiler - Performance monitoring for heavy components
 * Tracks render times, re-renders, and memory usage for optimization
 */

import React from 'react';

interface ComponentMetrics {
  name: string;
  renderCount: number;
  totalRenderTime: number;
  averageRenderTime: number;
  lastRenderTime: number;
  slowRenders: number;
  memoryUsage: number;
  propsChanges: number;
  unnecessaryRenders: number;
  mountTime: number;
  unmountTime?: number;
}

interface PerformanceSnapshot {
  timestamp: number;
  componentMetrics: Map<string, ComponentMetrics>;
  globalMetrics: {
    totalComponents: number;
    activeComponents: number;
    memoryPressure: number;
    averageRenderTime: number;
    slowRenderThreshold: number;
  };
}

interface RenderProfile {
  componentName: string;
  startTime: number;
  endTime: number;
  renderTime: number;
  propsSize: number;
  childCount: number;
  isSlowRender: boolean;
}

export class ComponentProfiler {
  private metrics = new Map<string, ComponentMetrics>();
  private renderProfiles: RenderProfile[] = [];
  private activeRenders = new Map<string, number>();
  private slowRenderThreshold = 16; // 16ms for 60fps
  private memoryThreshold = 50 * 1024 * 1024; // 50MB
  private maxProfileHistory = 1000;
  private isProfilingEnabled = true;

  /**
   * Start profiling a component render
   */
  startRender(componentName: string, props?: any): void {
    if (!this.isProfilingEnabled) return;

    const startTime = performance.now();
    this.activeRenders.set(componentName, startTime);

    // Initialize metrics if first time
    if (!this.metrics.has(componentName)) {
      this.metrics.set(componentName, {
        name: componentName,
        renderCount: 0,
        totalRenderTime: 0,
        averageRenderTime: 0,
        lastRenderTime: 0,
        slowRenders: 0,
        memoryUsage: 0,
        propsChanges: 0,
        unnecessaryRenders: 0,
        mountTime: startTime,
      });
    }

    // Track props changes
    if (props) {
      const metrics = this.metrics.get(componentName)!;
      metrics.propsChanges++;
    }
  }

  /**
   * End profiling a component render
   */
  endRender(componentName: string, childCount: number = 0): void {
    if (!this.isProfilingEnabled) return;

    const endTime = performance.now();
    const startTime = this.activeRenders.get(componentName);

    if (!startTime) return;

    const renderTime = endTime - startTime;
    const isSlowRender = renderTime > this.slowRenderThreshold;

    // Update metrics
    const metrics = this.metrics.get(componentName);
    if (metrics) {
      metrics.renderCount++;
      metrics.totalRenderTime += renderTime;
      metrics.averageRenderTime = metrics.totalRenderTime / metrics.renderCount;
      metrics.lastRenderTime = renderTime;
      
      if (isSlowRender) {
        metrics.slowRenders++;
      }

      // Estimate memory usage (simplified)
      metrics.memoryUsage = this.estimateComponentMemory(componentName, childCount);
    }

    // Create render profile
    const profile: RenderProfile = {
      componentName,
      startTime,
      endTime,
      renderTime,
      propsSize: 0, // Could be calculated from props
      childCount,
      isSlowRender,
    };

    this.addRenderProfile(profile);
    this.activeRenders.delete(componentName);

    // Log slow renders
    if (isSlowRender) {
      console.warn(`Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }
  }

  /**
   * Track component mount
   */
  onComponentMount(componentName: string): void {
    const metrics = this.metrics.get(componentName);
    if (metrics) {
      metrics.mountTime = performance.now();
    }
  }

  /**
   * Track component unmount
   */
  onComponentUnmount(componentName: string): void {
    const metrics = this.metrics.get(componentName);
    if (metrics) {
      metrics.unmountTime = performance.now();
    }
  }

  /**
   * Track unnecessary re-renders
   */
  trackUnnecessaryRender(componentName: string, reason: string): void {
    const metrics = this.metrics.get(componentName);
    if (metrics) {
      metrics.unnecessaryRenders++;
      console.warn(`Unnecessary render in ${componentName}: ${reason}`);
    }
  }

  /**
   * Get performance metrics for a component
   */
  getComponentMetrics(componentName: string): ComponentMetrics | undefined {
    return this.metrics.get(componentName);
  }

  /**
   * Get all component metrics
   */
  getAllMetrics(): ComponentMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get performance snapshot
   */
  getPerformanceSnapshot(): PerformanceSnapshot {
    const now = performance.now();
    const allMetrics = Array.from(this.metrics.values());
    
    const globalMetrics = {
      totalComponents: this.metrics.size,
      activeComponents: this.activeRenders.size,
      memoryPressure: this.calculateMemoryPressure(),
      averageRenderTime: this.calculateGlobalAverageRenderTime(),
      slowRenderThreshold: this.slowRenderThreshold,
    };

    return {
      timestamp: now,
      componentMetrics: new Map(this.metrics),
      globalMetrics,
    };
  }

  /**
   * Get slow rendering components
   */
  getSlowComponents(threshold?: number): ComponentMetrics[] {
    const renderThreshold = threshold || this.slowRenderThreshold;
    
    return Array.from(this.metrics.values())
      .filter(metrics => metrics.averageRenderTime > renderThreshold)
      .sort((a, b) => b.averageRenderTime - a.averageRenderTime);
  }

  /**
   * Get components with unnecessary re-renders
   */
  getProblematicComponents(): ComponentMetrics[] {
    return Array.from(this.metrics.values())
      .filter(metrics => 
        metrics.unnecessaryRenders > 5 || 
        metrics.slowRenders / metrics.renderCount > 0.1
      )
      .sort((a, b) => b.unnecessaryRenders - a.unnecessaryRenders);
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(): {
    summary: {
      totalComponents: number;
      averageRenderTime: number;
      slowComponents: number;
      memoryUsage: number;
    };
    topSlowComponents: ComponentMetrics[];
    recommendations: string[];
    renderHistory: RenderProfile[];
  } {
    const allMetrics = Array.from(this.metrics.values());
    const slowComponents = this.getSlowComponents();
    
    const summary = {
      totalComponents: allMetrics.length,
      averageRenderTime: this.calculateGlobalAverageRenderTime(),
      slowComponents: slowComponents.length,
      memoryUsage: allMetrics.reduce((sum, m) => sum + m.memoryUsage, 0),
    };

    const recommendations = this.generateRecommendations();

    return {
      summary,
      topSlowComponents: slowComponents.slice(0, 10),
      recommendations,
      renderHistory: this.renderProfiles.slice(-100), // Last 100 renders
    };
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.metrics.clear();
    this.renderProfiles = [];
    this.activeRenders.clear();
  }

  /**
   * Enable/disable profiling
   */
  setProfilingEnabled(enabled: boolean): void {
    this.isProfilingEnabled = enabled;
  }

  /**
   * Set slow render threshold
   */
  setSlowRenderThreshold(thresholdMs: number): void {
    this.slowRenderThreshold = thresholdMs;
  }

  /**
   * Higher-order component for automatic profiling
   */
  withProfiling<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    componentName?: string
  ): React.ComponentType<P> {
    const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';
    const profiler = this;

    return class ProfiledComponent extends React.Component<P> {
      componentDidMount() {
        profiler.onComponentMount(displayName);
      }

      componentWillUnmount() {
        profiler.onComponentUnmount(displayName);
      }

      shouldComponentUpdate(nextProps: P) {
        // Simple props comparison for unnecessary render detection
        if (JSON.stringify(this.props) === JSON.stringify(nextProps)) {
          profiler.trackUnnecessaryRender(displayName, 'Props unchanged');
          return false;
        }
        return true;
      }

      render() {
        profiler.startRender(displayName, this.props);
        
        const element = React.createElement(WrappedComponent, this.props);
        
        // Use setTimeout to ensure render completion measurement
        setTimeout(() => {
          const childCount = React.isValidElement(element) && element.props && 'children' in element.props
            ? React.Children.count((element.props as any).children)
            : 0;
          profiler.endRender(displayName, childCount);
        }, 0);

        return element;
      }
    } as React.ComponentType<P>;
  }

  /**
   * React hook for component profiling
   */
  useComponentProfiling(componentName: string, dependencies?: React.DependencyList): void {
    React.useEffect(() => {
      this.onComponentMount(componentName);
      return () => this.onComponentUnmount(componentName);
    }, []);

    React.useEffect(() => {
      this.startRender(componentName);
      
      const endRender = () => this.endRender(componentName);
      
      // Schedule render end measurement
      const timeoutId = setTimeout(endRender, 0);
      
      return () => clearTimeout(timeoutId);
    }, dependencies);
  }

  /**
   * Monitor frame rate and performance
   */
  startFrameRateMonitoring(): () => void {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFrame = () => {
      frameCount++;
      const now = performance.now();
      
      if (now - lastTime >= 1000) {
        const fps = frameCount;
        frameCount = 0;
        lastTime = now;
        
        if (fps < 55) { // Below 55 FPS
          console.warn(`Low frame rate detected: ${fps} FPS`);
        }
      }
      
      animationId = requestAnimationFrame(measureFrame);
    };

    animationId = requestAnimationFrame(measureFrame);

    return () => cancelAnimationFrame(animationId);
  }

  // Private helper methods

  private addRenderProfile(profile: RenderProfile): void {
    this.renderProfiles.push(profile);
    
    // Keep history limited
    if (this.renderProfiles.length > this.maxProfileHistory) {
      this.renderProfiles.shift();
    }
  }

  private estimateComponentMemory(componentName: string, childCount: number): number {
    // Simplified memory estimation
    const baseMemory = 1024; // 1KB base
    const childMemory = childCount * 512; // 512B per child
    const nameMemory = componentName.length * 2; // 2B per character
    
    return baseMemory + childMemory + nameMemory;
  }

  private calculateMemoryPressure(): number {
    const totalMemory = Array.from(this.metrics.values())
      .reduce((sum, metrics) => sum + metrics.memoryUsage, 0);
    
    return Math.min(1, totalMemory / this.memoryThreshold);
  }

  private calculateGlobalAverageRenderTime(): number {
    const allMetrics = Array.from(this.metrics.values());
    
    if (allMetrics.length === 0) return 0;
    
    const totalTime = allMetrics.reduce((sum, metrics) => sum + metrics.totalRenderTime, 0);
    const totalRenders = allMetrics.reduce((sum, metrics) => sum + metrics.renderCount, 0);
    
    return totalRenders > 0 ? totalTime / totalRenders : 0;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const slowComponents = this.getSlowComponents();
    const problematicComponents = this.getProblematicComponents();

    if (slowComponents.length > 0) {
      recommendations.push(
        `Consider optimizing ${slowComponents.length} slow-rendering components. ` +
        `Top offender: ${slowComponents[0].name} (${slowComponents[0].averageRenderTime.toFixed(2)}ms avg)`
      );
    }

    if (problematicComponents.length > 0) {
      recommendations.push(
        `${problematicComponents.length} components have unnecessary re-renders. ` +
        `Consider using React.memo, useMemo, or useCallback for optimization.`
      );
    }

    const globalAverage = this.calculateGlobalAverageRenderTime();
    if (globalAverage > 10) {
      recommendations.push(
        `Global average render time (${globalAverage.toFixed(2)}ms) is high. ` +
        `Consider component splitting and virtualization for lists.`
      );
    }

    const memoryPressure = this.calculateMemoryPressure();
    if (memoryPressure > 0.7) {
      recommendations.push(
        'High memory usage detected in components. ' +
        'Consider implementing component cleanup and reducing data retention.'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Component performance looks good! No major issues detected.');
    }

    return recommendations;
  }
}

// Singleton instance
export const componentProfiler = new ComponentProfiler();

// Convenience hooks and HOCs
export const useComponentProfiling = (
  componentName: string, 
  dependencies?: React.DependencyList
) => {
  componentProfiler.useComponentProfiling(componentName, dependencies);
};

export const withProfiling = <P extends object>(
  Component: React.ComponentType<P>,
  name?: string
) => componentProfiler.withProfiling(Component, name);