import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import CalmButton from './CalmButton';
import {space, text} from '../theme';

type Props = {
  title: string;
  body: string;
  againLabel: string;
  backLabel: string;
  onAgain: () => void;
  onBack: () => void;
};

// The quiet end of an exercise: a line of acknowledgement and two ways on.
export default function CompletionCard({title, body, againLabel, backLabel, onAgain, onBack}: Props) {
  return (
    <View style={styles.wrap}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Text style={styles.body}>{body}</Text>
      <View style={styles.row}>
        <CalmButton label={againLabel} onPress={onAgain} />
      </View>
      <View style={styles.row}>
        <CalmButton label={backLabel} onPress={onBack} variant="secondary" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {flex: 1, justifyContent: 'center'},
  title: {...text.title, textAlign: 'center'},
  body: {...text.body, textAlign: 'center', marginTop: space.sm, marginBottom: space.xl},
  row: {flexDirection: 'row', marginBottom: space.sm},
});
