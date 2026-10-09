import React from 'react';
import Svg, {Defs, LinearGradient, Path, Stop} from 'react-native-svg';

import {logoColours} from '../theme';

type Props = {
  size?: number;
};

// The Mind Doc mark: a rounded ribbon "M" running blue, violet, pink.
// ponytail: redrawn by eye from a low-res brand board; swap in the original
// artwork (SVG) when it exists.
export default function Logo({size = 48}: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel="Mind Doc">
      <Defs>
        <LinearGradient id="mindDocM" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={logoColours[0]} />
          <Stop offset="0.5" stopColor={logoColours[1]} />
          <Stop offset="1" stopColor={logoColours[2]} />
        </LinearGradient>
      </Defs>
      <Path
        d="M20 76 V28 L50 60 L80 28 V76"
        stroke="url(#mindDocM)"
        strokeWidth={17}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
