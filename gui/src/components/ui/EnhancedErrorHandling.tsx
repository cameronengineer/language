/**
 * EnhancedErrorHandling - Improved error messaging and recovery flows
 * Provides comprehensive error handling with user-friendly recovery options
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Alert,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { MicroInteractionButton } from './MicroInteractions';
import { LoadingSpinner } from './EnhancedLoadingStates';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

interface ErrorDisplayProps {
  error: Error | string;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryable?: boolean;
  style?: ViewStyle;
  variant?: 'banner' | 'modal' | 'inline';
}

interface NetworkErrorProps {
  onRetry: () => Promise<void>;
  message?: string;
  showOfflineIndicator?: boolean;
}

interface ValidationErrorProps {
  errors: Record<string, string>;
  onFieldFocus?: (field: string) => void;
  style?: ViewStyle;
}

interface ErrorToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
  type?: 'error' | 'warning' | 'info';
  duration?: number;
}

interface FallbackErrorProps {
  error: Error;
  resetError: () => void;
  componentStack?: string;
}

/**
 * Error Boundary Component
 */
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<FallbackErrorProps> },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({ errorInfo });
    
    // Log error to monitoring service
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // Report to crash analytics
    this.reportError(error, errorInfo);
  }

  reportError = (error: Error, errorInfo: any) => {
    // In production, report to Sentry, Bugsnag, etc.
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
    };
    
    console.error('Error reported:', errorData);
  };

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error!}
          resetError={this.resetError}
          componentStack={this.state.errorInfo?.componentStack}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default Error Fallback Component
 */
const DefaultErrorFallback: React.FC<FallbackErrorProps> = ({
  error,
  resetError,
  componentStack,
}) => {
  return (
    <View style={styles.errorFallback}>
      <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
      <Text style={styles.errorMessage}>
        We encountered an unexpected error. Don't worry, we've been notified and are working on a fix.
      </Text>
      
      {__DEV__ && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugTitle}>Debug Info:</Text>
          <Text style={styles.debugText}>{error.message}</Text>
          {componentStack && (
            <Text style={styles.debugText}>{componentStack}</Text>
          )}
        </View>
      )}
      
      <MicroInteractionButton
        onPress={resetError}
        style={styles.retryButton}
        hapticFeedback="medium"
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </MicroInteractionButton>
    </View>
  );
};

/**
 * General Error Display Component
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  retryable = true,
  style,
  variant = 'inline',
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (variant === 'banner') {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, []);

  const errorMessage = typeof error === 'string' ? error : error.message;

  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRetry?.();
  };

  const handleDismiss = () => {
    onDismiss?.();
  };

  const containerStyle = [
    styles.errorContainer,
    variant === 'banner' && styles.errorBanner,
    variant === 'modal' && styles.errorModal,
    style,
  ];

  const animatedStyle = variant === 'banner' 
    ? { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
    : { opacity: fadeAnim };

  return (
    <Animated.View style={[containerStyle, animatedStyle]}>
      <View style={styles.errorContent}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <View style={styles.errorTextContainer}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      </View>
      
      <View style={styles.errorActions}>
        {retryable && onRetry && (
          <TouchableOpacity onPress={handleRetry} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Retry</Text>
          </TouchableOpacity>
        )}
        
        {onDismiss && (
          <TouchableOpacity onPress={handleDismiss} style={styles.dismissButton}>
            <Text style={styles.dismissButtonText}>Dismiss</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

/**
 * Network Error Component
 */
export const NetworkError: React.FC<NetworkErrorProps> = ({
  onRetry,
  message = "Network connection failed",
  showOfflineIndicator = true,
}) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <View style={styles.networkError}>
      {showOfflineIndicator && (
        <View style={styles.offlineIndicator}>
          <Text style={styles.offlineText}>📶 No Connection</Text>
        </View>
      )}
      
      <Text style={styles.networkErrorTitle}>Connection Problem</Text>
      <Text style={styles.networkErrorMessage}>{message}</Text>
      
      <MicroInteractionButton
        onPress={handleRetry}
        disabled={isRetrying}
        style={[styles.retryButton, isRetrying && styles.retryButtonDisabled]}
        hapticFeedback="medium"
      >
        {isRetrying ? (
          <LoadingSpinner size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.retryButtonText}>Retry Connection</Text>
        )}
      </MicroInteractionButton>
    </View>
  );
};

