import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { authConfig } from '@/src/config/env';
import { SocialProvider, AuthRequest, SocialLoginResponse } from '@/src/types/auth';
import { api } from '@/src/services/api';
import { storeTokens, clearTokens } from '@/src/services/storage/tokenStorage';

// Configure WebBrowser for authentication
WebBrowser.maybeCompleteAuthSession();

/**
 * Social authentication service
 */
export class SocialAuthService {
  private redirectUri = AuthSession.makeRedirectUri();

  /**
   * Authenticate with Google
   */
  async loginWithGoogle(): Promise<SocialLoginResponse> {
    try {
      const discovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
        revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
      };

      const request = new AuthSession.AuthRequest({
        clientId: authConfig.google.clientId,
        scopes: ['profile', 'email'],
        responseType: AuthSession.ResponseType.Token,
        redirectUri: this.redirectUri,
      });

      const result = await request.promptAsync(discovery);
      
      if (result.type === 'success' && result.authentication?.accessToken) {
        return this.exchangeTokenWithBackend('google', result.authentication.accessToken);
      }
      
      throw new Error('Google authentication was cancelled or failed');
    } catch (error) {
      console.error('Google auth error:', error);
      throw new Error('Failed to authenticate with Google');
    }
  }

  /**
   * Authenticate with Facebook
   */
  async loginWithFacebook(): Promise<SocialLoginResponse> {
    try {
      const discovery = {
        authorizationEndpoint: 'https://www.facebook.com/v18.0/dialog/oauth',
        tokenEndpoint: 'https://graph.facebook.com/v18.0/oauth/access_token',
      };

      const request = new AuthSession.AuthRequest({
        clientId: authConfig.facebook.appId,
        scopes: ['public_profile', 'email'],
        responseType: AuthSession.ResponseType.Token,
        redirectUri: this.redirectUri,
      });

      const result = await request.promptAsync(discovery);
      
      if (result.type === 'success' && result.authentication?.accessToken) {
        return this.exchangeTokenWithBackend('facebook', result.authentication.accessToken);
      }
      
      throw new Error('Facebook authentication was cancelled or failed');
    } catch (error) {
      console.error('Facebook auth error:', error);
      throw new Error('Failed to authenticate with Facebook');
    }
  }

  /**
   * Authenticate with Apple (iOS only)
   */
  async loginWithApple(): Promise<SocialLoginResponse> {
    try {
      if (Platform.OS !== 'ios') {
        throw new Error('Apple Sign In is only available on iOS');
      }

      // Dynamic import to avoid issues on non-iOS platforms
      const AppleAuthentication = await import('expo-apple-authentication');
      
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        return this.exchangeTokenWithBackend('apple', credential.identityToken);
      }
      
      throw new Error('Apple authentication failed - no identity token received');
    } catch (error) {
      console.error('Apple auth error:', error);
      throw new Error('Failed to authenticate with Apple');
    }
  }

  /**
   * Authenticate with Twitter (simplified OAuth 2.0)
   */
  async loginWithTwitter(): Promise<SocialLoginResponse> {
    try {
      const discovery = {
        authorizationEndpoint: 'https://twitter.com/i/oauth2/authorize',
        tokenEndpoint: 'https://api.twitter.com/2/oauth2/token',
      };

      const request = new AuthSession.AuthRequest({
        clientId: authConfig.twitter.consumerKey,
        scopes: ['tweet.read', 'users.read'],
        responseType: AuthSession.ResponseType.Code,
        redirectUri: this.redirectUri,
      });

      const result = await request.promptAsync(discovery);
      
      if (result.type === 'success' && result.params.code) {
        // For Twitter, we'll send the code to our backend to exchange for tokens
        // This avoids client-side complexity with PKCE
        return this.exchangeCodeWithBackend('twitter', result.params.code);
      }
      
      throw new Error('Twitter authentication was cancelled or failed');
    } catch (error) {
      console.error('Twitter auth error:', error);
      throw new Error('Failed to authenticate with Twitter');
    }
  }

  /**
   * Exchange social provider token with backend
   */
  private async exchangeTokenWithBackend(
    provider: string, 
    accessToken: string
  ): Promise<SocialLoginResponse> {
    try {
      const authRequest: AuthRequest = {
        provider,
        access_token: accessToken,
        device_info: {
          device_type: Platform.OS,
          device_id: await this.getDeviceId(),
          app_version: '1.0.0',
        },
      };

      const response = await api.auth.socialLogin(authRequest);
      const loginData = response.data;

      // Store JWT tokens securely
      await storeTokens({
        access_token: loginData.access_token,
        refresh_token: loginData.refresh_token,
        expires_in: loginData.expires_in,
      });

      return loginData;
    } catch (error) {
      console.error('Token exchange error:', error);
      throw new Error('Failed to authenticate with server');
    }
  }

  /**
   * Exchange authorization code with backend (for Twitter)
   */
  private async exchangeCodeWithBackend(
    provider: string, 
    code: string
  ): Promise<SocialLoginResponse> {
    try {
      const authRequest: AuthRequest = {
        provider,
        access_token: code, // For Twitter, we send the code as access_token
        device_info: {
          device_type: Platform.OS,
          device_id: await this.getDeviceId(),
          app_version: '1.0.0',
        },
      };

      const response = await api.auth.socialLogin(authRequest);
      const loginData = response.data;

      // Store JWT tokens securely
      await storeTokens({
        access_token: loginData.access_token,
        refresh_token: loginData.refresh_token,
        expires_in: loginData.expires_in,
      });

      return loginData;
    } catch (error) {
      console.error('Code exchange error:', error);
      throw new Error('Failed to authenticate with server');
    }
  }

  /**
   * Get device ID for authentication
   */
  private async getDeviceId(): Promise<string> {
    try {
      const deviceId = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${Platform.OS}-${Platform.Version}-${this.redirectUri}`,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
      return deviceId;
    } catch (error) {
      console.error('Device ID generation error:', error);
      return 'unknown-device';
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Call backend logout endpoint
      await api.auth.logout();
    } catch (error) {
      console.error('Backend logout error:', error);
      // Continue with local logout even if backend fails
    } finally {
      // Always clear local tokens
      await clearTokens();
    }
  }

  /**
   * Get available social providers
   */
  getAvailableProviders(): SocialProvider[] {
    const providers: SocialProvider[] = [
      {
        id: 'google',
        name: 'Google',
        color: '#DB4437',
        icon: 'logo-google',
      },
      {
        id: 'facebook',
        name: 'Facebook',
        color: '#3B5998',
        icon: 'logo-facebook',
      },
      {
        id: 'twitter',
        name: 'Twitter',
        color: '#1DA1F2',
        icon: 'logo-twitter',
      },
    ];

    // Add Apple Sign In only on iOS
    if (Platform.OS === 'ios') {
      providers.push({
        id: 'apple',
        name: 'Apple',
        color: '#000000',
        icon: 'logo-apple',
      });
    }

    return providers;
  }
}

// Export singleton instance
export const socialAuthService = new SocialAuthService();

// Export individual login methods for convenience
export const {
  loginWithGoogle,
  loginWithFacebook,
  loginWithApple,
  loginWithTwitter,
  logout,
  getAvailableProviders,
} = socialAuthService;