import React from 'react';
import {StyleSheet, Text} from 'react-native';

import CalmScreen from '../components/CalmScreen';
import ExerciseCard from '../components/ExerciseCard';
import {calm} from '../content';
import {ActivityId} from '../hooks/useGroundYourself';
import {space, text} from '../theme';

// Everything Calm can open: an exercise, or the pick-by-need list.
export type Exercise = ActivityId;
type Listed = 'breathing' | 'senses' | 'feet' | 'bodyScan' | 'pmr';
const EXERCISES: Listed[] = ['breathing', 'senses', 'feet', 'bodyScan', 'pmr'];

type Props = {
  onOpen: (exercise: Exercise) => void;
  onOpenGroundYourself: () => void;
  onBack: () => void;
};

export default function CalmHomeScreen({onOpen, onOpenGroundYourself, onBack}: Props) {
  const c = calm.home;
  return (
    <CalmScreen title={c.title} backLabel={calm.common.back} onBack={onBack}>
      <Text style={styles.intro}>{c.intro}</Text>
      <Text style={styles.safety}>{c.safety}</Text>
      <ExerciseCard
        title={c.groundYourself.title}
        blurb={c.groundYourself.blurb}
        onPress={onOpenGroundYourself}
      />
      <Text accessibilityRole="header" style={styles.section}>
        {c.exercisesLabel}
      </Text>
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
  section: {...text.heading, marginTop: space.md, marginBottom: space.sm},
});
