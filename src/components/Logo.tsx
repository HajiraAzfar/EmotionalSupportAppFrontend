import React from 'react';
import {Image} from 'react-native';

import {brandImages} from '../assets/brand';
import {colors} from '../theme';

type Props = {
  size?: number;
  // The mark is one white image, tinted, so it reads on any background.
  color?: string;
};

// The Mind Doc mark: a thoughtful profile with a brain and a growing leaf,
// from the brand's line art.
export default function Logo({size = 48, color = colors.accent}: Props) {
  return (
    <Image
      source={brandImages.mark}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="Mind Doc"
      style={{width: size, height: size, tintColor: color}}
    />
  );
}
