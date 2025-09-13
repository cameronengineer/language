import React from 'react';
import { View, ViewProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  runOnJS,
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutDown,
  SlideInRight,
  SlideOutLeft,
  Layout,
  LinearTransition,
} from 'react-native-reanimated';

type AnimationType = 
  | 'fade' 
  | 'slide-up' 
  | 'slide-down' 
  | 'slide-left' 
  | 'slide-right' 
  | 'scale' 
  | 'bounce'
  | 'shake';

interface AnimatedViewProps extends ViewProps {
  children: React.ReactNode;
  animation?: AnimationType;
  duration?: number;
  delay?: number;
  autoPlay?: boolean;
  onAnimationComplete?: () => void;
  style?: any;
}

export function AnimatedView({
  children,
  animation = 'fade',
  duration = 300,
  delay = 0,
  autoPlay = true,
  onAnimationComplete,
  style,
  ...props
}: AnimatedViewProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const translateX = useSharedValue(50);
  const scale = useSharedValue(0.8);
  const rotate = useSharedValue(0);

  React.useEffect(() => {
    if (autoPlay) {
      const timer = setTimeout(() => {
        playAnimation();
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, delay]);

  const playAnimation = () => {
    const config = { duration };
    
    switch (animation) {
      case 'fade':
        opacity.value = withTiming(1, config, (finished) => {
          if (finished && onAnimationComplete) {
            runOnJS(onAnimationComplete)();
          }
        });
        break;
        
      case 'slide-up':
        opacity.value = withTiming(1, config);
        translateY.value = withTiming(0, config, (finished) => {
          if (finished && onAnimationComplete) {
            runOnJS(onAnimationComplete)();
          }
        });
        break;
        
      case 'slide-down':
        opacity.value = withTiming(1, config);
        translateY.value = withTiming(0, config, (finished) => {
          if (finished && onAnimationComplete) {
            runOnJS(onAnimationComplete)();
          }
        });
        break;
        
      case 'slide-left':
        opacity.value = withTiming(1, config);
        translateX.value = withTiming(0, config, (finished) => {
          if (finished && onAnimationComplete) {
            runOnJS(onAnimationComplete)();
          }
        });
        break;
        
      case 'slide-right':
        opacity.value = withTiming(1, config);
        translateX.value = withTiming(0, config, (finished) => {
          if (finished && onAnimationComplete) {
            runOnJS(onAnimationComplete)();
          }
        });
        break;
        
      case 'scale':
        opacity.value = withTiming(1, config);
        scale.value = withSpring(1, { damping: 10, stiffness: 100 }, (finished) => {
          if (finished && onAnimationComplete) {
            runOnJS(onAnimationComplete)();
          }
        });
        break;
        
      case 'bounce':
        opacity.value = withTiming(1, { duration: duration / 2 });
        scale.value = withSequence(
          withSpring(1.1, { damping: 8, stiffness: 200 }),
          withSpring(1, { damping: 8, stiffness: 200 }, (finished) => {
            if (finished && onAnimationComplete) {
              runOnJS(onAnimationComplete)();
            }
          })
        );
        break;
        
      case 'shake':
        opacity.value = withTiming(1, config);
        translateX.value = withSequence(
          withTiming(-10, { duration: duration / 8 }),
          withTiming(10, { duration: duration / 4 }),
          withTiming(-10, { duration: duration / 4 }),
          withTiming(10, { duration: duration / 4 }),
          withTiming(0, { duration: duration / 8 }, (finished) => {
            if (finished && onAnimationComplete) {
              runOnJS(onAnimationComplete)();
            }
          })
        );
        break;
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    const baseStyle = {
      opacity: opacity.value,
    };

    switch (animation) {
      case 'slide-up':
      case 'slide-down':
        return {
          ...baseStyle,
          transform: [{ translateY: translateY.value }],
        };
        
      case 'slide-left':
      case 'slide-right':
      case 'shake':
        return {
          ...baseStyle,
          transform: [{ translateX: translateX.value }],
        };
        
      case 'scale':
      case 'bounce':
        return {
          ...baseStyle,
          transform: [{ scale: scale.value }],
        };
        
      default:
        return baseStyle;
    }
  });

  // Initialize values based on animation type
  React.useEffect(() => {
    switch (animation) {
      case 'slide-up':
        translateY.value = 50;
        break;
      case 'slide-down':
        translateY.value = -50;
        break;
      case 'slide-left':
        translateX.value = 50;
        break;
      case 'slide-right':
        translateX.value = -50;
        break;
      case 'scale':
      case 'bounce':
        scale.value = 0.8;
        break;
    }
    opacity.value = 0;
  }, [animation]);

  return (
    <Animated.View
      style={[animatedStyle, style]}
      {...props}
    >
      {children}
    </Animated.View>
  );
}

// Predefined animated components with common animations
export function FadeInView({ children, delay = 0, duration = 300, ...props }: Omit<AnimatedViewProps, 'animation'>) {
  return (
    <AnimatedView animation="fade" delay={delay} duration={duration} {...props}>
      {children}
    </AnimatedView>
  );
}

export function SlideInView({ children, direction = 'up', delay = 0, duration = 300, ...props }: Omit<AnimatedViewProps, 'animation'> & { direction?: 'up' | 'down' | 'left' | 'right' }) {
  const animation = `slide-${direction}` as AnimationType;
  return (
    <AnimatedView animation={animation} delay={delay} duration={duration} {...props}>
      {children}
    </AnimatedView>
  );
}

export function ScaleInView({ children, delay = 0, duration = 300, ...props }: Omit<AnimatedViewProps, 'animation'>) {
  return (
    <AnimatedView animation="scale" delay={delay} duration={duration} {...props}>
      {children}
    </AnimatedView>
  );
}

export function BounceInView({ children, delay = 0, duration = 600, ...props }: Omit<AnimatedViewProps, 'animation'>) {
  return (
    <AnimatedView animation="bounce" delay={delay} duration={duration} {...props}>
      {children}
    </AnimatedView>
  );
}

export function ShakeView({ children, duration = 500, ...props }: Omit<AnimatedViewProps, 'animation' | 'autoPlay'>) {
  return (
    <AnimatedView animation="shake" duration={duration} autoPlay={false} {...props}>
      {children}
    </AnimatedView>
  );
}

// Layout transition components
export const AnimatedLayoutView = Animated.createAnimatedComponent(View);

export function LayoutTransitionView({ children, ...props }: ViewProps) {
  return (
    <AnimatedLayoutView
      layout={LinearTransition.springify().damping(15).stiffness(150)}
      {...props}
    >
      {children}
    </AnimatedLayoutView>
  );
}