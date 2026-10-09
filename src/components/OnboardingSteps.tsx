import React from 'react';
import {Text, View} from 'react-native';

import FadeIn from './FadeIn';
import {colors, radius, type} from '../theme';

type Props = {
  step: number;
  total?: number;
};

// Where she is in setting the app up. Six screens is not many, but not knowing
// how many are left is what makes a form feel long.
export default function OnboardingSteps({step, total = 6}: Props) {
  return (
    <FadeIn order={0}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 18}}>
        {Array.from({length: total}, (_, index) => {
          const done = index < step;
          const here = index === step - 1;
          return (
            <View
              key={index}
              style={{
                width: here ? 18 : 6,
                height: 6,
                borderRadius: radius.pill,
                backgroundColor: here ? colors.accent : done ? colors.accentSoft : colors.muted,
              }}
            />
          );
        })}
        <Text style={{...type.tiny, marginLeft: 8}}>
          {step} of {total}
        </Text>
      </View>
    </FadeIn>
  );
}
