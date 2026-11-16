import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, Text, View} from 'react-native';
import Svg, {Circle} from 'react-native-svg';

import type {PhaseKind} from '../hooks/useBreathingSession';
import {colors, halo, motion, petals, ringTrack, text} from '../theme';

type Props = {
  // null before a session starts and after it ends: the flower rests closed.
  phase: PhaseKind | null;
  secondsLeft: number;
  running: boolean;
  // Keep the flower still and fade it, instead of opening and closing.
  reducedMotion: boolean;
  countdown: number | null;
  countdownLabel: string;
  // How much of the session has gone, 0 to 1, for the ring around the flower.
  elapsed?: number;
};

const SIZE = 290;
const PETAL = 120;
// How far a petal travels from the centre at the top of a breath.
const SPREAD = PETAL * 0.42;
const RING_R = SIZE / 2 - 5;
const RING_C = 2 * Math.PI * RING_R;

/**
 * The breathing flower: six soft, see-through petals that open outward and
 * turn a little on the in-breath, hold, and fold back on the out-breath, over
 * a halo that brightens with the breath. A thin ring around it fills as the
 * session goes on, and the phase's countdown sits in the middle.
 *
 * One value drives it all: it is re-aimed every second at the end of the
 * phase, linearly, so pausing freezes the flower where it is and resuming
 * carries on from there. It animates transform and opacity only, which run on
 * the native driver.
 */
export default function BreathingCircle({
  phase,
  secondsLeft,
  running,
  reducedMotion,
  countdown,
  countdownLabel,
  elapsed = 0,
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

  const range = (from: number, to: number) => progress.interpolate({inputRange: [0, 1], outputRange: [from, to]});
  const turn = (from: string, to: string) => progress.interpolate({inputRange: [0, 1], outputRange: [from, to]});

  const flowerStyle = reducedMotion
    ? {opacity: range(motion.fadeLow, motion.fadeHigh)}
    : {transform: [{rotate: turn('-30deg', '0deg')}]};

  return (
    <View style={styles.box}>
      {/* The halo: brighter and larger at the top of a breath. */}
      <Animated.View
        style={[
          styles.halo,
          reducedMotion
            ? {opacity: 0.6}
            : {opacity: range(0.35, 0.95), transform: [{scale: range(0.72, 1)}]},
        ]}
      />

      {/* The session so far, as a ring. */}
      <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={RING_R} stroke={ringTrack} strokeWidth={3} fill="none" />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RING_R}
          stroke={colors.primary}
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${RING_C} ${RING_C}`}
          strokeDashoffset={RING_C * (1 - Math.max(0, Math.min(1, elapsed)))}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </Svg>

      <Animated.View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.flower, flowerStyle]}>
        {petals.map((colour, i) => (
          <Animated.View
            key={i}
            style={[
              styles.petal,
              {backgroundColor: colour},
              {
                transform: [
                  {rotate: `${i * 60}deg`},
                  // Never fully closed: at the bottom of a breath (and at rest) a
                  // small flower still shows, not one blended dot.
                  {translateY: reducedMotion ? -SPREAD * 0.6 : range(-SPREAD * 0.22, -SPREAD)},
                  {scale: reducedMotion ? 0.8 : range(0.5, 1)},
                ],
              },
            ]}
          />
        ))}
      </Animated.View>

      {countdown !== null ? (
        <Text style={styles.count} accessibilityLabel={countdownLabel}>
          {countdown}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center'},
  halo: {
    position: 'absolute',
    width: SIZE - 24,
    height: SIZE - 24,
    borderRadius: SIZE,
    backgroundColor: halo,
  },
  flower: {
    position: 'absolute',
    width: PETAL,
    height: PETAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petal: {position: 'absolute', width: PETAL, height: PETAL, borderRadius: PETAL / 2},
  count: {
    ...text.countdown,
    color: colors.ink,
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowRadius: 12,
  },
});
