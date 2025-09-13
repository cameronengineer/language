/**
 * Enhanced theme color hook with language-specific colors
 */

import { Colors, getLanguageColors, type ColorScheme, type LanguageCode } from './theme';
import { useColorScheme } from './use-color-scheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

/**
 * Hook for accessing language-specific colors
 */
export function useLanguageColors(languageCode?: string) {
  if (!languageCode) {
    return getLanguageColors('english');
  }
  return getLanguageColors(languageCode);
}

/**
 * Hook for accessing complete theme including colors, typography, spacing, etc.
 */
export function useTheme() {
  const colorScheme = useColorScheme() ?? 'light';
  
  return {
    colors: Colors[colorScheme],
    colorScheme,
    isDark: colorScheme === 'dark',
    isLight: colorScheme === 'light',
  };
}
