import React from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';

import {colors, motion, radius, space, text, touch} from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  // When the visible label alone would be unclear to a screen reader.
  accessibilityLabel?: string;
};

// A full-width button; put two in a row and they share the width.
export default function CalmButton({label, onPress, variant = 'primary', accessibilityLabel}: Props) {
  const primary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({pressed}) => [
        styles.base,
        primary ? styles.primary : styles.secondary,
        pressed && styles.pressed,
      ]}>
      <Text style={[text.button, primary ? styles.primaryLabel : styles.secondaryLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    minHeight: touch.minHeight,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  primary: {backgroundColor: colors.primary},
  secondary: {backgroundColor: colors.selected},
  pressed: {opacity: motion.pressedOpacity},
  primaryLabel: {color: colors.onPrimary},
  secondaryLabel: {color: colors.primary},
});
