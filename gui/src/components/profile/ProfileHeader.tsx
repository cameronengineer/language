import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { 
  ThemedView, 
  ThemedText, 
  LanguageFlag 
} from '@/src/components/ui';
import { useTheme } from '@/src/utils/use-theme-color';
import { Spacing, Typography, BorderRadius } from '@/src/utils/theme';
import { IconSymbol } from '@/src/components/ui/ui/icon-symbol';
import { ProfileHeaderProps } from '@/src/types/profile';

/**
 * Profile header component showing user information and avatar
 */
export function ProfileHeader({ 
  user, 
  onEditProfile, 
  onChangeAvatar 
}: ProfileHeaderProps) {
  const { colors } = useTheme();

  // Generate initials from user name or email
  const getInitials = () => {
    if (user.first_name && user.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    }
    if (user.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    return user.email.charAt(0).toUpperCase();
  };

  // Get display name
  const getDisplayName = () => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`.trim();
    }
    if (user.username) {
      return user.username;
    }
    return user.email.split('@')[0];
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <TouchableOpacity
          style={[styles.avatarContainer, { backgroundColor: colors.tint }]}
          onPress={onChangeAvatar}
          activeOpacity={0.8}
        >
          {user.profile_picture_url ? (
            <View style={styles.avatarImage}>
              {/* TODO: Add actual image component when available */}
              <ThemedText style={[styles.avatarText, { color: colors.background }]}>
                {getInitials()}
              </ThemedText>
            </View>
          ) : (
            <ThemedText style={[styles.avatarText, { color: colors.background }]}>
              {getInitials()}
            </ThemedText>
          )}
          
          {/* Edit overlay */}
          <View style={[styles.editOverlay, { backgroundColor: colors.overlay }]}>
            <IconSymbol
              name="person.fill"
              size={16}
              color={colors.background}
            />
          </View>
        </TouchableOpacity>

        {/* Edit profile button */}
        {onEditProfile && (
          <TouchableOpacity 
            style={[styles.editButton, { borderColor: colors.border }]}
            onPress={onEditProfile}
            activeOpacity={0.7}
          >
            <IconSymbol
              name="person.fill"
              size={16}
              color={colors.icon}
            />
            <ThemedText style={styles.editButtonText}>Edit Profile</ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {/* User Info Section */}
      <View style={styles.userInfo}>
        <ThemedText type="title" style={styles.userName}>
          {getDisplayName()}
        </ThemedText>
        
        <ThemedText style={[styles.userEmail, { color: colors.textSecondary }]}>
          {user.email}
        </ThemedText>

        {/* Member since */}
        <View style={styles.memberSince}>
          <IconSymbol
            name="info.circle.fill"
            size={14}
            color={colors.iconSecondary}
            style={styles.calendarIcon}
          />
          <ThemedText style={[styles.memberText, { color: colors.textSecondary }]}>
            Member since {new Date(user.created_at).toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </ThemedText>
        </View>

        {/* Language indicators */}
        <View style={styles.languageIndicators}>
          {user.native_language_id && (
            <View style={styles.languageChip}>
              <LanguageFlag 
                languageId={user.native_language_id} 
                size="small" 
              />
              <ThemedText style={[styles.languageRole, { color: colors.textSecondary }]}>
                Native
              </ThemedText>
            </View>
          )}
          
          {user.study_language_id && (
            <View style={styles.languageChip}>
              <LanguageFlag 
                languageId={user.study_language_id} 
                size="small" 
              />
              <ThemedText style={[styles.languageRole, { color: colors.textSecondary }]}>
                Learning
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  editButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: Typography.sizes.base,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  memberSince: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  calendarIcon: {
    marginRight: Spacing.xs,
  },
  memberText: {
    fontSize: Typography.sizes.sm,
  },
  languageIndicators: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  languageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  languageRole: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
});