/**
 * Production Configuration - Environment management and production settings
 * Handles different environments and production-ready configurations
 */

import Constants from 'expo-constants';

// Optional import for expo-updates
let Updates: any = null;
try {
  Updates = require('expo-updates');
} catch (error) {
  console.warn('expo-updates not available');
}

export type Environment = 'development' | 'staging' | 'production';

interface EnvironmentConfig {
  API_BASE_URL: string;
  WS_BASE_URL: string;
  SENTRY_DSN?: string;
  ANALYTICS_TRACKING_ID?: string;
  BUGSNAG_API_KEY?: string;
  MIXPANEL_TOKEN?: string;
  AMPLITUDE_API_KEY?: string;
  PERFORMANCE_MONITORING: boolean;
  DEBUG_MODE: boolean;
  CACHE_TTL: number;
  MAX_RETRY_ATTEMPTS: number;
  REQUEST_TIMEOUT: number;
  ENABLE_FLIPPER: boolean;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  FEATURES: {
    OFFLINE_MODE: boolean;
    PUSH_NOTIFICATIONS: boolean;
    ANALYTICS: boolean;
    CRASH_REPORTING: boolean;
    PERFORMANCE_MONITORING: boolean;
    BETA_FEATURES: boolean;
  };
}

interface BuildInfo {
  version: string;
  buildNumber: string;
  buildDate: string;
  commitHash: string;
  environment: Environment;
  channel: string;
  platform: 'ios' | 'android' | 'web';
}

class ProductionConfig {
  private readonly environment: Environment;
  private readonly config: EnvironmentConfig;
  private readonly buildInfo: BuildInfo;

  constructor() {
    this.environment = this.detectEnvironment();
    this.config = this.loadEnvironmentConfig();
    this.buildInfo = this.generateBuildInfo();

    this.validateConfiguration();
    this.setupGlobalErrorHandling();
    this.setupPerformanceMonitoring();
  }

  /**
   * Detect current environment
   */
  private detectEnvironment(): Environment {
    // Check for explicit environment variable
    if (__DEV__) {
      return 'development';
    }

    // Check Expo environment
    if (Constants.manifest?.releaseChannel) {
      if (Constants.manifest.releaseChannel.includes('staging')) {
        return 'staging';
      }
      return 'production';
    }

    // Check for production indicators
    if (Constants.appOwnership) {
      return 'production';
    }

    return 'development';
  }

  /**
   * Load configuration based on environment
   */
  private loadEnvironmentConfig(): EnvironmentConfig {
    const baseConfig: EnvironmentConfig = {
      API_BASE_URL: '',
      WS_BASE_URL: '',
      PERFORMANCE_MONITORING: false,
      DEBUG_MODE: false,
      CACHE_TTL: 300000, // 5 minutes
      MAX_RETRY_ATTEMPTS: 3,
      REQUEST_TIMEOUT: 10000,
      ENABLE_FLIPPER: false,
      LOG_LEVEL: 'info',
      FEATURES: {
        OFFLINE_MODE: true,
        PUSH_NOTIFICATIONS: true,
        ANALYTICS: true,
        CRASH_REPORTING: true,
        PERFORMANCE_MONITORING: true,
        BETA_FEATURES: false,
      },
    };

    switch (this.environment) {
      case 'development':
        return {
          ...baseConfig,
          API_BASE_URL: 'http://localhost:8000/api',
          WS_BASE_URL: 'ws://localhost:8000/ws',
          DEBUG_MODE: true,
          ENABLE_FLIPPER: true,
          LOG_LEVEL: 'debug',
          PERFORMANCE_MONITORING: true,
          FEATURES: {
            ...baseConfig.FEATURES,
            BETA_FEATURES: true,
            CRASH_REPORTING: false, // Don't send crashes in dev
          },
        };

      case 'staging':
        return {
          ...baseConfig,
          API_BASE_URL: 'https://staging-api.languageapp.com/api',
          WS_BASE_URL: 'wss://staging-api.languageapp.com/ws',
          SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN_STAGING,
          ANALYTICS_TRACKING_ID: process.env.EXPO_PUBLIC_ANALYTICS_STAGING,
          DEBUG_MODE: true,
          LOG_LEVEL: 'debug',
          PERFORMANCE_MONITORING: true,
          FEATURES: {
            ...baseConfig.FEATURES,
            BETA_FEATURES: true,
          },
        };

      case 'production':
        return {
          ...baseConfig,
          API_BASE_URL: 'https://api.languageapp.com/api',
          WS_BASE_URL: 'wss://api.languageapp.com/ws',
          SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
          ANALYTICS_TRACKING_ID: process.env.EXPO_PUBLIC_ANALYTICS_PROD,
          BUGSNAG_API_KEY: process.env.EXPO_PUBLIC_BUGSNAG_API_KEY,
          MIXPANEL_TOKEN: process.env.EXPO_PUBLIC_MIXPANEL_TOKEN,
          AMPLITUDE_API_KEY: process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY,
          LOG_LEVEL: 'warn',
          CACHE_TTL: 600000, // 10 minutes in production
          REQUEST_TIMEOUT: 15000, // Longer timeout for production
        };

      default:
        return baseConfig;
    }
  }

