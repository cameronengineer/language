// Authentication Types
export interface SocialProvider {
  id: 'google' | 'facebook' | 'apple' | 'twitter';
  name: string;
  color: string;
  icon: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface SocialLoginResponse extends AuthTokens {
  user: User;
  is_new_user: boolean;
}

export interface AuthRequest {
  provider: string;
  access_token: string;
  device_info?: {
    device_type: string;
    device_id: string;
    app_version: string;
  };
}

export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

export interface LoginState {
  isLoading: boolean;
  error: AuthError | null;
  isAuthenticated: boolean;
}

// Import User type (will be defined in user.ts)
import type { User } from './user';