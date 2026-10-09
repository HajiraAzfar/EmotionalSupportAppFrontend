import React from 'react';
import {Pressable} from 'react-native';
import {ArrowLeft} from 'lucide-react-native';

import {colors, glass, radius} from '../theme';

// The round glass back arrow at the top left of every inner screen.
export default function BackButton({onPress}: {onPress: () => void}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Back"
      style={({pressed}) => ({
        ...glass,
        width: 40,
        height: 40,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}>
      <ArrowLeft size={20} color={colors.ink} />
    </Pressable>
  );
}