  /**
   * Generate build information
   */
  private generateBuildInfo(): BuildInfo {
    return {
      version: Constants.manifest?.version || '1.0.0',
      buildNumber: Constants.manifest?.revisionId || '1',
      buildDate: new Date().toISOString(),
      commitHash: Constants.manifest?.revisionId?.substring(0, 8) || 'unknown',
      environment: this.environment,
      channel: Constants.manifest?.releaseChannel || 'default',
      platform: Constants.platform?.ios ? 'ios' : 
                Constants.platform?.android ? 'android' : 'web',
    };
  }

  /**
   * Validate configuration for production readiness
   */
  private validateConfiguration(): void {
    const errors: string[] = [];

    // Check required production configurations
    if (this.environment === 'production') {
      if (!this.config.API_BASE_URL.startsWith('https://')) {
        errors.push('Production API URL must use HTTPS');
      }

      if (!this.config.SENTRY_DSN) {
        console.warn('No Sentry DSN configured for production');
      }

      if (this.config.DEBUG_MODE) {
        errors.push('Debug mode should be disabled in production');
      }

      if (this.config.LOG_LEVEL === 'debug') {
        errors.push('Log level should not be debug in production');
      }
    }

    // Check for development-only features in production
    if (this.environment === 'production' && this.config.ENABLE_FLIPPER) {
      errors.push('Flipper should be disabled in production');
    }

    if (errors.length > 0) {
      console.error('Configuration validation errors:', errors);
      if (this.environment === 'production') {
        throw new Error(`Production configuration errors: ${errors.join(', ')}`);
      }
    }
  }

  /**
   * Setup global error handling
   */
  private setupGlobalErrorHandling(): void {
    if (this.config.FEATURES.CRASH_REPORTING) {
      // Setup error reporting (Sentry, Bugsnag, etc.)
      this.setupErrorReporting();
    }

    // Setup unhandled promise rejection handler
    if (typeof global !== 'undefined' && global.addEventListener) {
      global.addEventListener('unhandledrejection', (event: any) => {
        console.error('Unhandled promise rejection:', event.reason);
        this.reportError(new Error(`Unhandled promise rejection: ${event.reason}`));
      });
    }

    // Setup error boundary fallback
    if (typeof global !== 'undefined') {
      (global as any).ErrorBoundaryFallback = (error: Error, errorInfo: any) => {
        console.error('React Error Boundary:', error, errorInfo);
        this.reportError(error, { errorInfo });
      };
    }
  }

  /**
   * Setup error reporting services
   */
  private setupErrorReporting(): void {
    // Sentry setup would go here
    if (this.config.SENTRY_DSN) {
      console.log('Sentry configured for environment:', this.environment);
      // Sentry.init({ dsn: this.config.SENTRY_DSN });
    }

    // Bugsnag setup would go here
    if (this.config.BUGSNAG_API_KEY) {
      console.log('Bugsnag configured for environment:', this.environment);
      // Bugsnag.start({ apiKey: this.config.BUGSNAG_API_KEY });
    }
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    if (this.config.PERFORMANCE_MONITORING) {
      // Performance monitoring setup would go here
      console.log('Performance monitoring enabled for environment:', this.environment);
    }

    // Analytics setup
    if (this.config.FEATURES.ANALYTICS) {
      this.setupAnalytics();
    }
  }

  /**
   * Setup analytics services
   */
  private setupAnalytics(): void {
    if (this.config.ANALYTICS_TRACKING_ID) {
      console.log('Analytics configured for environment:', this.environment);
      // Google Analytics, Firebase Analytics, etc.
    }

    if (this.config.MIXPANEL_TOKEN) {
      console.log('Mixpanel configured for environment:', this.environment);
      // Mixpanel setup
    }

    if (this.config.AMPLITUDE_API_KEY) {
      console.log('Amplitude configured for environment:', this.environment);
      // Amplitude setup
    }
  }

