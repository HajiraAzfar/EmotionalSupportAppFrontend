import React, {useEffect, useRef} from 'react';
import {Animated, ViewStyle} from 'react-native';

type Props = {
  children: React.ReactNode;
  // Stagger a list by passing 0, 1, 2… rather than working out milliseconds.
  order?: number;
  // How far it rises as it appears.
  distance?: number;
  style?: ViewStyle;
};

const STEP_MS = 90;
const DURATION_MS = 380;

/**
 * A short fade and rise when something first appears. Used on the screens a
 * new user meets, so the app arrives gently rather than snapping into place.
 *
 * It animates opacity and transform only, which the native driver can run off
 * the JS thread — on a slow device the animation still does not stutter.
 */
export default function FadeIn({children, order = 0, distance = 12, style}: Props) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: DURATION_MS,
      delay: order * STEP_MS,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, order]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [distance, 0],
              }),
            },
          ],
        },
      ]}>
      {children}
    </Animated.View>
  );
}