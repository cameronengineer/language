/**
 * MicroInteractions - Enhanced button presses, card interactions, and feedback
 * Provides polished micro-interactions for professional user experience
 */

import React, { useRef, useEffect } from 'react';
import { 
  Animated, 
  Pressable, 
  View, 
  Easing,
  Platform,
  StyleSheet,
  ViewStyle,
  PressableProps,
  StyleProp,
  ViewProps
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useOptimizedTiming, useOptimizedSpring } from '../../services/optimization/AnimationOptimizer';

interface MicroInteractionButtonProps extends PressableProps {
  children: React.ReactNode;
  hapticFeedback?: 'light' | 'medium' | 'heavy' | 'none';
  scaleEffect?: boolean;
  rippleEffect?: boolean;
  elevationEffect?: boolean;
  animationDuration?: number;
  style?: StyleProp<ViewStyle>;
}

interface CardInteractionProps extends ViewProps {
  children: React.ReactNode;
  onPress?: () => void;
  pressScale?: number;
  bounceOnPress?: boolean;
  shadowAnimation?: boolean;
  style?: StyleProp<ViewStyle>;
}

interface FloatingActionButtonProps {
  onPress: () => void;
  icon: React.ReactNode;
  visible?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  hapticFeedback?: boolean;
}

interface PulsingIndicatorProps {
  size?: number;
  color?: string;
  duration?: number;
  intensity?: number;
}

interface ShimmerEffectProps {
  width: number;
  height: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Enhanced Button with micro-interactions
 */
export const MicroInteractionButton: React.FC<MicroInteractionButtonProps> = ({
  children,
  onPress,
  hapticFeedback = 'light',
  scaleEffect = true,
  rippleEffect = false,
  elevationEffect = false,
  animationDuration = 150,
  style,
  disabled = false,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const elevationAnim = useRef(new Animated.Value(2)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    if (disabled) return;

    // Haptic feedback
    if (hapticFeedback !== 'none') {
      switch (hapticFeedback) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
      }
    }

    // Scale animation
    if (scaleEffect) {
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: animationDuration,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }

    // Elevation animation
    if (elevationEffect) {
      Animated.timing(elevationAnim, {
        toValue: 8,
        duration: animationDuration,
        useNativeDriver: false,
      }).start();
    }

    // Ripple effect
    if (rippleEffect) {
      rippleAnim.setValue(0);
      Animated.timing(rippleAnim, {
        toValue: 1,
        duration: animationDuration * 2,
        easing: Easing.out(Easing.circle),
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (disabled) return;

    // Scale back
    if (scaleEffect) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }).start();
    }

    // Elevation back
    if (elevationEffect) {
      Animated.timing(elevationAnim, {
        toValue: 2,
        duration: animationDuration,
        useNativeDriver: false,
      }).start();
    }
  };

  const animatedStyle = {
    transform: scaleEffect ? [{ scale: scaleAnim }] : [],
    elevation: elevationEffect ? elevationAnim : undefined,
    shadowOffset: elevationEffect ? {
      width: 0,
      height: elevationAnim,
    } : undefined,
    shadowOpacity: elevationEffect ? 0.2 : undefined,
    shadowRadius: elevationEffect ? elevationAnim : undefined,
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        pressed && Platform.OS === 'ios' && { opacity: 0.8 },
        { opacity: disabled ? 0.5 : 1 }
      ]}
      {...props}
    >
      <Animated.View style={[style, animatedStyle]}>
        {rippleEffect && (
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                borderRadius: 8,
                opacity: rippleAnim,
                transform: [{
                  scale: rippleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                }],
              },
            ]}
          />
        )}
        {children}
      </Animated.View>
    </Pressable>
  );
};

/**
 * Interactive card with press animations
 */
