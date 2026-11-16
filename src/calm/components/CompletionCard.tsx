import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';

import CalmButton from './CalmButton';
import {illustrations} from '../../assets/brand';
import FadeIn from '../../components/FadeIn';
import {space, text} from '../theme';

type Props = {
  title: string;
  body: string;
  againLabel: string;
  backLabel: string;
  onAgain: () => void;
  onBack: () => void;
};

// The quiet end of an exercise: a calm window, a line of acknowledgement and
// two ways on, arriving one after another.
export default function CompletionCard({title, body, againLabel, backLabel, onAgain, onBack}: Props) {
  return (
    <View style={styles.wrap}>
      <FadeIn order={0} distance={18} style={styles.centre}>
        <Image source={illustrations.arch} resizeMode="contain" accessible={false} style={styles.art} />
      </FadeIn>
      <FadeIn order={1}>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        <Text style={styles.body}>{body}</Text>
      </FadeIn>
      <FadeIn order={2}>
        <View style={styles.row}>
          <CalmButton label={againLabel} onPress={onAgain} />
        </View>
        <View style={styles.row}>
          <CalmButton label={backLabel} onPress={onBack} variant="secondary" />
        </View>
      </FadeIn>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {flex: 1, justifyContent: 'center'},
  centre: {alignItems: 'center'},
  art: {width: 250, height: 177, marginBottom: space.lg},
  title: {...text.title, fontSize: 28, textAlign: 'center'},
  body: {...text.body, fontSize: 16, textAlign: 'center', marginTop: space.sm, marginBottom: space.xl},
  row: {flexDirection: 'row', marginBottom: space.sm},
});
