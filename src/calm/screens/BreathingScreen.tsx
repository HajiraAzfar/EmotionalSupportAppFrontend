import React from 'react';
import {StyleSheet, View} from 'react-native';

import BreathingCircle from '../components/BreathingCircle';
import CalmButton from '../components/CalmButton';
import CalmScreen from '../components/CalmScreen';
import CompletionCard from '../components/CompletionCard';
import OptionRow from '../components/OptionRow';
import PhaseLabel from '../components/PhaseLabel';
import {calm} from '../content';
import {DURATIONS, PATTERN_IDS, useBreathingSession} from '../hooks/useBreathingSession';
import {useReducedMotion} from '../hooks/useReducedMotion';
import {space} from '../theme';

type Props = {
  onBack: () => void;
};

export default function BreathingScreen({onBack}: Props) {
  const session = useBreathingSession();
  const reducedMotion = useReducedMotion();
  const c = calm.breathing;

  if (session.status === 'done') {
    return (
      <CalmScreen backLabel={calm.common.back} onBack={onBack}>
        <CompletionCard
          title={calm.done.title}
          body={calm.done.body}
          againLabel={calm.done.again}
          backLabel={calm.done.back}
          onAgain={session.start}
          onBack={onBack}
        />
      </CalmScreen>
    );
  }

  const active = session.status === 'running' || session.status === 'paused';
  const label =
    session.status === 'idle'
      ? c.ready
      : session.status === 'paused'
      ? c.paused
      : c.phases[session.phase];

  return (
    <CalmScreen title={c.title} backLabel={calm.common.back} onBack={onBack}>
      <OptionRow
        label={c.patternLabel}
        options={PATTERN_IDS.map(id => ({key: id, label: c.patterns[id].name}))}
        selected={session.patternId}
        onSelect={session.choosePattern}
        disabled={active}
        note={c.patterns[session.patternId].detail}
      />
      <OptionRow
        label={c.durationLabel}
        options={DURATIONS.map(m => ({key: m, label: c.durations[m]}))}
        selected={session.minutes}
        onSelect={session.chooseMinutes}
        disabled={active}
        note={c.durationNote}
      />

      <View style={styles.centre}>
        <BreathingCircle
          phase={active ? session.phase : null}
          secondsLeft={session.secondsLeft}
          running={session.status === 'running'}
          reducedMotion={reducedMotion}
          countdown={active ? session.secondsLeft : null}
          countdownLabel={c.a11y.seconds(session.secondsLeft)}
        />
        <PhaseLabel
          label={label}
          detail={
            active
              ? c.progress(session.cycle, session.remainingSeconds, session.finishing)
              : undefined
          }
        />
      </View>

      <View style={styles.row}>
        {session.status === 'idle' ? (
          <CalmButton label={c.start} accessibilityLabel={c.a11y.start} onPress={session.start} />
        ) : null}
        {session.status === 'running' ? (
          <CalmButton label={c.pause} accessibilityLabel={c.a11y.pause} onPress={session.pause} />
        ) : null}
        {session.status === 'paused' ? (
          <CalmButton label={c.resume} accessibilityLabel={c.a11y.resume} onPress={session.resume} />
        ) : null}
        {active ? (
          <CalmButton
            label={c.stop}
            accessibilityLabel={c.a11y.stop}
            onPress={session.stop}
            variant="secondary"
          />
        ) : null}
      </View>
    </CalmScreen>
  );
}

const styles = StyleSheet.create({
  centre: {alignItems: 'center', marginVertical: space.lg},
  row: {flexDirection: 'row', gap: space.sm},
});