/**
 * Validation Error Component
 */
export const ValidationError: React.FC<ValidationErrorProps> = ({
  errors,
  onFieldFocus,
  style,
}) => {
  const errorFields = Object.entries(errors);

  if (errorFields.length === 0) return null;

  return (
    <View style={[styles.validationErrors, style]}>
      <Text style={styles.validationTitle}>Please fix the following errors:</Text>
      {errorFields.map(([field, message]) => (
        <TouchableOpacity
          key={field}
          onPress={() => onFieldFocus?.(field)}
          style={styles.validationError}
        >
          <Text style={styles.validationErrorText}>• {message}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

/**
 * Error Toast Component
 */
export const ErrorToast: React.FC<ErrorToastProps> = ({
  message,
  visible,
  onHide,
  type = 'error',
  duration = 4000,
}) => {
  const translateAnim = React.useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.timing(translateAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onHide();
    });
  };

  if (!visible) return null;

  const toastStyles = [
    styles.toast,
    type === 'error' && styles.toastError,
    type === 'warning' && styles.toastWarning,
    type === 'info' && styles.toastInfo,
  ];

  return (
    <Animated.View
      style={[
        toastStyles,
        {
          transform: [{ translateY: translateAnim }],
        },
      ]}
    >
      <Text style={styles.toastText}>{message}</Text>
      <TouchableOpacity onPress={hideToast} style={styles.toastClose}>
        <Text style={styles.toastCloseText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

/**
 * Critical Error Handler
 */
export const handleCriticalError = (error: Error, context?: string) => {
  console.error('Critical error:', error);
  
  Alert.alert(
    'Critical Error',
    'A critical error has occurred. The app will need to restart.',
    [
      {
        text: 'Restart App',
        onPress: () => {
          // In production, this would restart the app
          console.log('App restart requested');
        },
      },
    ]
  );
};

/**
 * Graceful degradation helper
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<FallbackErrorProps>
) => {
  return (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  errorFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8F9FA',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  debugInfo: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#6C757D',
    fontFamily: 'monospace',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonDisabled: {
    backgroundColor: '#6C757D',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFEAA7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    margin: 16,
  },
  errorBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    margin: 0,
    borderRadius: 0,
  },
  errorModal: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  errorIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  errorTextContainer: {
    flex: 1,
  },
  errorText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  errorActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  dismissButtonText: {
    color: '#6C757D',
    fontSize: 14,
  },
  networkError: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8F9FA',
  },
  offlineIndicator: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  offlineText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  networkErrorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 8,
  },
  networkErrorMessage: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 24,
  },
  validationErrors: {
    backgroundColor: '#F8D7DA',
    borderColor: '#F5C6CB',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    margin: 16,
  },
  validationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#721C24',
    marginBottom: 12,
  },
  validationError: {
    paddingVertical: 4,
  },
  validationErrorText: {
    fontSize: 14,
    color: '#721C24',
  },
  toast: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1001,
  },
  toastError: {
    backgroundColor: '#F8D7DA',
    borderColor: '#F5C6CB',
    borderWidth: 1,
  },
  toastWarning: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFEAA7',
    borderWidth: 1,
  },
  toastInfo: {
    backgroundColor: '#D1ECF1',
    borderColor: '#BEE5EB',
    borderWidth: 1,
  },
  toastText: {
    flex: 1,
    fontSize: 14,
    color: '#495057',
  },
  toastClose: {
    padding: 4,
  },
  toastCloseText: {
    fontSize: 16,
    color: '#6C757D',
  },
});

export default {
  ErrorBoundary,
  ErrorDisplay,
  NetworkError,
  ValidationError,
  ErrorToast,
  handleCriticalError,
  withErrorBoundary,
};