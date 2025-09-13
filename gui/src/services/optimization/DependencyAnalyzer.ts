/**
 * DependencyAnalyzer - Audit and optimize package dependencies
 * Analyzes bundle size impact and suggests optimizations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

interface DependencyInfo {
  name: string;
  version: string;
  size: number;
  gzippedSize: number;
  dependencies: string[];
  devDependency: boolean;
  lastAnalyzed: number;
  importCount: number;
  treeShakeable: boolean;
  alternatives: Alternative[];
}

interface Alternative {
  name: string;
  size: number;
  description: string;
  compatibilityScore: number;
}

interface BundleAnalysis {
  totalSize: number;
  gzippedSize: number;
  dependencies: DependencyInfo[];
  largeDependencies: DependencyInfo[];
  unusedDependencies: string[];
  duplicatedDependencies: string[];
  optimizationOpportunities: OptimizationOpportunity[];
}

interface OptimizationOpportunity {
  type: 'replace' | 'remove' | 'tree-shake' | 'code-split';
  dependency: string;
  impact: 'high' | 'medium' | 'low';
  estimatedSavings: number;
  description: string;
  action: string;
}

interface ImportUsage {
  dependency: string;
  importPath: string;
  usedExports: string[];
  totalExports: string[];
  usageRatio: number;
}

export class DependencyAnalyzer {
  private dependencies: Map<string, DependencyInfo> = new Map();
  private importUsage: Map<string, ImportUsage> = new Map();
  private bundleHistory: BundleAnalysis[] = [];
  private readonly STORAGE_KEY = 'dependencyAnalysis';
  private readonly PACKAGE_JSON_PATH = 'package.json';

  /**
   * Analyze all dependencies in the project
   */
  async analyzeDependencies(): Promise<BundleAnalysis> {
    console.log('Starting dependency analysis...');

    try {
      // Load package.json to get dependency list
      const packageInfo = await this.loadPackageJson();
      
      // Analyze each dependency
      for (const [name, version] of Object.entries({
        ...packageInfo.dependencies,
        ...packageInfo.devDependencies,
      })) {
        await this.analyzeDependency(name, version as string, packageInfo.devDependencies[name] !== undefined);
      }

      // Detect import usage patterns
      await this.analyzeImportUsage();

      // Generate analysis report
      const analysis = this.generateBundleAnalysis();
      
      // Store results
      await this.storeBundleAnalysis(analysis);
      
      console.log('Dependency analysis completed');
      return analysis;

    } catch (error) {
      console.error('Failed to analyze dependencies:', error);
      throw error;
    }
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = [];

    // Check for large dependencies
    for (const [name, info] of this.dependencies) {
      if (info.size > 500000) { // > 500KB
        opportunities.push({
          type: 'replace',
          dependency: name,
          impact: 'high',
          estimatedSavings: info.size * 0.6, // Assume 60% savings with alternative
          description: `${name} is large (${this.formatSize(info.size)}). Consider lighter alternatives.`,
          action: `Replace ${name} with a lighter alternative or implement tree shaking`,
        });
      }
    }

    // Check for unused exports
    for (const [name, usage] of this.importUsage) {
      if (usage.usageRatio < 0.2) { // Using less than 20% of exports
        const dependency = this.dependencies.get(name);
        if (dependency) {
          opportunities.push({
            type: 'tree-shake',
            dependency: name,
            impact: 'medium',
            estimatedSavings: dependency.size * (1 - usage.usageRatio),
            description: `Only using ${Math.round(usage.usageRatio * 100)}% of ${name} exports`,
            action: `Implement tree shaking or use specific imports for ${name}`,
          });
        }
      }
    }

    // Check for code splitting opportunities
    const largeDependencies = Array.from(this.dependencies.values())
      .filter(dep => dep.size > 200000 && dep.importCount < 3); // Large but rarely used

    largeDependencies.forEach(dep => {
      opportunities.push({
        type: 'code-split',
        dependency: dep.name,
        impact: 'medium',
        estimatedSavings: dep.size, // Full size savings for initial bundle
        description: `${dep.name} is large but infrequently used`,
        action: `Implement dynamic import for ${dep.name}`,
      });
    });

    return opportunities.sort((a, b) => b.estimatedSavings - a.estimatedSavings);
  }

  /**
   * Generate lightweight alternatives suggestions
   */
  suggestAlternatives(dependencyName: string): Alternative[] {
    const alternatives: Record<string, Alternative[]> = {
      'lodash': [
        {
          name: 'lodash-es',
          size: 100000,
          description: 'Tree-shakeable version of lodash',
          compatibilityScore: 95,
        },
        {
          name: 'ramda',
          size: 120000,
          description: 'Functional programming utility library',
          compatibilityScore: 80,
        },
      ],
      'moment': [
        {
          name: 'dayjs',
          size: 8000,
          description: 'Lightweight alternative to moment.js',
          compatibilityScore: 90,
        },
        {
          name: 'date-fns',
          size: 15000,
          description: 'Modular date utility library',
          compatibilityScore: 85,
        },
      ],
      'axios': [
        {
          name: 'fetch',
          size: 0,
          description: 'Native fetch API (no additional bundle size)',
          compatibilityScore: 80,
        },
        {
          name: 'ky',
          size: 25000,
          description: 'Tiny and elegant HTTP client',
          compatibilityScore: 85,
        },
      ],
      'react-native-vector-icons': [
        {
          name: '@expo/vector-icons',
          size: 50000,
          description: 'Expo optimized vector icons',
          compatibilityScore: 95,
        },
        {
          name: 'react-native-svg',
          size: 80000,
          description: 'Custom SVG icons (smaller subset)',
          compatibilityScore: 90,
        },
      ],
    };

    return alternatives[dependencyName] || [];
  }

  /**
   * Track import usage for a dependency
   */
  trackImportUsage(dependency: string, importPath: string, usedExports: string[]): void {
    // Simulate export detection (in real implementation, would analyze source)
    const totalExports = this.estimateExportsForDependency(dependency);
    
    const usage: ImportUsage = {
      dependency,
      importPath,
      usedExports,
      totalExports,
      usageRatio: usedExports.length / totalExports.length,
    };

    this.importUsage.set(dependency, usage);
  }

  /**
   * Get bundle size trends over time
   */
  getBundleTrends(): {
    timestamps: number[];
    totalSizes: number[];
    gzippedSizes: number[];
    dependencyCount: number[];
  } {
    return {
      timestamps: this.bundleHistory.map(analysis => Date.now()), // Simplified
      totalSizes: this.bundleHistory.map(analysis => analysis.totalSize),
      gzippedSizes: this.bundleHistory.map(analysis => analysis.gzippedSize),
      dependencyCount: this.bundleHistory.map(analysis => analysis.dependencies.length),
    };
  }

  /**
   * Generate tree shaking report
   */
  generateTreeShakingReport(): {
    dependencies: {
      name: string;
      treeshakeable: boolean;
      unusedExports: string[];
      potentialSavings: number;
    }[];
    totalPotentialSavings: number;
  } {
    const dependencies = Array.from(this.dependencies.values()).map(dep => {
      const usage = this.importUsage.get(dep.name);
      const unusedExports = usage 
        ? usage.totalExports.filter(exp => !usage.usedExports.includes(exp))
        : [];
      
      const potentialSavings = usage
        ? dep.size * (1 - usage.usageRatio)
        : 0;

      return {
        name: dep.name,
        treeshakeable: dep.treeShakeable,
        unusedExports,
        potentialSavings,
      };
    });

    const totalPotentialSavings = dependencies.reduce(
      (total, dep) => total + dep.potentialSavings, 
      0
    );

    return {
      dependencies: dependencies.filter(dep => dep.potentialSavings > 0),
      totalPotentialSavings,
    };
  }

  /**
   * Generate code splitting suggestions
   */
  generateCodeSplittingPlan(): {
    chunks: {
      name: string;
      dependencies: string[];
      size: number;
      loadTiming: 'eager' | 'lazy' | 'prefetch';
      priority: 'high' | 'medium' | 'low';
    }[];
    estimatedSavings: number;
  } {
    const chunks = [
      {
        name: 'core',
        dependencies: this.getCoreDependendies(),
        size: this.calculateChunkSize(this.getCoreDependendies()),
        loadTiming: 'eager' as const,
        priority: 'high' as const,
      },
      {
        name: 'ui',
        dependencies: this.getUIDependendies(),
        size: this.calculateChunkSize(this.getUIDependendies()),
        loadTiming: 'prefetch' as const,
        priority: 'medium' as const,
      },
      {
        name: 'charts',
        dependencies: this.getChartDependendies(),
        size: this.calculateChunkSize(this.getChartDependendies()),
        loadTiming: 'lazy' as const,
        priority: 'low' as const,
      },
      {
        name: 'analytics',
        dependencies: this.getAnalyticsDependendies(),
        size: this.calculateChunkSize(this.getAnalyticsDependendies()),
        loadTiming: 'lazy' as const,
        priority: 'low' as const,
      },
    ];

    const lazyChunksSize = chunks
      .filter(chunk => chunk.loadTiming === 'lazy')
      .reduce((total, chunk) => total + chunk.size, 0);

    return {
      chunks,
      estimatedSavings: lazyChunksSize, // Initial bundle size reduction
    };
  }

  /**
   * Get detailed dependency report
   */
  getDependencyReport(): {
    summary: {
      totalDependencies: number;
      totalSize: number;
      gzippedSize: number;
      averageSize: number;
    };
    largest: DependencyInfo[];
    treeshakeable: DependencyInfo[];
    opportunities: OptimizationOpportunity[];
    alternatives: { [key: string]: Alternative[] };
  } {
    const dependencies = Array.from(this.dependencies.values());
    const totalSize = dependencies.reduce((sum, dep) => sum + dep.size, 0);
    const gzippedSize = dependencies.reduce((sum, dep) => sum + dep.gzippedSize, 0);

    return {
      summary: {
        totalDependencies: dependencies.length,
        totalSize,
        gzippedSize,
        averageSize: totalSize / dependencies.length,
      },
      largest: dependencies
        .sort((a, b) => b.size - a.size)
        .slice(0, 10),
      treeshakeable: dependencies.filter(dep => dep.treeShakeable),
      opportunities: this.getOptimizationRecommendations(),
      alternatives: this.getAllAlternatives(),
    };
  }

  // Private helper methods

  private async loadPackageJson(): Promise<any> {
    // Simulate loading package.json
    // In real implementation, would read from file system
    return {
      dependencies: {
        '@expo/vector-icons': '^15.0.2',
        '@react-native-async-storage/async-storage': '^2.2.0',
        '@react-native-community/slider': '^5.0.1',
        'axios': '^1.12.0',
        'expo': '~54.0.2',
        'react': '19.1.0',
        'react-native': '0.81.4',
        'zustand': '^5.0.8',
      },
      devDependencies: {
        '@testing-library/jest-native': '^5.4.3',
        '@testing-library/react-native': '^13.3.3',
        '@types/jest': '^30.0.0',
        'eslint': '^9.25.0',
        'jest': '^30.1.3',
        'typescript': '~5.9.2',
      },
    };
  }

  private async analyzeDependency(name: string, version: string, isDevDependency: boolean): Promise<void> {
    // Simulate dependency analysis
    // In real implementation, would analyze actual dependency sizes
    const mockSize = Math.random() * 1000000 + 10000; // 10KB - 1MB
    const mockGzippedSize = mockSize * 0.3; // Assume 30% compression
    
    const dependencyInfo: DependencyInfo = {
      name,
      version,
      size: mockSize,
      gzippedSize: mockGzippedSize,
      dependencies: [], // Would be populated from actual analysis
      devDependency: isDevDependency,
      lastAnalyzed: Date.now(),
      importCount: Math.floor(Math.random() * 10) + 1,
      treeShakeable: this.isTreeShakeable(name),
      alternatives: this.suggestAlternatives(name),
    };

    this.dependencies.set(name, dependencyInfo);
  }

  private async analyzeImportUsage(): Promise<void> {
    // Simulate import usage analysis
    // In real implementation, would scan source files for imports
    for (const [name] of this.dependencies) {
      const mockUsedExports = ['default', 'someFunction', 'SomeComponent'];
      const mockTotalExports = this.estimateExportsForDependency(name);
      
      this.trackImportUsage(name, `from '${name}'`, mockUsedExports);
    }
  }

  private generateBundleAnalysis(): BundleAnalysis {
    const dependencies = Array.from(this.dependencies.values());
    const totalSize = dependencies.reduce((sum, dep) => sum + dep.size, 0);
    const gzippedSize = dependencies.reduce((sum, dep) => sum + dep.gzippedSize, 0);

    const largeDependencies = dependencies
      .filter(dep => dep.size > 100000) // > 100KB
      .sort((a, b) => b.size - a.size);

    const unusedDependencies = dependencies
      .filter(dep => dep.importCount === 0)
      .map(dep => dep.name);

    const duplicatedDependencies = this.findDuplicatedDependencies();

    const optimizationOpportunities = this.getOptimizationRecommendations();

    return {
      totalSize,
      gzippedSize,
      dependencies,
      largeDependencies,
      unusedDependencies,
      duplicatedDependencies,
      optimizationOpportunities,
    };
  }

  private isTreeShakeable(dependencyName: string): boolean {
    // Known tree-shakeable libraries
    const treeShakeableLibs = [
      'lodash-es',
      'ramda',
      'date-fns',
      'rxjs',
      '@expo/vector-icons',
    ];

    return treeShakeableLibs.includes(dependencyName) || 
           dependencyName.includes('-es') ||
           dependencyName.startsWith('@');
  }

  private estimateExportsForDependency(dependencyName: string): string[] {
    // Simulate export estimation
    const mockExports: Record<string, string[]> = {
      'lodash': ['map', 'filter', 'reduce', 'forEach', 'find', 'sortBy', 'groupBy', 'uniq', 'flatten', 'debounce'],
      'axios': ['default', 'get', 'post', 'put', 'delete', 'patch', 'head', 'options'],
      'zustand': ['create', 'subscribeWithSelector', 'devtools', 'persist'],
      'react': ['useState', 'useEffect', 'useCallback', 'useMemo', 'Component', 'PureComponent'],
    };

    return mockExports[dependencyName] || ['default', 'someFunction', 'SomeComponent', 'utility1', 'utility2'];
  }

  private findDuplicatedDependencies(): string[] {
    // Simulate duplicate detection
    // In real implementation, would analyze dependency tree
    return ['react-native', '@types/react']; // Example duplicates
  }

  private getCoreDependendies(): string[] {
    return ['react', 'react-native', 'expo', 'zustand'];
  }

  private getUIDependendies(): string[] {
    return ['@expo/vector-icons', '@react-native-community/slider'];
  }

  private getChartDependendies(): string[] {
    return ['react-native-svg', 'victory-native']; // Hypothetical chart libs
  }

  private getAnalyticsDependendies(): string[] {
    return ['react-native-analytics', 'mixpanel-react-native']; // Hypothetical analytics libs
  }

  private calculateChunkSize(dependencies: string[]): number {
    return dependencies.reduce((total, depName) => {
      const dep = this.dependencies.get(depName);
      return total + (dep?.size || 0);
    }, 0);
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private getAllAlternatives(): { [key: string]: Alternative[] } {
    const alternatives: { [key: string]: Alternative[] } = {};
    
    for (const [name] of this.dependencies) {
      const alts = this.suggestAlternatives(name);
      if (alts.length > 0) {
        alternatives[name] = alts;
      }
    }

    return alternatives;
  }

  private async storeBundleAnalysis(analysis: BundleAnalysis): Promise<void> {
    try {
      this.bundleHistory.push(analysis);
      
      // Keep only last 10 analyses
      if (this.bundleHistory.length > 10) {
        this.bundleHistory.shift();
      }

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        dependencies: Array.from(this.dependencies.entries()),
        importUsage: Array.from(this.importUsage.entries()),
        bundleHistory: this.bundleHistory,
      }));
    } catch (error) {
      console.error('Failed to store bundle analysis:', error);
    }
  }

  /**
   * Load persisted analysis data
   */
  async loadPersistedData(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.dependencies = new Map(data.dependencies || []);
        this.importUsage = new Map(data.importUsage || []);
        this.bundleHistory = data.bundleHistory || [];
      }
    } catch (error) {
      console.error('Failed to load persisted dependency analysis:', error);
    }
  }
}

// Singleton instance
export const dependencyAnalyzer = new DependencyAnalyzer();