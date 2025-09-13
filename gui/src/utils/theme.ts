/**
 * Enhanced theme system for the Language Learning App
 * Includes language-specific colors, typography, spacing, and shadows
 */

import { Platform } from 'react-native';

// Base color palette
const tintColorLight = '#007AFF';
const tintColorDark = '#0A84FF';

// Language-specific color schemes
export const LanguageColors = {
  english: {
    primary: '#007AFF',
    secondary: '#5856D6',
    accent: '#FF3B30',
  },
  spanish: {
    primary: '#FF9500',
    secondary: '#FF2D92',
    accent: '#30B0C7',
  },
  german: {
    primary: '#5856D6',
    secondary: '#007AFF',
    accent: '#34C759',
  },
  italian: {
    primary: '#FF2D92',
    secondary: '#FF9500',
    accent: '#5AC8FA',
  },
  portuguese: {
    primary: '#34C759',
    secondary: '#30B0C7',
    accent: '#FF9500',
  },
  russian: {
    primary: '#FF3B30',
    secondary: '#5856D6',
    accent: '#FFCC00',
  },
  chinese: {
    primary: '#FF2D92',
    secondary: '#FF3B30',
    accent: '#FFCC00',
  },
  japanese: {
    primary: '#FF3B30',
    secondary: '#5856D6',
    accent: '#FF2D92',
  },
  korean: {
    primary: '#5856D6',
    secondary: '#30B0C7',
    accent: '#FF9500',
  },
} as const;

// App-specific color palette
export const AppColors = {
  // Primary Brand Colors
  primary: '#007AFF',
  primaryLight: '#5AC8FA',
  primaryDark: '#0051D5',
  
  // Secondary Colors
  secondary: '#5856D6',
  secondaryLight: '#AF52DE',
  secondaryDark: '#3634A3',
  
  // Semantic Colors
  success: '#34C759',
  successLight: '#30D158',
  successDark: '#248A3D',
  
  warning: '#FF9500',
  warningLight: '#FFAD33',
  warningDark: '#CC7700',
  
  error: '#FF3B30',
  errorLight: '#FF6961',
  errorDark: '#D70015',
  
  info: '#5AC8FA',
  infoLight: '#64D2FF',
  infoDark: '#0071E3',
  
  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',
  
  // Gray Scale
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // Practice-specific colors
  correctAnswer: '#34C759',
  incorrectAnswer: '#FF3B30',
  practiceProgress: '#007AFF',
  streak: '#FF9500',
  deepMemory: '#5856D6',
} as const;

export const Colors = {
  light: {
    text: '#11181C',
    textSecondary: '#687076',
    textMuted: '#8E8E93',
    background: '#FFFFFF',
    backgroundSecondary: '#F2F2F7',
    backgroundTertiary: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceSecondary: '#F9FAFB',
    tint: tintColorLight,
    tintSecondary: '#5856D6',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    shadow: 'rgba(0, 0, 0, 0.1)',
    shadowStrong: 'rgba(0, 0, 0, 0.2)',
    icon: '#687076',
    iconSecondary: '#9CA3AF',
    tabIconDefault: '#8E8E93',
    tabIconSelected: tintColorLight,
    overlay: 'rgba(0, 0, 0, 0.5)',
    
    // Practice colors
    correct: AppColors.correctAnswer,
    incorrect: AppColors.incorrectAnswer,
    progress: AppColors.practiceProgress,
    streak: AppColors.streak,
    deepMemory: AppColors.deepMemory,
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#A1A1A6',
    textMuted: '#6D6D70',
    background: '#000000',
    backgroundSecondary: '#1C1C1E',
    backgroundTertiary: '#2C2C2E',
    surface: '#1C1C1E',
    surfaceSecondary: '#2C2C2E',
    tint: tintColorDark,
    tintSecondary: '#BF5AF2',
    border: '#38383A',
    borderLight: '#48484A',
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowStrong: 'rgba(0, 0, 0, 0.5)',
    icon: '#A1A1A6',
    iconSecondary: '#6D6D70',
    tabIconDefault: '#6D6D70',
    tabIconSelected: tintColorDark,
    overlay: 'rgba(0, 0, 0, 0.7)',
    
    // Practice colors (adjusted for dark mode)
    correct: '#30D158',
    incorrect: '#FF453A',
    progress: '#0A84FF',
    streak: '#FF9F0A',
    deepMemory: '#BF5AF2',
  },
};

// Typography system
export const Typography = {
  // Font families
  fonts: Platform.select({
    ios: {
      sans: 'System',
      serif: 'ui-serif',
      rounded: 'ui-rounded',
      mono: 'ui-monospace',
    },
    android: {
      sans: 'Roboto',
      serif: 'serif',
      rounded: 'Roboto',
      mono: 'monospace',
    },
    default: {
      sans: 'System',
      serif: 'serif',
      rounded: 'System',
      mono: 'monospace',
    },
    web: {
      sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      serif: "Georgia, 'Times New Roman', serif",
      rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
      mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    },
  }),
  
  // Font sizes
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  },
  
  // Font weights
  weights: {
    thin: '100' as const,
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
    black: '900' as const,
  },
  
  // Line heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.6,
    loose: 2,
  },
} as const;

// Spacing system
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
  '5xl': 128,
} as const;

// Border radius
export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

// Shadows and elevation
export const Shadows = {
  light: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
    xl: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  dark: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    xl: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8,
    },
  },
} as const;

// Legacy export for backward compatibility
export const Fonts = Typography.fonts;

// Utility function to get language-specific colors
export const getLanguageColors = (languageCode: string) => {
  const code = languageCode.toLowerCase();
  return LanguageColors[code as keyof typeof LanguageColors] || LanguageColors.english;
};

// Theme configuration
export const Theme = {
  colors: Colors,
  appColors: AppColors,
  languageColors: LanguageColors,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  fonts: Typography.fonts,
} as const;

export type ThemeType = typeof Theme;
export type ColorScheme = 'light' | 'dark';
export type LanguageCode = keyof typeof LanguageColors;
