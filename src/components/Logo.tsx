import React from 'react';
import {Image, View} from 'react-native';

import {brandImages} from '../assets/brand';
import {colors} from '../theme';

type Props = {
  size?: number;
};

// Reframe's one logo, everywhere it appears: the head-and-leaf mark in ivory on
// a deep forest tile, the same as the app icon on the phone's home screen.
export default function Logo({size = 64}: Props) {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Reframe"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.26,
        backgroundColor: colors.ink,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Image
        source={brandImages.mark}
        resizeMode="contain"
        style={{width: size * 0.62, height: size * 0.62, tintColor: colors.bg}}
      />
    </View>
  );
}
