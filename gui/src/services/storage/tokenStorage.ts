import * as SecureStore from 'expo-secure-store';
import { AuthTokens } from '@/src/types/auth';
import { config } from '@/src/config/env';

const TOKENS_KEY = 'auth_tokens';
const REFRESH_TOKEN_KEY = 'refresh_token';

export interface StoredTokens extends AuthTokens {
  expires_at: number; // Unix timestamp
}

/**
 * Store authentication tokens securely
 */
export async function storeTokens(tokens: AuthTokens): Promise<void> {
  try {
    const expiresAt = Date.now() + (tokens.expires_in * 1000);
    const storedTokens: StoredTokens = {
      ...tokens,
      expires_at: expiresAt,
    };

    await SecureStore.setItemAsync(TOKENS_KEY, JSON.stringify(storedTokens));
    
    // Store refresh token separately for additional security
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refresh_token);
  } catch (error) {
    console.error('Failed to store tokens:', error);
    throw new Error('Failed to store authentication tokens');
  }
}

/**
 * Retrieve stored authentication tokens
 */
export async function getTokens(): Promise<StoredTokens | null> {
  try {
    const tokensJson = await SecureStore.getItemAsync(TOKENS_KEY);
    if (!tokensJson) {
      return null;
    }

    const tokens: StoredTokens = JSON.parse(tokensJson);
    
    // Check if tokens are expired (with 5-minute buffer)
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    if (Date.now() > (tokens.expires_at - bufferTime)) {
      // Tokens are expired or about to expire
      return null;
    }

    return tokens;
  } catch (error) {
    console.error('Failed to retrieve tokens:', error);
    return null;
  }
}

/**
 * Get refresh token
 */
export async function getRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to retrieve refresh token:', error);
    return null;
  }
}

/**
 * Refresh authentication tokens
 */
export async function refreshTokens(): Promise<AuthTokens | null> {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    // Make API call to refresh tokens
    const response = await fetch(`${config.API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh tokens');
    }

    const data = await response.json();
    const newTokens: AuthTokens = data.data || data;

    // Store the new tokens
    await storeTokens(newTokens);

    return newTokens;
  } catch (error) {
    console.error('Failed to refresh tokens:', error);
    await clearTokens(); // Clear invalid tokens
    return null;
  }
}

/**
 * Clear all stored tokens
 */
export async function clearTokens(): Promise<void> {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKENS_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);
  } catch (error) {
    console.error('Failed to clear tokens:', error);
    // Don't throw error for cleanup operations
  }
}

/**
 * Check if user has valid tokens
 */
export async function hasValidTokens(): Promise<boolean> {
  const tokens = await getTokens();
  return tokens !== null;
}

/**
 * Get access token for API calls
 */
export async function getAccessToken(): Promise<string | null> {
  const tokens = await getTokens();
  return tokens?.access_token || null;
}