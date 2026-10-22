import React from 'react';
import {View, ViewStyle} from 'react-native';
import {SvgXml} from 'react-native-svg';

import {art, IllustrationName} from './art';

type Props = {
  name: IllustrationName;
  // Width; the height follows the artwork's 320 × 220 frame unless given.
  width?: number | `${number}%`;
  height?: number;
  style?: ViewStyle;
};

// One of the brand's drawn scenes. Decorative, so screen readers skip it.
export default function Illustration({name, width = '100%', height, style}: Props) {
  return (
    <View
      style={[{width, aspectRatio: height ? undefined : 320 / 220, height}, style]}
      accessible={false}
      importantForAccessibility="no-hide-descendants">
      <SvgXml xml={art[name]} width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
    </View>
  );
}
