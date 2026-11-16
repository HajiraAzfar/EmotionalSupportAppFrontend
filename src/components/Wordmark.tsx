import React from 'react';
import {Text, View} from 'react-native';

import Logo from './Logo';
import {colors, font, type} from '../theme';

type Props = {
  // The splash shows the name larger than the welcome screen does.
  size?: 'large' | 'medium';
  // The logo above the name: only where the screen has room for it (the
  // splash). Welcome and Settings are full enough without it.
  withLogo?: boolean;
};

// "Reframe" in the serif and the brand's tagline, with the logo above on request.
export default function Wordmark({size = 'medium', withLogo = false}: Props) {
  const large = size === 'large';
  return (
    <View style={{alignItems: 'center'}} accessible accessibilityLabel="Reframe. Mindful today. Better tomorrow.">
      {withLogo ? (
        <View style={{marginBottom: 14}}>
          <Logo size={large ? 88 : 64} />
        </View>
      ) : null}
      <Text style={{...type.display, fontSize: large ? 40 : 34}}>Reframe</Text>
      <Text
        style={{
          fontFamily: font.medium,
          fontSize: 13,
          letterSpacing: 0.5,
          color: colors.inkSoft,
          marginTop: 6,
        }}>
        Mindful today. Better tomorrow.
      </Text>
    </View>
  );
}
