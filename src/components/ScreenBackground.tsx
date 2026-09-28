import React from 'react';
import {StyleSheet, View} from 'react-native';
import Svg, {Circle, Defs, Ellipse, RadialGradient, Stop} from 'react-native-svg';

import {colors} from '../theme';

type Props = {
  // The welcome and splash screens carry a stronger wash than a working
  // screen, where it has to sit behind text all day.
  intensity?: 'quiet' | 'full';
};

/**
 * The soft wash behind every screen: wide pools of colour on the dark page.
 * It is what makes the translucent cards read as glass — over a flat colour
 * there would be nothing for them to be translucent against.
 *
 * Drawn once, behind everything, and it never re-renders: no animation, no
 * state, nothing for a slow phone to keep up with.
 */
export default function ScreenBackground({intensity = 'quiet'}: Props) {
  const full = intensity === 'full';
  const k = full ? 1.7 : 1;

  return (
    <View style={[StyleSheet.absoluteFill, {backgroundColor: colors.bg}]} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="poolPink" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={colors.accent} stopOpacity={0.30 * k} />
            <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="poolPurple" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={colors.accentSoft} stopOpacity={0.28 * k} />
            <Stop offset="1" stopColor={colors.accentSoft} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="poolCoral" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={colors.coral} stopOpacity={0.20 * k} />
            <Stop offset="1" stopColor={colors.coral} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="poolBlush" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={colors.blush} stopOpacity={0.16 * k} />
            <Stop offset="1" stopColor={colors.blush} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* Percentages, so the same wash fits any screen size. */}
        <Ellipse cx="14%" cy="8%" rx="66%" ry="26%" fill="url(#poolPink)" />
        <Ellipse cx="96%" cy="30%" rx="60%" ry="28%" fill="url(#poolPurple)" />
        <Ellipse cx="6%" cy="58%" rx="56%" ry="24%" fill="url(#poolBlush)" />
        <Ellipse cx="72%" cy="88%" rx="72%" ry="28%" fill="url(#poolCoral)" />

        {/* A few faint bubbles, so the glass has something to catch. */}
        {full ? (
          <>
            <Circle cx="82%" cy="14%" r="46" fill={colors.accent} opacity={0.10} />
            <Circle cx="12%" cy="40%" r="22" fill={colors.blush} opacity={0.10} />
            <Circle cx="88%" cy="62%" r="30" fill={colors.accentSoft} opacity={0.10} />
          </>
        ) : null}
      </Svg>
    </View>
  );
}
