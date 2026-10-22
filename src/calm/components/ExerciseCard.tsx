import React from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';

import {border, colors, radius, space, text} from '../theme';

type Props = {
  title: string;
  blurb: string;
  onPress: () => void;
};

// One exercise on the Calm home screen.
export default function ExerciseCard({title, blurb, onPress}: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={blurb}
      style={({pressed}) => [styles.card, pressed && styles.pressed]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={text.body}>{blurb}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: border.width,
    borderColor: colors.line,
    padding: space.md,
    marginBottom: space.sm,
  },
  pressed: {backgroundColor: colors.selected},
  title: {...text.heading, marginBottom: space.xs},
});
