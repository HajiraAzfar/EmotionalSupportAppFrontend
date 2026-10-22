import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

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
      <Text accessibilityLiveRegion="polite" style={styles.label}>
        {label}
      </Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {alignItems: 'center', marginTop: space.lg},
  label: {...text.heading, textAlign: 'center'},
  detail: {...text.small, textAlign: 'center', marginTop: space.xs},
});
