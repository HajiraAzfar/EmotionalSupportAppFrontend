import React from 'react';
import {StyleSheet, Text} from 'react-native';
import Animated, {FadeIn, FadeInRight, FadeOutLeft} from 'react-native-reanimated';

import {cardShadow, colors, radius, space, text} from '../theme';

type Props = {
  // Changing it brings the next card in from the right as the last one leaves.
  stepKey: string;
  // The first card settles in place rather than sliding.
  first?: boolean;
  stepLabel: string;
  title: string;
  prompt: string;
};

const IN_MS = 320;
const OUT_MS = 180;

// One step of a grounding exercise: which step, what to notice, and how. The
// animation is Reanimated's layout animation, on the UI thread, and it follows
// the phone's reduce-motion setting by default.
export default function StepCard({stepKey, first, stepLabel, title, prompt}: Props) {
  return (
    <Animated.View
      key={stepKey}
      entering={first ? FadeIn.duration(IN_MS) : FadeInRight.duration(IN_MS)}
      exiting={FadeOutLeft.duration(OUT_MS)}
      style={styles.card}>
      <Text style={styles.step}>{stepLabel}</Text>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Text style={styles.prompt}>{prompt}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card + 10,
    padding: space.lg,
    paddingVertical: space.xl,
    ...cardShadow,
  },
  step: {...text.small, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.primary},
  title: {...text.title, fontSize: 26, lineHeight: 34, marginTop: space.sm, marginBottom: space.md},
  prompt: {...text.body, fontSize: 17, lineHeight: 27},
});
