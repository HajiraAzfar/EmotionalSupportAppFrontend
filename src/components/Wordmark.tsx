import React from 'react';
import {Text, View} from 'react-native';

import {colors, font, type} from '../theme';

type Props = {
  // The splash shows the name larger than the welcome screen does.
  size?: 'large' | 'medium';
};

// "Reframe" in the serif, with the brand's tagline under it.
export default function Wordmark({size = 'medium'}: Props) {
  const large = size === 'large';
  return (
    <View style={{alignItems: 'center'}} accessible accessibilityLabel="Reframe. Mindful today. Better tomorrow.">
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
