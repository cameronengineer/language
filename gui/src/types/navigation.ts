/**
 * Navigation type definitions for the expo-router based language learning app
 */

// Tab Navigator (bottom tabs) - Main navigation structure
export type TabParamList = {
  index: undefined; // Dashboard/Home
  'word-practice': undefined;
  'sentence-practice': undefined;
  explore: undefined;
  profile: undefined;
};

// Auth routes
export type AuthParamList = {
  'auth/login': undefined;
  'auth/language-selection': undefined;
};

// Modal routes
export type ModalParamList = {
  modal: { title?: string; content?: string };
};

// All possible routes in the app
export type AllRoutes = TabParamList & AuthParamList & ModalParamList;

// Individual Screen Names
export type TabScreenName = keyof TabParamList;
export type AuthScreenName = keyof AuthParamList;
export type ModalScreenName = keyof ModalParamList;

// Route paths as used by expo-router
export type RoutePath =
  | '/'                        // Dashboard (index)
  | '/word-practice'
  | '/sentence-practice'
  | '/explore'
  | '/profile'
  | '/auth/login'
  | '/auth/language-selection'
  | '/modal';

// Screen Options Types for tabs
export interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
}

export interface TabScreenOptions {
  title: string;
  tabBarIcon: (props: TabBarIconProps) => React.ReactNode;
  headerShown?: boolean;
  tabBarBadge?: string | number;
}

// Navigation Events
export type NavigationEvent =
  | 'focus'
  | 'blur'
  | 'beforeRemove'
  | 'tabPress'
  | 'tabLongPress';

// Navigation State
export interface NavigationState {
  routeName: string;
  params?: Record<string, any>;
}

// Route Parameters for different screen types
export interface RouteParams {
  // Tab routes (no params needed for current implementation)
  '/': undefined;
  '/word-practice': undefined;
  '/sentence-practice': undefined;
  '/explore': undefined;
  '/profile': undefined;
  
  // Auth routes
  '/auth/login': undefined;
  '/auth/language-selection': undefined;
  
  // Modal routes
  '/modal': {
    title?: string;
    content?: string;
  };
}

// Navigation utilities
export interface NavigationUtils {
  /**
   * Navigate to a specific route
   */
  navigate: (path: RoutePath, params?: any) => void;
  
  /**
   * Go back to previous screen
   */
  goBack: () => void;
  
  /**
   * Replace current route
   */
  replace: (path: RoutePath, params?: any) => void;
  
  /**
   * Push new route onto stack
   */
  push: (path: RoutePath, params?: any) => void;
}

// Screen component props interface
export interface ScreenProps {
  route?: {
    params?: Record<string, any>;
  };
  navigation?: NavigationUtils;
}

// Tab configuration
export interface TabConfig {
  name: TabScreenName;
  title: string;
  icon: string;
  component: React.ComponentType<any>;
}

// Complete tab configuration for the app
export const TAB_CONFIGS: TabConfig[] = [
  {
    name: 'index',
    title: 'Home',
    icon: 'house.fill',
    component: () => null, // Will be set by actual screens
  },
  {
    name: 'word-practice',
    title: 'Words',
    icon: 'flashcard.fill',
    component: () => null,
  },
  {
    name: 'sentence-practice',
    title: 'Sentences',
    icon: 'mic.fill',
    component: () => null,
  },
  {
    name: 'explore',
    title: 'Explore',
    icon: 'safari.fill',
    component: () => null,
  },
  {
    name: 'profile',
    title: 'Profile',
    icon: 'person.fill',
    component: () => null,
  },
];

// Type guard utilities
export const isTabRoute = (route: string): route is TabScreenName => {
  return ['index', 'word-practice', 'sentence-practice', 'explore', 'profile'].includes(route);
};

export const isAuthRoute = (route: string): route is AuthScreenName => {
  return route.startsWith('auth/');
};

// Global navigation type declaration for expo-router
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RouteParams {}
  }
}