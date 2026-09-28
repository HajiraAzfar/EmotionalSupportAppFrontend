import React from 'react';
import {Text, View} from 'react-native';

import FadeIn from './FadeIn';
import {colors, type} from '../theme';

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
                width: here ? 22 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: here ? colors.coral : done ? colors.blush : colors.line,
              }}
            />
          );
        })}
        <Text style={{...type.small, marginLeft: 8, fontSize: 12}}>
          {step} of {total}
        </Text>
      </View>
    </FadeIn>
  );
}
