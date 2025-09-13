// Environment Configuration
export const config = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000',
  STATIC_BASE_URL: process.env.EXPO_PUBLIC_STATIC_URL || 'http://localhost:8000/static',
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_VERSION: '1.0.0',
} as const;

export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';

// Auth provider configurations
export const authConfig = {
  google: {
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
    scopes: ['profile', 'email'],
  },
  facebook: {
    appId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || '',
    permissions: ['public_profile', 'email'],
  },
  apple: {
    scopes: ['fullName', 'email'],
  },
  twitter: {
    consumerKey: process.env.EXPO_PUBLIC_TWITTER_CONSUMER_KEY || '',
    consumerSecret: process.env.EXPO_PUBLIC_TWITTER_CONSUMER_SECRET || '',
  },
} as const;