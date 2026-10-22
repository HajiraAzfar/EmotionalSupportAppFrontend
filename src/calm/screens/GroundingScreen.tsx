import React from 'react';
import {StyleSheet, View} from 'react-native';

import CalmButton from '../components/CalmButton';
import CalmScreen from '../components/CalmScreen';
import CompletionCard from '../components/CompletionCard';
import StepCard from '../components/StepCard';
import {calm} from '../content';
import {useGroundingFlow} from '../hooks/useGroundingFlow';
import {space} from '../theme';

type Props = {
  exercise: 'senses' | 'feet';
  onBack: () => void;
};

export default function GroundingScreen({exercise, onBack}: Props) {
  const g = calm.grounding;
  const content = g.exercises[exercise];
  const flow = useGroundingFlow(content.steps);

  if (!flow.step) {
    return (
      <CalmScreen backLabel={calm.common.back} onBack={onBack}>
        <CompletionCard
          title={calm.done.title}
          body={calm.done.body}
          againLabel={calm.done.again}
          backLabel={calm.done.back}
          onAgain={flow.restart}
          onBack={onBack}
        />
      </CalmScreen>
    );
  }

  return (
    <CalmScreen title={content.title} backLabel={calm.common.back} onBack={onBack}>
      <StepCard
        stepLabel={g.stepOf(flow.index + 1, flow.total)}
        title={flow.step.title}
        prompt={flow.step.prompt}
      />
      <View style={styles.row}>
        {!flow.isFirst ? (
          <CalmButton label={g.previous} onPress={flow.previous} variant="secondary" />
        ) : null}
        <CalmButton label={flow.isLast ? g.finish : g.next} onPress={flow.next} />
      </View>
    </CalmScreen>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', gap: space.sm, marginTop: space.lg},
});
