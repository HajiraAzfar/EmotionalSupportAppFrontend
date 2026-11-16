import React from 'react';
import {Image, ImageSourcePropType, StyleSheet, View} from 'react-native';

import {illustrations} from '../../assets/brand';
import CalmButton from '../components/CalmButton';
import CalmScreen from '../components/CalmScreen';
import CompletionCard from '../components/CompletionCard';
import StepCard from '../components/StepCard';
import {calm} from '../content';
import {useGroundingFlow} from '../hooks/useGroundingFlow';
import {StepExercise} from '../hooks/useGroundYourself';
import {colors, radius, space} from '../theme';

type Props = {
  exercise: StepExercise;
  onBack: () => void;
};

// Each exercise's picture from the brand sheet, above its steps.
const ART: Record<StepExercise, {source: ImageSourcePropType; width: number; height: number}> = {
  senses: {source: illustrations.butterfly, width: 120, height: 104},
  feet: {source: illustrations.stones, width: 190, height: 100},
  bodyScan: {source: illustrations.iconMeditate, width: 104, height: 104},
  pmr: {source: illustrations.lavender, width: 96, height: 108},
  movement: {source: illustrations.iconLeaf, width: 104, height: 104},
  affirmations: {source: illustrations.iconHeart, width: 104, height: 104},
  support: {source: illustrations.notAlone, width: 230, height: 66},
};

export default function GroundingScreen({exercise, onBack}: Props) {
  const g = calm.grounding;
  const content = g.exercises[exercise];
  const flow = useGroundingFlow(content.steps);
  const art = ART[exercise];

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
      {/* How far along: one segment a step, filled up to this one. */}
      <View style={styles.progress} accessible={false}>
        {Array.from({length: flow.total}, (_, i) => (
          <View key={i} style={[styles.segment, i <= flow.index && styles.segmentOn]} />
        ))}
      </View>

      <View style={styles.art}>
        <Image source={art.source} resizeMode="contain" accessible={false} style={{width: art.width, height: art.height}} />
      </View>

      <StepCard
        stepKey={`${exercise}-${flow.index}`}
        first={flow.index === 0}
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
  progress: {flexDirection: 'row', gap: 6, marginBottom: space.lg},
  segment: {flex: 1, height: 6, borderRadius: radius.pill, backgroundColor: colors.line},
  segmentOn: {backgroundColor: colors.primary},
  art: {alignItems: 'center', justifyContent: 'center', minHeight: 110, marginBottom: space.md},
  row: {flexDirection: 'row', gap: space.sm, marginTop: space.lg},
});
