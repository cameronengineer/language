import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  SlideInUp,
  SlideOutUp,
} from 'react-native-reanimated';
import { COLORS } from '@/src/utils/constants';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss?: () => void;
  actionText?: string;
  onAction?: () => void;
  position?: 'top' | 'bottom';
}

const { width } = Dimensions.get('window');

const toastConfig = {
  success: {
    backgroundColor: COLORS.SUCCESS,
    icon: '✓',
    textColor: 'white',
  },
  error: {
    backgroundColor: COLORS.ERROR,
    icon: '✕',
    textColor: 'white',
  },
  warning: {
    backgroundColor: COLORS.WARNING,
    icon: '⚠',
    textColor: 'white',
  },
  info: {
    backgroundColor: COLORS.INFO,
    icon: 'ℹ',
    textColor: 'white',
  },
};

export function Toast({
  message,
  type = 'info',
  duration = 4000,
  onDismiss,
  actionText,
  onAction,
  position = 'top',
}: ToastProps) {
  const config = toastConfig[type];

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onDismiss?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  const handleAction = () => {
    onAction?.();
    onDismiss?.();
  };

  return (
    <Animated.View
      entering={SlideInUp.springify().damping(15).stiffness(150)}
      exiting={SlideOutUp.springify().damping(15).stiffness(150)}
      style={[
        styles.container,
        { backgroundColor: config.backgroundColor },
        position === 'bottom' && styles.bottomPosition,
      ]}
    >
      <View style={styles.content}>
        <View style={styles.messageContainer}>
          <Text style={styles.icon}>{config.icon}</Text>
          <Text style={[styles.message, { color: config.textColor }]}>
            {message}
          </Text>
        </View>
        
        {actionText && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleAction}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionText, { color: config.textColor }]}>
              {actionText}
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={onDismiss}
          activeOpacity={0.7}
        >
          <Text style={[styles.dismissText, { color: config.textColor }]}>
            ✕
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// Toast Manager for global toast handling
class ToastManager {
  private static instance: ToastManager;
  private toasts: Map<string, ToastProps & { id: string }> = new Map();
  private listeners: Set<(toasts: Array<ToastProps & { id: string }>) => void> = new Set();

  private constructor() {}

  static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  show(toast: ToastProps): string {
    const id = Date.now().toString();
    const toastWithId = { ...toast, id };
    
    this.toasts.set(id, toastWithId);
    this.notifyListeners();
    
    return id;
  }

  dismiss(id: string): void {
    this.toasts.delete(id);
    this.notifyListeners();
  }

  dismissAll(): void {
    this.toasts.clear();
    this.notifyListeners();
  }

  subscribe(listener: (toasts: Array<ToastProps & { id: string }>) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const toastArray = Array.from(this.toasts.values());
    this.listeners.forEach(listener => listener(toastArray));
  }

  // Convenience methods
  success(message: string, options?: Partial<ToastProps>): string {
    return this.show({ message, type: 'success', ...options });
  }

  error(message: string, options?: Partial<ToastProps>): string {
    return this.show({ message, type: 'error', ...options });
  }

  warning(message: string, options?: Partial<ToastProps>): string {
    return this.show({ message, type: 'warning', ...options });
  }

  info(message: string, options?: Partial<ToastProps>): string {
    return this.show({ message, type: 'info', ...options });
  }
}

export const toastManager = ToastManager.getInstance();

// Hook for using toast in components
export function useToast() {
  return {
    success: (message: string, options?: Partial<ToastProps>) => 
      toastManager.success(message, options),
    error: (message: string, options?: Partial<ToastProps>) => 
      toastManager.error(message, options),
    warning: (message: string, options?: Partial<ToastProps>) => 
      toastManager.warning(message, options),
    info: (message: string, options?: Partial<ToastProps>) => 
      toastManager.info(message, options),
    dismiss: (id: string) => toastManager.dismiss(id),
    dismissAll: () => toastManager.dismissAll(),
  };
}

// Toast Container Component
export function ToastContainer() {
  const [toasts, setToasts] = React.useState<Array<ToastProps & { id: string }>>([]);

  React.useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    return unsubscribe;
  }, []);

  return (
    <View style={styles.toastContainer} pointerEvents="box-none">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onDismiss={() => toastManager.dismiss(toast.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bottomPosition: {
    top: undefined,
    bottom: 100,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  messageContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 16,
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  actionButton: {
    marginLeft: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButton: {
    marginLeft: 12,
    padding: 4,
  },
  dismissText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});