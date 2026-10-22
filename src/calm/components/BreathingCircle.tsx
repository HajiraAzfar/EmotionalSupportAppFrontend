import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, Text, View} from 'react-native';

import type {PhaseKind} from '../hooks/useBreathingSession';
import {border, circle, colors, motion, text} from '../theme';

type Props = {
  // null before a session starts and after it ends: the circle rests small.
  phase: PhaseKind | null;
  secondsLeft: number;
  running: boolean;
  // Keep the circle one size and fade it, instead of growing and shrinking.
  reducedMotion: boolean;
  countdown: number | null;
  countdownLabel: string;
};

const MIN_SCALE = circle.min / circle.max;
const REST_SCALE = (MIN_SCALE + 1) / 2;

/**
 * A circle that grows on the in-breath, holds, and shrinks on the out-breath,
 * with the phase's countdown at its centre.
 *
 * The animation is re-aimed every second at the end of the phase, linearly,
 * so pausing freezes it where it is and resuming carries on from there. It
 * animates transform and opacity only, which run on the native driver.
 */
export default function BreathingCircle({
  phase,
  secondsLeft,
  running,
  reducedMotion,
  countdown,
  countdownLabel,
}: Props) {
  // 0 is the bottom of a breath, 1 the top.
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (phase === null) {
      progress.setValue(0);
      return;
    }
    if (!running || phase === 'hold') {
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: phase === 'inhale' ? 1 : 0,
      duration: secondsLeft * 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, phase, secondsLeft, running]);

  const motionStyle = reducedMotion
    ? {
        opacity: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [motion.fadeLow, motion.fadeHigh],
        }),
        transform: [{scale: REST_SCALE}],
      }
    : {
        transform: [
          {scale: progress.interpolate({inputRange: [0, 1], outputRange: [MIN_SCALE, 1]})},
        ],
      };

  return (
    <View style={styles.box}>
      <Animated.View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[StyleSheet.absoluteFill, styles.circle, motionStyle]}
      />
      {countdown !== null ? (
        <Text style={text.countdown} accessibilityLabel={countdownLabel}>
          {countdown}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: circle.max,
    height: circle.max,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    borderRadius: circle.max / 2,
    backgroundColor: colors.circle,
    borderWidth: border.width,
    borderColor: colors.circleEdge,
  },
});
