/**
 * EnhancedLoadingStates - Polish loading animations and skeleton screens
 * Provides professional loading states for better user experience
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Animated,
  Easing,
  StyleSheet,
  Dimensions,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { ShimmerEffect } from './MicroInteractions';

const { width: screenWidth } = Dimensions.get('window');

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  style?: ViewStyle;
}

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

interface CardSkeletonProps {
  style?: ViewStyle;
  showAvatar?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  showContent?: boolean;
}

interface ListSkeletonProps {
  itemCount?: number;
  itemHeight?: number;
  style?: ViewStyle;
}

interface ProgressBarProps {
  progress: number;
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  animated?: boolean;
  style?: ViewStyle;
}

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  transparent?: boolean;
  style?: ViewStyle;
}

interface PulseLoaderProps {
  dotCount?: number;
  dotSize?: number;
  dotColor?: string;
  animationDuration?: number;
}

/**
 * Animated loading spinner
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = '#007AFF',
  style,
}) => {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = () => {
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => {
        spinAnim.setValue(0);
        spin();
      });
    };

    spin();
  }, []);

  const sizeMap = {
    small: 16,
    medium: 24,
    large: 32,
  };

  return (
    <Animated.View
      style={[
        styles.spinner,
        {
          width: sizeMap[size],
          height: sizeMap[size],
          borderColor: `${color}30`,
          borderTopColor: color,
          transform: [
            {
              rotate: spinAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        },
        style,
      ]}
    />
  );
};

/**
 * Skeleton placeholder component
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 4,
  style,
}) => {
  return (
    <ShimmerEffect
      width={typeof width === 'string' ? screenWidth * 0.8 : width}
      height={height}
      style={[{ borderRadius }, style]}
    />
  );
};

/**
 * Card skeleton with multiple elements
 */
export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  style,
  showAvatar = true,
  showTitle = true,
  showSubtitle = true,
  showContent = true,
}) => {
  return (
    <View style={[styles.cardSkeleton, style]}>
      {showAvatar && (
        <View style={styles.avatarRow}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <View style={styles.avatarText}>
            <Skeleton width={120} height={14} />
            <Skeleton width={80} height={12} style={{ marginTop: 4 }} />
          </View>
        </View>
      )}

      {showTitle && (
        <Skeleton width="90%" height={18} style={{ marginTop: 16 }} />
      )}

      {showSubtitle && (
        <Skeleton width="70%" height={14} style={{ marginTop: 8 }} />
      )}

      {showContent && (
        <View style={{ marginTop: 12 }}>
          <Skeleton width="100%" height={12} />
          <Skeleton width="95%" height={12} style={{ marginTop: 6 }} />
          <Skeleton width="80%" height={12} style={{ marginTop: 6 }} />
        </View>
      )}
    </View>
  );
};

/**
 * List skeleton with multiple items
 */
export const ListSkeleton: React.FC<ListSkeletonProps> = ({
  itemCount = 5,
  itemHeight = 80,
  style,
}) => {
  return (
    <View style={[styles.listSkeleton, style]}>
      {Array.from({ length: itemCount }, (_, index) => (
        <View key={index} style={[styles.listItem, { height: itemHeight }]}>
          <CardSkeleton showAvatar={true} showTitle={true} showSubtitle={false} showContent={false} />
        </View>
      ))}
    </View>
  );
};

/**
 * Animated progress bar
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 4,
  backgroundColor = '#E1E9EE',
  progressColor = '#007AFF',
  animated = true,
  style,
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    } else {
      progressAnim.setValue(progress);
    }
  }, [progress, animated]);

  return (
    <View style={[styles.progressContainer, { height, backgroundColor }, style]}>
      <Animated.View
        style={[
          styles.progressBar,
          {
            backgroundColor: progressColor,
            width: progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
};

/**
 * Loading overlay
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Loading...',
  transparent = false,
  style,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          backgroundColor: transparent ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.5)',
          opacity: fadeAnim,
        },
        style,
      ]}
    >
      <View style={styles.overlayContent}>
        <LoadingSpinner size="large" />
        <Text style={styles.overlayText}>{message}</Text>
      </View>
    </Animated.View>
  );
};

/**
 * Pulse loading dots
 */
