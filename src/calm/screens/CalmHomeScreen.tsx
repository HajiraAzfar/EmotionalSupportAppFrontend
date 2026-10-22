import React from 'react';
import {StyleSheet, Text} from 'react-native';

import CalmScreen from '../components/CalmScreen';
import ExerciseCard from '../components/ExerciseCard';
import {calm} from '../content';
import {space, text} from '../theme';

export type Exercise = 'breathing' | 'senses' | 'feet';
const EXERCISES: Exercise[] = ['breathing', 'senses', 'feet'];

type Props = {
  onOpen: (exercise: Exercise) => void;
  onBack: () => void;
};

export default function CalmHomeScreen({onOpen, onBack}: Props) {
  const c = calm.home;
  return (
    <CalmScreen title={c.title} backLabel={calm.common.back} onBack={onBack}>
      <Text style={styles.intro}>{c.intro}</Text>
      <Text style={styles.safety}>{c.safety}</Text>
      {EXERCISES.map(key => (
        <ExerciseCard
          key={key}
          title={c.exercises[key].title}
          blurb={c.exercises[key].blurb}
          onPress={() => onOpen(key)}
        />
      ))}
    </CalmScreen>
  );
}

const styles = StyleSheet.create({
  intro: {...text.body, marginBottom: space.sm},
  safety: {...text.small, marginBottom: space.lg},
});