export const InteractiveCard: React.FC<CardInteractionProps> = ({
  children,
  onPress,
  pressScale = 0.98,
  bounceOnPress = true,
  shadowAnimation = true,
  style,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shadowAnim = useRef(new Animated.Value(3)).current;

  const handlePressIn = () => {
    if (!onPress) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const animations = [];

    // Scale animation
    animations.push(
      Animated.timing(scaleAnim, {
        toValue: pressScale,
        duration: 150,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    );

    // Shadow animation
    if (shadowAnimation) {
      animations.push(
        Animated.timing(shadowAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: false,
        })
      );
    }

    Animated.parallel(animations).start();
  };

  const handlePressOut = () => {
    if (!onPress) return;

    const animations = [];

    if (bounceOnPress) {
      animations.push(
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 300,
          friction: 10,
          useNativeDriver: true,
        })
      );
    } else {
      animations.push(
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        })
      );
    }

    if (shadowAnimation) {
      animations.push(
        Animated.timing(shadowAnim, {
          toValue: 3,
          duration: 150,
          useNativeDriver: false,
        })
      );
    }

    Animated.parallel(animations).start();
  };

  const animatedStyle = {
    transform: [{ scale: scaleAnim }],
    shadowOffset: shadowAnimation ? {
      width: 0,
      height: shadowAnim,
    } : undefined,
    shadowOpacity: shadowAnimation ? 0.15 : undefined,
    shadowRadius: shadowAnimation ? shadowAnim : undefined,
    elevation: shadowAnimation ? shadowAnim : undefined,
  };

  if (onPress) {
    return (
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        {...props}
      >
        <Animated.View style={[style, animatedStyle]}>
          {children}
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Animated.View style={[style, animatedStyle]} {...props}>
      {children}
    </Animated.View>
  );
};

/**
 * Floating Action Button with entrance animation
 */
export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  icon,
  visible = true,
  position = 'bottom-right',
  hapticFeedback = true,
}) => {
  const scaleAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: visible ? 1 : 0,
      tension: 150,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const handlePress = () => {
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Rotation animation on press
    Animated.sequence([
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  const positionStyle = {
    'bottom-right': { bottom: 20, right: 20 },
    'bottom-left': { bottom: 20, left: 20 },
    'bottom-center': { bottom: 20, alignSelf: 'center' as const },
  };

  return (
    <Animated.View
      style={[
        styles.fab,
        positionStyle[position],
        {
          transform: [
            { scale: scaleAnim },
            {
              rotate: rotateAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '15deg'],
              }),
            },
          ],
        },
      ]}
    >
      <MicroInteractionButton
        onPress={handlePress}
        style={styles.fabButton}
        hapticFeedback="none" // Handled above
        scaleEffect={true}
        elevationEffect={true}
      >
        {icon}
      </MicroInteractionButton>
    </Animated.View>
  );
};

/**
 * Pulsing indicator for loading states
 */
export const PulsingIndicator: React.FC<PulsingIndicatorProps> = ({
  size = 12,
  color = '#007AFF',
  duration = 1000,
  intensity = 0.3,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1 - intensity,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };

    pulse();
  }, [duration, intensity]);

  return (
    <Animated.View
      style={[
        styles.pulsingIndicator,
        {
          width: size,
          height: size,
          backgroundColor: color,
          opacity: pulseAnim,
        },
      ]}
    />
  );
};

/**
 * Shimmer loading effect
 */
export const ShimmerEffect: React.FC<ShimmerEffectProps> = ({
  width,
  height,
  style,
}) => {
  const shimmerAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const shimmer = () => {
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => {
        shimmerAnim.setValue(-1);
        shimmer();
      });
    };

    shimmer();
  }, []);

  return (
    <View style={[styles.shimmerContainer, { width, height }, style]}>
      <Animated.View
        style={[
          styles.shimmerOverlay,
          {
            transform: [
              {
                translateX: shimmerAnim.interpolate({
                  inputRange: [-1, 1],
                  outputRange: [-width, width],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  fabButton: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  pulsingIndicator: {
    borderRadius: 50,
  },
  shimmerContainer: {
    backgroundColor: '#E1E9EE',
    borderRadius: 4,
    overflow: 'hidden',
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    opacity: 0.7,
    width: '30%',
    height: '100%',
    borderRadius: 4,
  },
});