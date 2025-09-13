import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthActions } from '@/src/stores';
import { getAvailableProviders } from '@/src/services/auth';
import { COLORS, ERROR_MESSAGES } from '@/src/utils/constants';
import { SocialProvider } from '@/src/types/auth';

export default function LoginScreen() {
  const { loginWithProvider } = useAuthActions();
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingProvider, setLoadingProvider] = React.useState<string | null>(null);

  const availableProviders = getAvailableProviders();

  const handleSocialLogin = async (provider: SocialProvider) => {
    try {
      setIsLoading(true);
      setLoadingProvider(provider.id);

      const loginResponse = await loginWithProvider(provider.id);

      // Check if this is a new user who needs language selection
      if (loginResponse.is_new_user || 
          !loginResponse.user.native_language_id || 
          !loginResponse.user.study_language_id) {
        router.push('/auth/language-selection');
      } else {
        router.replace('/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert(
        'Login Failed',
        error.message || ERROR_MESSAGES.AUTH_FAILED,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const renderSocialButton = (provider: SocialProvider) => {
    const isLoadingThis = loadingProvider === provider.id;
    
    return (
      <TouchableOpacity
        key={provider.id}
        style={[
          styles.socialButton,
          { backgroundColor: provider.color },
          isLoadingThis && styles.socialButtonDisabled,
        ]}
        onPress={() => handleSocialLogin(provider)}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        <Ionicons
          name={provider.icon as any}
          size={24}
          color="white"
          style={styles.socialIcon}
        />
        <Text style={styles.socialButtonText}>
          {isLoadingThis ? 'Connecting...' : `Continue with ${provider.name}`}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Language Learning</Text>
          <Text style={styles.subtitle}>
            Choose your preferred method to get started
          </Text>
        </View>

        {/* Social Login Buttons */}
        <View style={styles.socialButtonsContainer}>
          {availableProviders.map(renderSocialButton)}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.DARK,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  socialButtonsContainer: {
    gap: 16,
    marginBottom: 48,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  socialButtonDisabled: {
    opacity: 0.7,
  },
  socialIcon: {
    marginRight: 12,
  },
  socialButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 18,
  },
});