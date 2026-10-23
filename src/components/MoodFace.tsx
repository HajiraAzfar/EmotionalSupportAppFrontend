import React from 'react';
import Svg, {Circle, Path} from 'react-native-svg';

import {colors, moodColours} from '../theme';

type Props = {
  // 1 (the hardest) to 5 (the best), as on the mood scale.
  level: number;
  size?: number;
};

// Line-drawn features on a 48 × 48 face, one set per point of the scale.
const FACES: {eyes: 'dots' | 'smiling'; brows?: string; mouth: string; cheeks?: boolean}[] = [
  {eyes: 'dots', brows: 'M13 16 Q16 12.5 20 13.5 M35 16 Q32 12.5 28 13.5', mouth: 'M16 34 Q24 27 32 34'},
  {eyes: 'dots', mouth: 'M17 33 Q24 29.5 31 33'},
  {eyes: 'dots', mouth: 'M17.5 31 L30.5 31'},
  {eyes: 'dots', mouth: 'M17 29 Q24 34.5 31 29', cheeks: true},
  {eyes: 'smiling', mouth: 'M15.5 28 Q24 37.5 32.5 28', cheeks: true},
];

/**
 * A soft drawn face for a point on the mood scale, in that point's colour.
 * Drawn rather than an emoji, so it matches the brand on every phone instead
 * of each manufacturer's own emoji set.
 */
export default function MoodFace({level, size = 48}: Props) {
  const index = Math.max(1, Math.min(5, Math.round(level))) - 1;
  const face = FACES[index];
  const line = {stroke: colors.inkSoft, strokeWidth: 2.2, strokeLinecap: 'round' as const, fill: 'none'};
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessible={false}>
      <Circle cx={24} cy={24} r={22} fill={moodColours[index]} />
      {face.cheeks ? (
        <>
          <Circle cx={13} cy={28} r={3.2} fill={colors.coral} opacity={0.55} />
          <Circle cx={35} cy={28} r={3.2} fill={colors.coral} opacity={0.55} />
        </>
      ) : null}
      {face.eyes === 'dots' ? (
        <>
          <Circle cx={17.5} cy={21} r={2.2} fill={colors.inkSoft} />
          <Circle cx={30.5} cy={21} r={2.2} fill={colors.inkSoft} />
        </>
      ) : (
        <Path d="M14 22 Q17.5 17.5 21 22 M27 22 Q30.5 17.5 34 22" {...line} />
      )}
      {face.brows ? <Path d={face.brows} {...line} strokeWidth={1.8} /> : null}
      <Path d={face.mouth} {...line} />
    </Svg>
  );
}
