import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {border, colors, radius, space, text} from '../theme';

type Props = {
  stepLabel: string;
  title: string;
  prompt: string;
};

// One step of a grounding exercise: which step, what to notice, and how.
export default function StepCard({stepLabel, title, prompt}: Props) {
  return (
    <View style={styles.card}>
      <Text style={text.small}>{stepLabel}</Text>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Text style={text.body}>{prompt}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: border.width,
    borderColor: colors.line,
    padding: space.lg,
  },
  title: {...text.heading, marginTop: space.sm, marginBottom: space.sm},
});
