/**
 * UI Components Index
 * Exports all reusable UI components for easy importing
 */

// Basic UI Components
export { ThemedText } from './themed-text';
export { ThemedView } from './themed-view';
export { ExternalLink } from './external-link';
export { HapticTab } from './haptic-tab';
export { HelloWave } from './hello-wave';

// Icon System
export { IconSymbol } from './ui/icon-symbol';

// Language Learning Specific Components
export { LanguageFlag } from './LanguageFlag';
export { LanguageGrid } from './LanguageGrid';
export { StatisticBox } from './StatisticBox';
export { PracticeButton } from './PracticeButton';
export { LoadingSpinner } from './LoadingSpinner';
export { ErrorMessage } from './ErrorMessage';
export { ProgressChart } from './ProgressChart';

// Audio Components
export { default as VolumeControl } from './VolumeControl';
export { default as AudioSettings } from './AudioSettings';
export { default as AudioErrorHandler } from './AudioErrorHandler';

// Animation Components
export {
  AnimatedView,
  FadeInView,
  SlideInView,
  ScaleInView,
  BounceInView,
  ShakeView,
  LayoutTransitionView,
  AnimatedLayoutView
} from './AnimatedView';

// Feedback Components
export { Toast, ToastContainer, toastManager, useToast } from './Toast';

// UI Foundation Elements
export { Header } from './Header';
export { Modal } from './Modal';
export { Card } from './Card';
export { Input } from './Input';

// UI Kit Components
export { Collapsible } from './ui/collapsible';

// Re-export types
export type { ThemedTextProps } from './themed-text';
export type { ThemedViewProps } from './themed-view';