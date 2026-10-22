import React from 'react';
import {Text, View} from 'react-native';

import {colors, font, type} from '../theme';

type Props = {
  // The splash shows the name larger than the welcome screen does.
  size?: 'large' | 'medium';
};

// "Mind Doc" in the serif, with the brand's three words under it.
export default function Wordmark({size = 'medium'}: Props) {
  const large = size === 'large';
  return (
    <View style={{alignItems: 'center'}} accessible accessibilityLabel="Mind Doc. Heal, reflect, grow.">
      <Text style={{...type.display, fontSize: large ? 40 : 34}}>Mind Doc</Text>
      <Text
        style={{
          fontFamily: font.medium,
          fontSize: 12,
          letterSpacing: 3,
          color: colors.inkSoft,
          marginTop: 6,
        }}>
        HEAL · REFLECT · GROW
      </Text>
    </View>
  );
}
