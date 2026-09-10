import React from 'react';
import {ActivityIndicator, Pressable, Text} from 'react-native';

import {colors, radius, type} from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
};

export default function PrimaryButton({label, onPress, busy, disabled}: Props) {
  const inactive = busy || disabled;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={({pressed}) => ({
        backgroundColor: inactive ? colors.sage : colors.forest,
        opacity: pressed ? 0.85 : 1,
        borderRadius: radius.pill,
        paddingVertical: 17,
        alignItems: 'center',
      })}>
      {busy ? (
        <ActivityIndicator color={colors.surface} />
      ) : (
        <Text style={{...type.label, color: colors.surface, fontSize: 16}}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}