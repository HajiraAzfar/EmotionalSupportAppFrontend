import React from 'react';
import {Image, View} from 'react-native';

import {brandImages} from '../assets/brand';
import {colors, radius} from '../theme';

type Props = {
  size?: number;
  // The mark is one white image, tinted, so it reads on any background.
  color?: string;
  // The app-icon form: the mark in ivory on a deep forest circle.
  badge?: boolean;
};

// The Reframe mark: a thoughtful profile with a growing leaf, from the brand's
// line art.
export default function Logo({size = 48, color = colors.accent, badge = false}: Props) {
  const mark = (
    <Image
      source={brandImages.mark}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="Reframe"
      style={{
        width: badge ? size * 0.62 : size,
        height: badge ? size * 0.62 : size,
        tintColor: badge ? colors.bg : color,
      }}
    />
  );
  if (!badge) {
    return mark;
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.pill,
        backgroundColor: colors.ink,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {mark}
    </View>
  );
}