export const PulseLoader: React.FC<PulseLoaderProps> = ({
  dotCount = 3,
  dotSize = 8,
  dotColor = '#007AFF',
  animationDuration = 600,
}) => {
  const animations = useRef(
    Array.from({ length: dotCount }, () => new Animated.Value(0.3))
  ).current;

  useEffect(() => {
    const createAnimation = (animation: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animation, {
            toValue: 1,
            duration: animationDuration / 2,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(animation, {
            toValue: 0.3,
            duration: animationDuration / 2,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animationPromises = animations.map((animation, index) =>
      createAnimation(animation, index * (animationDuration / dotCount))
    );

    animationPromises.forEach(animation => animation.start());

    return () => {
      animationPromises.forEach(animation => animation.stop());
    };
  }, [dotCount, animationDuration]);

  return (
    <View style={styles.pulseLoader}>
      {animations.map((animation, index) => (
        <Animated.View
          key={index}
          style={[
            styles.pulseDot,
            {
              width: dotSize,
              height: dotSize,
              backgroundColor: dotColor,
              opacity: animation,
            },
          ]}
        />
      ))}
    </View>
  );
};

/**
 * Bouncing balls loader
 */
export const BouncingBalls: React.FC<{
  ballCount?: number;
  ballSize?: number;
  ballColor?: string;
}> = ({
  ballCount = 3,
  ballSize = 12,
  ballColor = '#007AFF',
}) => {
  const animations = useRef(
    Array.from({ length: ballCount }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const createBounceAnimation = (animation: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animation, {
            toValue: -20,
            duration: 300,
            delay,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(animation, {
            toValue: 0,
            duration: 300,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
    };

    const bounceAnimations = animations.map((animation, index) =>
      createBounceAnimation(animation, index * 100)
    );

    bounceAnimations.forEach(animation => animation.start());

    return () => {
      bounceAnimations.forEach(animation => animation.stop());
    };
  }, [ballCount]);

  return (
    <View style={styles.bouncingBalls}>
      {animations.map((animation, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bouncingBall,
            {
              width: ballSize,
              height: ballSize,
              backgroundColor: ballColor,
              transform: [{ translateY: animation }],
            },
          ]}
        />
      ))}
    </View>
  );
};

/**
 * Wave loader
 */
export const WaveLoader: React.FC<{
  waveColor?: string;
  waveHeight?: number;
}> = ({
  waveColor = '#007AFF',
  waveHeight = 4,
}) => {
  const waveAnims = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const createWaveAnimation = (animation: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animation, {
            toValue: 1,
            duration: 400,
            delay,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(animation, {
            toValue: 0,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    };

    const waveAnimations = waveAnims.map((animation, index) =>
      createWaveAnimation(animation, index * 80)
    );

    waveAnimations.forEach(animation => animation.start());

    return () => {
      waveAnimations.forEach(animation => animation.stop());
    };
  }, []);

  return (
    <View style={styles.waveLoader}>
      {waveAnims.map((animation, index) => (
        <Animated.View
          key={index}
          style={[
            styles.waveBar,
            {
              backgroundColor: waveColor,
              height: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [waveHeight, waveHeight * 4],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  spinner: {
    borderWidth: 2,
    borderRadius: 50,
  },
  cardSkeleton: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginVertical: 4,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarText: {
    marginLeft: 12,
    flex: 1,
  },
  listSkeleton: {
    paddingHorizontal: 16,
  },
  listItem: {
    marginVertical: 4,
  },
  progressContainer: {
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlayContent: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  overlayText: {
    marginTop: 12,
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
  },
  pulseLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseDot: {
    borderRadius: 50,
    marginHorizontal: 4,
  },
  bouncingBalls: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 40,
  },
  bouncingBall: {
    borderRadius: 50,
    marginHorizontal: 4,
  },
  waveLoader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 20,
  },
  waveBar: {
    width: 4,
    marginHorizontal: 2,
    borderRadius: 2,
  },
});

export default {
  LoadingSpinner,
  Skeleton,
  CardSkeleton,
  ListSkeleton,
  ProgressBar,
  LoadingOverlay,
  PulseLoader,
  BouncingBalls,
  WaveLoader,
};