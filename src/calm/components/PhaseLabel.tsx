import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated';

import {space, text} from '../theme';

type Props = {
  label: string;
  detail?: string;
};

// The phase ("Breathe in") and a quieter line under it. The phase is a live
// region, so TalkBack reads each new one without reading every second.
export default function PhaseLabel({label, detail}: Props) {
  return (
    <View style={styles.wrap}>
      <Animated.View key={label} entering={FadeIn.duration(400)} exiting={FadeOut.duration(200)}>
        <Text accessibilityLiveRegion="polite" style={styles.label}>
          {label}
        </Text>
      </Animated.View>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {alignItems: 'center', marginTop: space.lg},
  label: {...text.title, fontSize: 26, textAlign: 'center'},
  detail: {...text.small, textAlign: 'center', marginTop: space.xs},
});