  /**
   * Report error to configured services
   */
  private reportError(error: Error, context?: any): void {
    if (!this.config.FEATURES.CRASH_REPORTING) return;

    const errorData = {
      message: error.message,
      stack: error.stack,
      environment: this.environment,
      buildInfo: this.buildInfo,
      context,
      timestamp: new Date().toISOString(),
    };

    // Report to error services
    console.error('Reporting error:', errorData);
    
    // In production, would send to Sentry, Bugsnag, etc.
    // Sentry.captureException(error, { extra: errorData });
  }

  /**
   * Get current environment
   */
  getEnvironment(): Environment {
    return this.environment;
  }

  /**
   * Get configuration value
   */
  get<K extends keyof EnvironmentConfig>(key: K): EnvironmentConfig[K] {
    return this.config[key];
  }

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(feature: keyof EnvironmentConfig['FEATURES']): boolean {
    return this.config.FEATURES[feature];
  }

  /**
   * Get build information
   */
  getBuildInfo(): BuildInfo {
    return { ...this.buildInfo };
  }

  /**
   * Get full configuration (for debugging)
   */
  getFullConfig(): EnvironmentConfig {
    if (this.environment === 'production') {
      // Don't expose sensitive config in production
      const { SENTRY_DSN, BUGSNAG_API_KEY, MIXPANEL_TOKEN, AMPLITUDE_API_KEY, ...safeConfig } = this.config;
      return { ...safeConfig, SENTRY_DSN: '***', BUGSNAG_API_KEY: '***', MIXPANEL_TOKEN: '***', AMPLITUDE_API_KEY: '***' } as EnvironmentConfig;
    }
    return { ...this.config };
  }

  /**
   * Check if running in development
   */
  isDevelopment(): boolean {
    return this.environment === 'development';
  }

  /**
   * Check if running in staging
   */
  isStaging(): boolean {
    return this.environment === 'staging';
  }

  /**
   * Check if running in production
   */
  isProduction(): boolean {
    return this.environment === 'production';
  }

  /**
   * Get appropriate log level
   */
  getLogLevel(): string {
    return this.config.LOG_LEVEL;
  }

  /**
   * Should enable debugging features
   */
  shouldEnableDebugging(): boolean {
    return this.config.DEBUG_MODE;
  }

  /**
   * Get cache TTL for environment
   */
  getCacheTTL(): number {
    return this.config.CACHE_TTL;
  }

  /**
   * Get API configuration
   */
  getApiConfig(): {
    baseURL: string;
    timeout: number;
    retryAttempts: number;
  } {
    return {
      baseURL: this.config.API_BASE_URL,
      timeout: this.config.REQUEST_TIMEOUT,
      retryAttempts: this.config.MAX_RETRY_ATTEMPTS,
    };
  }

  /**
   * Get WebSocket configuration
   */
  getWebSocketConfig(): {
    baseURL: string;
  } {
    return {
      baseURL: this.config.WS_BASE_URL,
    };
  }

  /**
   * Initialize app with environment-specific setup
   */
  async initializeApp(): Promise<void> {
    console.log(`Initializing app in ${this.environment} environment`);
    console.log('Build info:', this.buildInfo);

    // Check for OTA updates in production/staging
    if (this.environment !== 'development') {
      await this.checkForUpdates();
    }

    // Initialize error reporting
    if (this.config.FEATURES.CRASH_REPORTING) {
      console.log('Error reporting initialized');
    }

    // Initialize analytics
    if (this.config.FEATURES.ANALYTICS) {
      console.log('Analytics initialized');
    }

    // Initialize performance monitoring
    if (this.config.PERFORMANCE_MONITORING) {
      console.log('Performance monitoring initialized');
    }
  }

  /**
   * Check for OTA updates
   */
  private async checkForUpdates(): Promise<void> {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        console.log('Update available, downloading...');
        await Updates.fetchUpdateAsync();
        console.log('Update downloaded, will reload on next app start');
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  }
}

// Singleton instance
export const productionConfig = new ProductionConfig();

// Convenience exports
export const config = productionConfig;
export const isProduction = productionConfig.isProduction();
export const isDevelopment = productionConfig.isDevelopment();
export const isStaging = productionConfig.isStaging();
export const environment = productionConfig.getEnvironment();
export const buildInfo = productionConfig.getBuildInfo();