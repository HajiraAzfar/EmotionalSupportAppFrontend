import React from 'react';
import {ActivityIndicator, Pressable, Text} from 'react-native';

import {colors, gradient, radius, shadow, type} from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
};

// The primary purple pill, as on every call to action in the brand brief:
// a subtle gradient, a soft shadow, and the label alone.
export default function PrimaryButton({label, onPress, busy, disabled}: Props) {
  const inactive = busy || disabled;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{disabled: !!inactive, busy: !!busy}}
      style={({pressed}) => ({
        ...(inactive
          ? {backgroundColor: colors.accentSoft}
          : {backgroundImage: gradient.primary, ...shadow.button}),
        opacity: pressed ? 0.85 : 1,
        borderRadius: radius.pill,
        paddingVertical: 16,
        minHeight: 52,
        alignItems: 'center',
        justifyContent: 'center',
      })}>
      {busy ? (
        <ActivityIndicator color={colors.onAccent} />
      ) : (
        <Text style={{...type.label, color: colors.onAccent}}>{label}</Text>
      )}
    </Pressable>
  );
}
