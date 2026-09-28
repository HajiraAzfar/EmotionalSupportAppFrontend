import React from 'react';
import {Text, View} from 'react-native';
import Svg, {Circle} from 'react-native-svg';

import {colors, type} from '../../theme';

type Props = {
  // What the number in the middle is.
  value: number;
  // How full the ring is, 0 to 1. Left out, the ring is drawn full.
  fraction?: number;
  size?: number;
  caption?: string;
};

const STROKE = 8;

// A count in a ring. The ring is decoration: the number is the fact (FR-INS-007).
export default function ProgressRing({value, fraction = 1, size = 96, caption}: Props) {
  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = Math.max(0, Math.min(1, fraction)) * circumference;

  return (
    <View style={{width: size, alignItems: 'center'}}>
      <View style={{width: size, height: size}}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.line}
            strokeWidth={STROKE}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.accent}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${filled} ${circumference}`}
            // Start at the top rather than at three o'clock.
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={{...type.title, fontSize: 28}}>{value}</Text>
        </View>
      </View>
      {caption ? (
        <Text style={{...type.small, marginTop: 6, textAlign: 'center'}}>{caption}</Text>
      ) : null}
    </View>
  );
}
