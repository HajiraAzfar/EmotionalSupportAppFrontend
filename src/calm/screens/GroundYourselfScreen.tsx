import React from 'react';
import {StyleSheet, Text} from 'react-native';

import CalmScreen from '../components/CalmScreen';
import ChoiceChips from '../components/ChoiceChips';
import ExerciseCard from '../components/ExerciseCard';
import {calm} from '../content';
import {
  ActivityId,
  NEED_CHOICES,
  TIME_CHOICES,
  useGroundYourself,
} from '../hooks/useGroundYourself';
import {space, text} from '../theme';

type Props = {
  onOpen: (activity: ActivityId) => void;
  onBack: () => void;
};

export default function GroundYourselfScreen({onOpen, onBack}: Props) {
  const c = calm.groundYourself;
  const {need, setNeed, time, setTime, activities} = useGroundYourself();

  return (
    <CalmScreen title={c.title} backLabel={calm.common.back} onBack={onBack}>
      <Text style={styles.intro}>{c.intro}</Text>
      <ChoiceChips
        label={c.needLabel}
        options={NEED_CHOICES.map(key => ({key, label: c.needs[key]}))}
        selected={need}
        onSelect={setNeed}
      />
      <ChoiceChips
        label={c.timeLabel}
        options={TIME_CHOICES.map(key => ({key, label: c.times[key]}))}
        selected={time}
        onSelect={setTime}
      />
      {activities.map(activity => (
        <ExerciseCard
          key={activity.id}
          title={c.activities[activity.id].title}
          blurb={c.meta(c.activities[activity.id].blurb, activity.minutes)}
          onPress={() => onOpen(activity.id)}
        />
      ))}
      {!activities.length ? <Text style={styles.none}>{c.none}</Text> : null}
    </CalmScreen>
  );
}

const styles = StyleSheet.create({
  intro: {...text.body, marginBottom: space.lg},
  none: {...text.body, textAlign: 'center', marginTop: space.md},
});
