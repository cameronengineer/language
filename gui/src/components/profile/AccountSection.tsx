import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { 
  ThemedView, 
  ThemedText, 
  PracticeButton,
  LoadingSpinner 
} from '@/src/components/ui';
import { useTheme } from '@/src/utils/use-theme-color';
import { Spacing, Typography, BorderRadius, AppColors } from '@/src/utils/theme';
import { IconSymbol } from '@/src/components/ui/ui/icon-symbol';
import { AccountSectionProps } from '@/src/types/profile';

/**
 * Account section component for logout and account management
 */
export function AccountSection({ 
  onLogout, 
  onDeleteAccount, 
  onExportData, 
  isLoading = false 
}: AccountSectionProps) {
  const { colors } = useTheme();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: onLogout,
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    if (!onDeleteAccount) return;

    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your progress will be permanently lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: onDeleteAccount,
        },
      ]
    );
  };

  const handleExportData = () => {
    if (!onExportData) return;

    Alert.alert(
      'Export Data',
      'We will prepare your data for download. This may take a few minutes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: onExportData,
        },
      ]
    );
  };

  const AccountOption = ({ 
    title, 
    subtitle, 
    icon, 
    onPress, 
    variant = 'default',
    disabled = false
  }: {
    title: string;
    subtitle: string;
    icon: string;
    onPress: () => void;
    variant?: 'default' | 'warning' | 'danger';
    disabled?: boolean;
  }) => {
    const getIconColor = () => {
      switch (variant) {
        case 'warning':
          return AppColors.warning;
        case 'danger':
          return AppColors.error;
        default:
          return colors.icon;
      }
    };

    const getTitleColor = () => {
      switch (variant) {
        case 'danger':
          return AppColors.error;
        default:
          return colors.text;
      }
    };

    return (
      <TouchableOpacity
        style={[
          styles.accountOption,
          { backgroundColor: colors.surface },
          disabled && styles.disabledOption
        ]}
        onPress={onPress}
        disabled={disabled || isLoading}
        activeOpacity={0.7}
      >
        <View style={styles.optionLeft}>
          <View style={[
            styles.iconContainer,
            { backgroundColor: colors.backgroundSecondary }
          ]}>
            <IconSymbol 
              name={icon as any} 
              size={20} 
              color={getIconColor()} 
            />
          </View>
          <View style={styles.optionText}>
            <ThemedText style={[styles.optionTitle, { color: getTitleColor() }]}>
              {title}
            </ThemedText>
            <ThemedText style={[styles.optionSubtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </ThemedText>
          </View>
        </View>

        {!disabled && (
          <IconSymbol 
            name="chevron.right" 
            size={16} 
            color={colors.iconSecondary} 
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Account Management
        </ThemedText>
        <ThemedText style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          Manage your account settings and data
        </ThemedText>
      </View>

      <View style={styles.accountOptions}>
        {/* Data Export */}
        {onExportData && (
          <AccountOption
            title="Export Data"
            subtitle="Download your learning data"
            icon="book.fill"
            onPress={handleExportData}
            disabled={isLoading}
          />
        )}

        {/* Privacy & Terms */}
        <AccountOption
          title="Privacy Policy"
          subtitle="How we protect your data"
          icon="person.fill"
          onPress={() => {
            // TODO: Open privacy policy
            Alert.alert('Privacy Policy', 'Privacy policy functionality coming soon!');
          }}
        />

        <AccountOption
          title="Terms of Service"
          subtitle="Usage terms and conditions"
          icon="book.fill"
          onPress={() => {
            // TODO: Open terms of service
            Alert.alert('Terms of Service', 'Terms of service functionality coming soon!');
          }}
        />

        {/* Help & Support */}
        <AccountOption
          title="Help & Support"
          subtitle="Get help and contact us"
          icon="info.circle.fill"
          onPress={() => {
            // TODO: Open help & support
            Alert.alert('Help & Support', 'Help & support functionality coming soon!');
          }}
        />
      </View>

      {/* Danger Zone */}
      <View style={styles.dangerZone}>
        <View style={styles.dangerHeader}>
          <ThemedText style={[styles.dangerTitle, { color: AppColors.error }]}>
            Danger Zone
          </ThemedText>
        </View>

        <View style={styles.dangerOptions}>
          {onDeleteAccount && (
            <AccountOption
              title="Delete Account"
              subtitle="Permanently delete your account and data"
              icon="exclamationmark.triangle.fill"
              onPress={handleDeleteAccount}
              variant="danger"
              disabled={isLoading}
            />
          )}
        </View>
      </View>

      {/* Logout Button */}
      <View style={styles.logoutSection}>
        <PracticeButton
          title={isLoading ? "Signing Out..." : "Sign Out"}
          variant="outline"
          onPress={handleLogout}
          disabled={isLoading}
          style={styles.logoutButton}
        />
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner message="Processing..." overlay />
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  sectionDescription: {
    fontSize: Typography.sizes.sm,
  },
  accountOptions: {
    gap: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  accountOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    minHeight: 64,
  },
  disabledOption: {
    opacity: 0.6,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: Typography.sizes.sm,
  },
  dangerZone: {
    marginBottom: Spacing.xl,
  },
  dangerHeader: {
    marginBottom: Spacing.md,
  },
  dangerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
  },
  dangerOptions: {
    gap: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  logoutSection: {
    alignItems: 'center',
  },
  logoutButton: {
    paddingHorizontal: Spacing.xl,
    minWidth: 120,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});