import React from 'react';
import {ActivityIndicator, Pressable, Text} from 'react-native';
import {ArrowRight} from 'lucide-react-native';

import {colors, gradient, radius, shadow, type} from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
};

// The violet gradient pill with an arrow, as on every call to action in the
// design.
export default function PrimaryButton({label, onPress, busy, disabled}: Props) {
  const inactive = busy || disabled;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={({pressed}) => ({
        ...(inactive
          ? {backgroundColor: colors.accentSoft}
          : {backgroundImage: gradient.primary, ...shadow.button}),
        opacity: pressed ? 0.85 : 1,
        borderRadius: radius.pill,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      })}>
      {busy ? (
        <ActivityIndicator color={colors.onAccent} />
      ) : (
        <>
          <Text style={{...type.label, color: colors.onAccent}}>{label}</Text>
          <ArrowRight size={18} color={colors.onAccent} />
        </>
      )}
    </Pressable>
  );
}
