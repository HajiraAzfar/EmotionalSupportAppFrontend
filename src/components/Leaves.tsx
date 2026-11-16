import React from 'react';
import {StyleSheet, View} from 'react-native';
import Svg, {Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop} from 'react-native-svg';

import {colors} from '../theme';

type Pt = [number, number];
type Stem = [Pt, Pt, Pt, Pt];

// The point at t along a cubic stem, and its heading in degrees clockwise from
// straight up, so a leaf can be turned to grow out of it.
function along([a, b, c, d]: Stem, t: number) {
  const u = 1 - t;
  const at = (i: 0 | 1) => u * u * u * a[i] + 3 * u * u * t * b[i] + 3 * u * t * t * c[i] + t * t * t * d[i];
  const slope = (i: 0 | 1) => 3 * u * u * (b[i] - a[i]) + 6 * u * t * (c[i] - b[i]) + 3 * t * t * (d[i] - c[i]);
  return {x: at(0), y: at(1), heading: (Math.atan2(slope(0), -slope(1)) * 180) / Math.PI};
}

// A pointed leaf growing straight up from its base at 0,0.
const leaf = (l: number, w: number) =>
  `M0 0C${w} ${-l * 0.3} ${w * 0.7} ${-l * 0.78} 0 ${-l}C${-w * 0.7} ${-l * 0.78} ${-w} ${-l * 0.3} 0 0Z`;

function Sprig({stem, count, size, fill}: {stem: Stem; count: number; size: number; fill: string}) {
  const [a, b, c, d] = stem;
  const tip = along(stem, 1);
  return (
    <G>
      <Path
        d={`M${a[0]} ${a[1]}C${b[0]} ${b[1]} ${c[0]} ${c[1]} ${d[0]} ${d[1]}`}
        stroke={colors.sage}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
      {Array.from({length: count}, (_, i) => {
        const t = 0.12 + (i * 0.8) / count;
        const p = along(stem, t);
        // Alternate sides, smaller towards the tip.
        const l = size * (1 - t * 0.4);
        return (
          <G key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.heading + (i % 2 ? 52 : -52)})`}>
            <Path d={leaf(l, l * 0.32)} fill={`url(#${fill})`} />
            <Path d={`M0 0L0 ${-l * 0.85}`} stroke={colors.sage} strokeWidth={1} opacity={0.45} />
          </G>
        );
      })}
      <G transform={`translate(${tip.x} ${tip.y}) rotate(${tip.heading})`}>
        <Path d={leaf(size * 0.6, size * 0.2)} fill={`url(#${fill})`} />
      </G>
    </G>
  );
}

const BACK: Stem = [[150, 300], [120, 240], [72, 200], [42, 118]];
const FRONT: Stem = [[192, 300], [182, 222], [150, 150], [142, 46]];
const bud = along(BACK, 1);

/** Two sprigs over a pale wash, drawn once in a 240 × 300 box. */
function Corner() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 240 300">
      <Defs>
        <RadialGradient id="wash" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={colors.leaf} stopOpacity={0.55} />
          <Stop offset="1" stopColor={colors.leaf} stopOpacity={0} />
        </RadialGradient>
        {/* Deeper at the base of a leaf, paler at the tip. */}
        <LinearGradient id="deep" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor="#6F8E6A" />
          <Stop offset="1" stopColor="#B3C7AA" />
        </LinearGradient>
        <LinearGradient id="pale" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor={colors.accentSoft} />
          <Stop offset="1" stopColor={colors.sageWash} />
        </LinearGradient>
      </Defs>
      <Ellipse cx={150} cy={250} rx={130} ry={100} fill="url(#wash)" />
      <G opacity={0.75}>
        <Sprig stem={BACK} count={7} size={50} fill="pale" />
        <Circle cx={bud.x} cy={bud.y - 4} r={8} fill={colors.coral} />
        <Circle cx={bud.x - 2} cy={bud.y - 6} r={3} fill={colors.blush} />
      </G>
      <G opacity={0.8}>
        <Sprig stem={FRONT} count={9} size={60} fill="deep" />
      </G>
    </Svg>
  );
}

/**
 * The journals' botanical corners, as in the design: soft sage sprigs growing
 * up from the bottom of the page, larger on the right, a smaller mirrored one
 * on the left. They sit behind everything, so they show only where a screen
 * leaves the page empty, and white cards cover them.
 */
export default function Leaves() {
  return (
    <>
      <View style={styles.right} pointerEvents="none">
        <Corner />
      </View>
      <View style={styles.left} pointerEvents="none">
        <Corner />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  right: {position: 'absolute', right: -18, bottom: -6, width: 220, height: 275},
  left: {position: 'absolute', left: -24, bottom: -6, width: 140, height: 175, opacity: 0.7, transform: [{scaleX: -1}]},
});
