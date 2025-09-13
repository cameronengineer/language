import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColor } from '@/src/utils/use-theme-color';
import { Spacing, BorderRadius, Typography, Shadows } from '@/src/utils/theme';
import { IconSymbol } from './ui/icon-symbol';
import { PracticeButton } from './PracticeButton';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  actions?: Array<{
    text: string;
    variant?: 'primary' | 'secondary' | 'outline';
    onPress: () => void;
  }>;
}

const MODAL_SIZES = {
  small: { width: screenWidth * 0.8, maxHeight: screenHeight * 0.5 },
  medium: { width: screenWidth * 0.9, maxHeight: screenHeight * 0.7 },
  large: { width: screenWidth * 0.95, maxHeight: screenHeight * 0.8 },
  fullscreen: { width: screenWidth, height: screenHeight },
} as const;

/**
 * Modal system for various dialogs and overlays
 */
export function Modal({
  visible,
  onClose,
  title,
  children,
  size = 'medium',
  showCloseButton = true,
  closeOnBackdrop = true,
  actions,
}: ModalProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const overlayColor = useThemeColor({}, 'overlay');

  const modalSize = MODAL_SIZES[size];
  const isFullscreen = size === 'fullscreen';

  const handleBackdropPress = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  const modalContent = (
    <View style={[
      styles.modalContainer,
      {
        backgroundColor,
        width: modalSize.width,
        maxHeight: isFullscreen ? undefined : (modalSize as any).maxHeight,
        height: isFullscreen ? (modalSize as any).height : undefined,
      },
      !isFullscreen && { ...Shadows.light.lg },
      !isFullscreen && styles.roundedModal,
    ]}>
      {/* Header */}
      {(title || showCloseButton) && (
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {title || ''}
          </Text>
          {showCloseButton && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <IconSymbol
                name="xmark"
                size={20}
                color={iconColor}
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Content */}
      <View style={[styles.content, isFullscreen && styles.fullscreenContent]}>
        {children}
      </View>

      {/* Actions */}
      {actions && actions.length > 0 && (
        <View style={styles.actions}>
          {actions.map((action, index) => (
            <PracticeButton
              key={index}
              title={action.text}
              variant={action.variant || 'outline'}
              onPress={action.onPress}
              style={styles.actionButton}
            />
          ))}
        </View>
      )}
    </View>
  );

  return (
    <RNModal
      visible={visible}
      transparent={!isFullscreen}
      animationType={isFullscreen ? 'slide' : 'fade'}
      onRequestClose={onClose}
    >
      {isFullscreen ? (
        <SafeAreaView style={styles.fullscreenContainer}>
          {modalContent}
        </SafeAreaView>
      ) : (
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <View style={[styles.backdrop, { backgroundColor: overlayColor }]}>
            <TouchableWithoutFeedback>
              {modalContent}
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}
    </RNModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  fullscreenContainer: {
    flex: 1,
  },
  modalContainer: {
    maxWidth: '100%',
  },
  roundedModal: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    flex: 1,
  },
  closeButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  content: {
    padding: Spacing.md,
    flex: 1,
  },
  fullscreenContent: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});